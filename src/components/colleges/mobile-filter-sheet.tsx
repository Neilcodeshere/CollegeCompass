"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { applyFilterPatch, type FilterPatch } from "@/lib/filters/college-filters";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type { FilterOptions } from "@/types/api";

import { FilterPanel } from "./filter-panel";

/**
 * On phones, filter changes are collected in a draft and applied on submit.
 * Refetching behind a full-screen overlay would spend requests on results the
 * student can't see, and this lets them change several filters at once.
 *
 * Rendered only while open, so the draft starts from the live filters every
 * time without an effect to reset it.
 */
export function MobileFilterSheet({
  filters,
  options,
  onApply,
  onClear,
  onClose,
}: {
  filters: CollegeListQuery;
  options: FilterOptions;
  onApply: (patch: FilterPatch) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);

  return (
    <Sheet
      onClose={onClose}
      title="Filters"
      footer={
        <>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              onClear();
              onClose();
            }}
          >
            Clear all
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              onApply({
                state: draft.state,
                ownership: draft.ownership,
                minFees: draft.minFees,
                maxFees: draft.maxFees,
                minRating: draft.minRating,
              });
              onClose();
            }}
          >
            Show results
          </Button>
        </>
      }
    >
      <FilterPanel
        idPrefix="sheet"
        filters={draft}
        options={options}
        onChange={(patch) => setDraft((current) => applyFilterPatch(current, patch))}
      />
    </Sheet>
  );
}
