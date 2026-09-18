"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchColleges } from "@/lib/api/client";
import { serializeCollegeFilters } from "@/lib/filters/college-filters";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type { CollegeSummary, PaginatedResponse } from "@/types/api";

export type CollegesQueryOptions = {
  /** Filters the server rendered, so its result can seed the cache. */
  initialQuery: CollegeListQuery;
  initialData: PaginatedResponse<CollegeSummary>;
};

export const collegesQueryKey = (filters: CollegeListQuery) =>
  ["colleges", serializeCollegeFilters(filters)] as const;

export function useCollegesQuery(
  filters: CollegeListQuery,
  { initialQuery, initialData }: CollegesQueryOptions,
) {
  const key = collegesQueryKey(filters);
  const isInitialQuery = key[1] === collegesQueryKey(initialQuery)[1];

  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchColleges(filters, signal),
    // The server already rendered this exact query, so don't refetch it.
    ...(isInitialQuery && { initialData }),
    // While a new filter or page loads, keep showing the current results
    // instead of clearing the list back to skeletons.
    placeholderData: keepPreviousData,
  });
}
