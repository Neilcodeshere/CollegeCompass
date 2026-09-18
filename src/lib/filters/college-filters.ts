/**
 * The URL is the single source of truth for the discovery page: refreshing,
 * sharing a link and the browser's back button all keep working because the
 * filters live nowhere else.
 *
 * These helpers are pure so the server page, the client hook and the API
 * request all read and write the query string the same way.
 */
import {
  DEFAULT_COLLEGE_SORT,
  DEFAULT_PAGE_SIZE,
  FEE_BUCKETS,
  type FeeBucketId,
} from "@/lib/colleges/constants";
import { collegeListQuerySchema, type CollegeListQuery } from "@/lib/validation/colleges";

/** Written in this order so the same filters always produce the same URL. */
const PARAM_ORDER = [
  "search",
  "state",
  "ownership",
  "minFees",
  "maxFees",
  "minRating",
  "sort",
  "page",
  "limit",
] as const satisfies ReadonlyArray<keyof CollegeListQuery>;

export const DEFAULT_FILTERS: CollegeListQuery = {
  sort: DEFAULT_COLLEGE_SORT,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
};

/** Filters a student actually chose, as opposed to search, sort and paging. */
const NARROWING_KEYS = ["state", "ownership", "minFees", "maxFees", "minRating"] as const;

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function toRecord(params: RawParams): Record<string, string> {
  if (params instanceof URLSearchParams) return Object.fromEntries(params);
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    // Repeated parameters (?state=a&state=b) arrive as arrays; keep the last.
    const single = Array.isArray(value) ? value.at(-1) : value;
    if (single !== undefined) record[key] = single;
  }
  return record;
}

/**
 * Reads filters from a query string, ignoring anything invalid rather than
 * failing: a hand-edited or stale URL should still show results.
 */
export function parseCollegeFilters(params: RawParams): CollegeListQuery {
  const record = toRecord(params);

  const parsed = collegeListQuerySchema.safeParse(record);
  if (parsed.success) return parsed.data;

  // Drop only the parameters that failed, then try again.
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") delete record[key];
  }
  const retried = collegeListQuerySchema.safeParse(record);
  return retried.success ? retried.data : DEFAULT_FILTERS;
}

/** Serialises filters, leaving out defaults so shared URLs stay readable. */
export function serializeCollegeFilters(filters: CollegeListQuery): string {
  const params = new URLSearchParams();
  for (const key of PARAM_ORDER) {
    const value = filters[key];
    if (value === undefined) continue;
    if (key === "sort" && value === DEFAULT_FILTERS.sort) continue;
    if (key === "page" && value === DEFAULT_FILTERS.page) continue;
    if (key === "limit" && value === DEFAULT_FILTERS.limit) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export type FilterPatch = Partial<CollegeListQuery>;

/**
 * Applies a change to the current filters. Anything other than a page change
 * sends the student back to page 1, because results 25–36 of the old query
 * say nothing about the new one.
 */
export function applyFilterPatch(current: CollegeListQuery, patch: FilterPatch): CollegeListQuery {
  const keys = Object.keys(patch) as Array<keyof CollegeListQuery>;
  const pageOnly = keys.length > 0 && keys.every((key) => key === "page");
  const next: CollegeListQuery = { ...current, ...patch };

  if (!pageOnly) next.page = 1;

  // Remove keys explicitly set back to "no value" so they leave the URL.
  for (const key of keys) {
    if (patch[key] === undefined) delete next[key];
  }
  return next;
}

/** Clears the narrowing filters but keeps the student's search text and sort. */
export function clearNarrowingFilters(current: CollegeListQuery): CollegeListQuery {
  const next: CollegeListQuery = { ...current, page: 1 };
  for (const key of NARROWING_KEYS) delete next[key];
  return next;
}

export function countActiveFilters(filters: CollegeListQuery): number {
  let count = 0;
  if (filters.state !== undefined) count += 1;
  if (filters.ownership !== undefined) count += 1;
  if (filters.minFees !== undefined || filters.maxFees !== undefined) count += 1;
  if (filters.minRating !== undefined) count += 1;
  return count;
}

export function findFeeBucketId(filters: CollegeListQuery): FeeBucketId | undefined {
  return FEE_BUCKETS.find(
    (bucket) => bucket.minFees === filters.minFees && bucket.maxFees === filters.maxFees,
  )?.id;
}

export function feeBucketPatch(id: FeeBucketId | undefined): FilterPatch {
  const bucket = FEE_BUCKETS.find((option) => option.id === id);
  return { minFees: bucket?.minFees, maxFees: bucket?.maxFees };
}
