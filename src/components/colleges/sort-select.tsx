"use client";

import { Select } from "@/components/ui/input";
import { COLLEGE_SORT_LABELS, COLLEGE_SORTS, type CollegeSort } from "@/lib/colleges/constants";

export function SortSelect({
  value,
  onChange,
}: {
  value: CollegeSort;
  onChange: (sort: CollegeSort) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-sm text-neutral-600">
        Sort by
      </label>
      <Select
        id="sort"
        value={value}
        onChange={(event) => onChange(event.target.value as CollegeSort)}
        className="w-44"
      >
        {COLLEGE_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {COLLEGE_SORT_LABELS[sort]}
          </option>
        ))}
      </Select>
    </div>
  );
}
