import type { Degree, Ownership } from "@/generated/prisma/enums";

/** Listing sort options, in the order they appear in the UI. */
export const COLLEGE_SORTS = ["rating", "fees_asc", "fees_desc", "name"] as const;
export type CollegeSort = (typeof COLLEGE_SORTS)[number];

export const DEFAULT_COLLEGE_SORT: CollegeSort = "rating";

export const COLLEGE_SORT_LABELS: Record<CollegeSort, string> = {
  rating: "Highest rated",
  fees_asc: "Fees: low to high",
  fees_desc: "Fees: high to low",
  name: "Name (A–Z)",
};

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

/** Reviews shown on the college page. */
export const RECENT_REVIEW_LIMIT = 10;

export const MAX_COMPARE_COLLEGES = 3;

/**
 * Fee filter presets. Ranges are easier to choose (and to tap) than typing
 * rupee amounts, and they match how students think about cost.
 */
export const FEE_BUCKETS = [
  { id: "under-1l", label: "Under ₹1 lakh", minFees: undefined, maxFees: 99_999 },
  { id: "1l-2l", label: "₹1 – 2 lakh", minFees: 100_000, maxFees: 199_999 },
  { id: "2l-3l", label: "₹2 – 3 lakh", minFees: 200_000, maxFees: 299_999 },
  { id: "3l-plus", label: "₹3 lakh and above", minFees: 300_000, maxFees: undefined },
] as const;

export type FeeBucketId = (typeof FEE_BUCKETS)[number]["id"];

export const RATING_OPTIONS = [4.5, 4, 3.5, 3] as const;

export const OWNERSHIP_LABELS: Record<Ownership, string> = {
  GOVERNMENT: "Government",
  PRIVATE: "Private",
};

export const DEGREE_LABELS: Record<Degree, string> = {
  BTECH: "B.Tech",
  MTECH: "M.Tech",
  MBA: "MBA",
  MCA: "MCA",
};
