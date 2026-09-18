"use client";

import { SlidersHorizontal } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner, ErrorState } from "@/components/ui/error-state";
import { useCollegeFilters } from "@/hooks/use-college-filters";
import { useCollegesQuery } from "@/hooks/use-colleges-query";
import { countActiveFilters } from "@/lib/filters/college-filters";
import { cx } from "@/lib/utils";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type { CollegeSummary, FilterOptions, PaginatedResponse } from "@/types/api";

import { ActiveFilters } from "./active-filters";
import { CollegePagination } from "./college-pagination";
import { CollegeResults, CollegeResultsSkeleton } from "./college-results";
import { FilterPanel } from "./filter-panel";
import { MobileFilterSheet } from "./mobile-filter-sheet";
import { SearchInput } from "./search-input";
import { SortSelect } from "./sort-select";

type CollegeDiscoveryProps = {
  /** Filters the server rendered with, used to seed the query cache. */
  initialQuery: CollegeListQuery;
  initialData: PaginatedResponse<CollegeSummary>;
  filterOptions: FilterOptions;
  totalColleges: number;
};

export function CollegeDiscovery({
  initialQuery,
  initialData,
  filterOptions,
  totalColleges,
}: CollegeDiscoveryProps) {
  const { filters, setFilters, clearFilters } = useCollegeFilters();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, isError, isFetching, isPlaceholderData, refetch } = useCollegesQuery(filters, {
    initialQuery,
    initialData,
  });

  const pagination = data?.pagination;
  const colleges = data?.data ?? [];
  const activeFilterCount = countActiveFilters(filters);
  const isPageOutOfRange = Boolean(
    pagination && pagination.total > 0 && filters.page > pagination.totalPages,
  );

  const goToPage = (page: number) => {
    setFilters({ page });
    resultsRef.current?.scrollIntoView();
  };

  // Typing uses `replace` so a search phrase doesn't leave one history entry
  // per keystroke for the Back button to walk through.
  const handleSearchChange = useCallback(
    (search: string | undefined) => setFilters({ search }, "replace"),
    [setFilters],
  );

  const resultsSummary = () => {
    if (!pagination) return "Loading colleges…";
    if (pagination.total === 0) return "No colleges found";
    const noun = pagination.total === 1 ? "college" : "colleges";
    if (isPageOutOfRange) return `${pagination.total} ${noun} found`;
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${from}–${to} of ${pagination.total} ${noun}`;
  };

  const results = () => {
    if (isError && !data) {
      return (
        <ErrorState
          title="Unable to load colleges"
          description="The list couldn't be loaded just now. Please try again."
          onRetry={() => void refetch()}
        />
      );
    }
    if (!data) return <CollegeResultsSkeleton />;
    if (isPageOutOfRange && pagination) {
      return (
        <EmptyState
          title={`Page ${filters.page} doesn't exist`}
          description={`These filters return ${pagination.total} colleges across ${pagination.totalPages} pages.`}
          action={<Button onClick={() => goToPage(pagination.totalPages)}>Go to last page</Button>}
        />
      );
    }
    if (colleges.length === 0) {
      return (
        <EmptyState
          title="No colleges match your filters"
          description="Try widening the fee range, choosing a different state, or searching for another city."
          action={
            activeFilterCount > 0 ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      );
    }
    return <CollegeResults colleges={colleges} />;
  };

  return (
    <PageContainer className="py-8">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Colleges</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Search {totalColleges} colleges by location, fees and rating.
        </p>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-brand-700 underline underline-offset-2"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <FilterPanel
                idPrefix="sidebar"
                filters={filters}
                options={filterOptions}
                onChange={(patch) => setFilters(patch)}
              />
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <SearchInput value={filters.search ?? ""} onSearchChange={handleSearchChange} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600" aria-live="polite">
              {resultsSummary()}
              {isFetching ? <span className="ml-2 text-neutral-500">Updating…</span> : null}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                onClick={() => setSheetOpen(true)}
                aria-expanded={isSheetOpen}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.75} />
                Filters
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
              <SortSelect value={filters.sort} onChange={(sort) => setFilters({ sort })} />
            </div>
          </div>

          <ActiveFilters filters={filters} onChange={setFilters} />

          {isError && data ? (
            <ErrorBanner
              description="Couldn't refresh the results, so these may be out of date."
              onRetry={() => void refetch()}
            />
          ) : null}

          <div
            ref={resultsRef}
            aria-busy={isFetching}
            className={cx(
              "scroll-mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white",
              isPlaceholderData && "opacity-60",
            )}
          >
            {results()}
          </div>

          {pagination && !isPageOutOfRange ? (
            <CollegePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          ) : null}

          <p className="text-xs text-neutral-500">
            Average package is the most recent reported year. All figures are sample data.
          </p>
        </div>
      </div>

      {isSheetOpen ? (
        <MobileFilterSheet
          onClose={() => setSheetOpen(false)}
          filters={filters}
          options={filterOptions}
          onApply={setFilters}
          onClear={clearFilters}
        />
      ) : null}
    </PageContainer>
  );
}
