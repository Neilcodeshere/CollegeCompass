"use client";

import { X } from "lucide-react";

import { FEE_BUCKETS, OWNERSHIP_LABELS } from "@/lib/colleges/constants";
import { findFeeBucketId, type FilterPatch } from "@/lib/filters/college-filters";
import { formatCurrency, formatRating } from "@/lib/format";
import type { CollegeListQuery } from "@/lib/validation/colleges";

type Chip = { key: string; label: string; patch: FilterPatch };

function buildChips(filters: CollegeListQuery): Chip[] {
  const chips: Chip[] = [];

  if (filters.state) {
    chips.push({ key: "state", label: filters.state, patch: { state: undefined } });
  }
  if (filters.ownership) {
    chips.push({
      key: "ownership",
      label: OWNERSHIP_LABELS[filters.ownership],
      patch: { ownership: undefined },
    });
  }
  if (filters.minFees !== undefined || filters.maxFees !== undefined) {
    const bucketId = findFeeBucketId(filters);
    const bucket = FEE_BUCKETS.find((option) => option.id === bucketId);
    chips.push({
      key: "fees",
      label:
        bucket?.label ??
        [
          filters.minFees !== undefined ? `From ${formatCurrency(filters.minFees)}` : null,
          filters.maxFees !== undefined ? `Up to ${formatCurrency(filters.maxFees)}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      patch: { minFees: undefined, maxFees: undefined },
    });
  }
  if (filters.minRating !== undefined) {
    chips.push({
      key: "rating",
      label: `${formatRating(filters.minRating)}+ rating`,
      patch: { minRating: undefined },
    });
  }

  return chips;
}

/** Shows which filters are narrowing the results, each removable on its own. */
export function ActiveFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: CollegeListQuery;
  onChange: (patch: FilterPatch) => void;
  onClear: () => void;
}) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="sr-only">Active filters</h2>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.patch)}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white py-1 pr-2 pl-3 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" strokeWidth={2} />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      {chips.length > 1 ? (
        <button
          type="button"
          onClick={onClear}
          className="px-1 text-sm font-medium text-brand-700 underline underline-offset-2"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
