"use client";

import { Select } from "@/components/ui/input";
import { Ownership } from "@/generated/prisma/enums";
import {
  FEE_BUCKETS,
  OWNERSHIP_LABELS,
  RATING_OPTIONS,
  type FeeBucketId,
} from "@/lib/colleges/constants";
import { feeBucketPatch, findFeeBucketId, type FilterPatch } from "@/lib/filters/college-filters";
import { formatRating } from "@/lib/format";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type { FilterOptions } from "@/types/api";

type Option<T extends string> = { value: T | undefined; label: string };

/**
 * Radio group for a filter. Radios show the current choice without being
 * opened, which matters for a sidebar the student scans while comparing.
 */
function RadioFilter<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Array<Option<T>>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-neutral-900">{legend}</legend>
      <div className="mt-2 space-y-1.5">
        {options.map((option) => (
          <label
            key={option.value ?? "any"}
            className="flex items-center gap-2 text-sm text-neutral-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value ?? ""}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-brand-600"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The sidebar and the mobile sheet both render this panel, so every id and
 * radio group name is namespaced: two groups sharing a `name` would behave as
 * one group and clear each other's selection.
 */
export function FilterPanel({
  idPrefix,
  filters,
  options,
  onChange,
}: {
  idPrefix: string;
  filters: CollegeListQuery;
  options: FilterOptions;
  onChange: (patch: FilterPatch) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={`${idPrefix}-state`} className="text-sm font-semibold text-neutral-900">
          State
        </label>
        <Select
          id={`${idPrefix}-state`}
          value={filters.state ?? ""}
          onChange={(event) => onChange({ state: event.target.value || undefined })}
          className="mt-2"
        >
          <option value="">All states</option>
          {options.states.map((state) => (
            <option key={state.name} value={state.name}>
              {state.name} ({state.count})
            </option>
          ))}
        </Select>
      </div>

      <RadioFilter<Ownership>
        name={`${idPrefix}-ownership`}
        legend="Ownership"
        value={filters.ownership}
        onChange={(ownership) => onChange({ ownership })}
        options={[
          { value: undefined, label: "Any" },
          { value: Ownership.GOVERNMENT, label: OWNERSHIP_LABELS.GOVERNMENT },
          { value: Ownership.PRIVATE, label: OWNERSHIP_LABELS.PRIVATE },
        ]}
      />

      <RadioFilter<FeeBucketId>
        name={`${idPrefix}-fees`}
        legend="Annual fees"
        value={findFeeBucketId(filters)}
        onChange={(bucket) => onChange(feeBucketPatch(bucket))}
        options={[
          { value: undefined, label: "Any" },
          ...FEE_BUCKETS.map((bucket) => ({ value: bucket.id, label: bucket.label })),
        ]}
      />

      <RadioFilter
        name={`${idPrefix}-rating`}
        legend="Rating"
        value={filters.minRating === undefined ? undefined : String(filters.minRating)}
        onChange={(rating) => onChange({ minRating: rating ? Number(rating) : undefined })}
        options={[
          { value: undefined, label: "Any" },
          ...RATING_OPTIONS.map((rating) => ({
            value: String(rating),
            label: `${formatRating(rating)} and above`,
          })),
        ]}
      />
    </div>
  );
}
