"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SearchInput } from "@/components/colleges/search-input";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchColleges } from "@/lib/api/client";
import { DEFAULT_COLLEGE_SORT } from "@/lib/colleges/constants";
import type { CompareItem } from "@/lib/compare/selection";
import { formatCurrency } from "@/lib/format";
import type { CollegeSummary } from "@/types/api";

const RESULT_LIMIT = 8;

/**
 * Search-and-pick list rather than a combobox: the student is choosing from
 * results, not completing a text field, and a list of buttons needs no custom
 * keyboard handling.
 */
export function AddCollegeDialog({
  selectedSlugs,
  onAdd,
  onClose,
}: {
  selectedSlugs: string[];
  onAdd: (college: CompareItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState<string | undefined>(undefined);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["compare-search", search ?? ""],
    queryFn: ({ signal }) =>
      fetchColleges({ search, sort: DEFAULT_COLLEGE_SORT, page: 1, limit: RESULT_LIMIT }, signal),
  });

  const pick = (college: CollegeSummary) => {
    onAdd({
      slug: college.slug,
      name: college.name,
      shortName: college.shortName,
      city: college.city,
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="Add a college">
      <SearchInput value={search ?? ""} onSearchChange={setSearch} />

      <div className="mt-4">
        {isError ? (
          <div className="py-6 text-center text-sm text-neutral-600">
            <p>Couldn’t load colleges.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 font-medium text-brand-700 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : isPending ? (
          <ul className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="rounded-md border border-neutral-200 px-3 py-2.5">
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="mt-2 h-3 w-32" />
              </li>
            ))}
          </ul>
        ) : data.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-600">
            No colleges match that search.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.data.map((college) => {
              const alreadySelected = selectedSlugs.includes(college.slug);
              return (
                <li key={college.id}>
                  <button
                    type="button"
                    onClick={() => pick(college)}
                    disabled={alreadySelected}
                    className="w-full rounded-md border border-neutral-200 px-3 py-2.5 text-left hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:hover:bg-neutral-100"
                  >
                    <span className="block text-sm font-medium text-neutral-900">
                      {college.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-600">
                      {college.city}, {college.state}
                      <span aria-hidden="true"> · </span>
                      {formatCurrency(college.annualFees)} per year
                      {alreadySelected ? (
                        <span className="font-medium"> · Already comparing</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
