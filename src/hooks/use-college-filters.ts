"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  applyFilterPatch,
  clearNarrowingFilters,
  parseCollegeFilters,
  serializeCollegeFilters,
  type FilterPatch,
} from "@/lib/filters/college-filters";
import type { CollegeListQuery } from "@/lib/validation/colleges";

type HistoryMode = "push" | "replace";

export type UseCollegeFilters = {
  filters: CollegeListQuery;
  /**
   * `push` adds a history entry so Back undoes the change (filters, sort,
   * paging). `replace` is for debounced typing, which would otherwise add one
   * entry per keystroke.
   */
  setFilters: (patch: FilterPatch, mode?: HistoryMode) => void;
  clearFilters: () => void;
};

export function useCollegeFilters(): UseCollegeFilters {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseCollegeFilters(searchParams), [searchParams]);

  /**
   * Updates the URL with the History API rather than `router.push`. A router
   * navigation would re-run the server component and query the database again
   * for data the client is already fetching; this keeps the URL in sync (Next
   * feeds it back through `useSearchParams`) without that duplicate work.
   */
  const write = useCallback(
    (next: CollegeListQuery, mode: HistoryMode) => {
      const search = serializeCollegeFilters(next);
      const url = search ? `${pathname}?${search}` : pathname;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  const setFilters = useCallback(
    (patch: FilterPatch, mode: HistoryMode = "push") => {
      write(applyFilterPatch(filters, patch), mode);
    },
    [filters, write],
  );

  const clearFilters = useCallback(() => {
    write(clearNarrowingFilters(filters), "push");
  }, [filters, write]);

  return { filters, setFilters, clearFilters };
}
