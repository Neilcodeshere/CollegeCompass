"use client";

import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { RatingValue } from "@/components/colleges/rating-value";
import { OWNERSHIP_LABELS } from "@/lib/colleges/constants";
import { EXAM_LABELS } from "@/lib/exams";
import { formatCurrency, formatPackage, formatPercent, formatRank } from "@/lib/format";
import { cx } from "@/lib/utils";
import type { ComparisonCollege } from "@/types/api";

type Row = {
  label: string;
  /** What to show in each column. */
  render: (college: ComparisonCollege) => ReactNode;
  /** Optional numeric value used to mark the best column in this row. */
  value?: (college: ComparisonCollege) => number | null;
  /** Which end of the range is the useful one. */
  best?: "lowest" | "highest";
};

const ROWS: Row[] = [
  {
    label: "Location",
    render: (college) => `${college.city}, ${college.state}`,
  },
  {
    label: "Ownership",
    render: (college) => OWNERSHIP_LABELS[college.ownership],
  },
  {
    label: "Established",
    render: (college) => college.establishedYear ?? notReported,
  },
  {
    label: "Accreditation",
    render: (college) => college.accreditation ?? notReported,
  },
  {
    label: "Exams accepted",
    render: (college) =>
      college.exams.length > 0
        ? college.exams.map((exam) => EXAM_LABELS[exam]).join(", ")
        : notReported,
  },
  {
    label: "Annual fees (B.Tech)",
    render: (college) => formatCurrency(college.annualFees),
    value: (college) => college.annualFees,
    best: "lowest",
  },
  {
    label: "Student rating",
    render: (college) => <RatingValue rating={college.rating} reviewCount={college.reviewCount} />,
    value: (college) => college.rating,
    best: "highest",
  },
  {
    label: "Average package",
    render: (college) =>
      college.latestPlacement ? formatPackage(college.latestPlacement.averagePackage) : notReported,
    value: (college) => college.latestPlacement?.averagePackage ?? null,
    best: "highest",
  },
  {
    label: "Highest package",
    render: (college) =>
      college.latestPlacement ? formatPackage(college.latestPlacement.highestPackage) : notReported,
    value: (college) => college.latestPlacement?.highestPackage ?? null,
    best: "highest",
  },
  {
    label: "Students placed",
    render: (college) =>
      college.latestPlacement ? formatPercent(college.latestPlacement.placementRate) : notReported,
    value: (college) => college.latestPlacement?.placementRate ?? null,
    best: "highest",
  },
  {
    label: "Recruiters",
    render: (college) =>
      college.latestPlacement ? formatRank(college.latestPlacement.recruiterCount) : notReported,
    value: (college) => college.latestPlacement?.recruiterCount ?? null,
    best: "highest",
  },
  {
    label: "Courses offered",
    render: (college) => college.courseCount,
    value: (college) => college.courseCount,
    best: "highest",
  },
];

const notReported = <span className="text-neutral-500">Not reported</span>;

/** Marks the best column, but only when the values actually differ. */
function bestSlugs(row: Row, colleges: ComparisonCollege[]): Set<string> {
  if (!row.value || !row.best || colleges.length < 2) return new Set();
  const values = colleges.map((college) => ({ slug: college.slug, value: row.value?.(college) }));
  const known = values.filter(
    (entry): entry is { slug: string; value: number } => entry.value !== null,
  );
  if (known.length < 2) return new Set();

  const target =
    row.best === "lowest"
      ? Math.min(...known.map((entry) => entry.value))
      : Math.max(...known.map((entry) => entry.value));
  if (known.every((entry) => entry.value === target)) return new Set();
  return new Set(known.filter((entry) => entry.value === target).map((entry) => entry.slug));
}

const GRID_COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/**
 * One table for both layouts. From `sm` up it is a normal side-by-side table;
 * below that each row becomes a full-width label with the values in equal
 * columns underneath, so nothing shrinks and there is no sideways scrolling.
 */
export function ComparisonTable({
  colleges,
  onRemove,
}: {
  colleges: ComparisonCollege[];
  onRemove: (slug: string) => void;
}) {
  const columns = GRID_COLUMNS[colleges.length] ?? "grid-cols-3";
  const cell = "px-3 py-2 text-sm sm:table-cell sm:border-b sm:border-neutral-200 sm:px-4 sm:py-3";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <table className="w-full">
        <caption className="sr-only">
          Comparison of {colleges.map((college) => college.name).join(", ")}
        </caption>
        <thead className="sticky top-0 z-10 bg-white sm:static">
          <tr className={cx("grid border-b border-neutral-200 sm:table-row", columns)}>
            <th className="hidden sm:table-cell sm:w-52 sm:border-b sm:border-neutral-200">
              {/* Names the column of row labels for screen readers. */}
              <span className="sr-only">Detail</span>
            </th>
            {colleges.map((college) => (
              <th
                key={college.slug}
                scope="col"
                className="px-3 py-3 text-left align-top sm:table-cell sm:border-b sm:border-neutral-200 sm:px-4"
              >
                <div className="flex items-start justify-between gap-1">
                  <Link
                    href={`/colleges/${college.slug}`}
                    className="text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline"
                  >
                    <span className="sm:hidden">{college.shortName}</span>
                    <span className="hidden sm:inline">{college.name}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemove(college.slug)}
                    className="-mt-1 -mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X aria-hidden="true" className="size-4" strokeWidth={2} />
                    <span className="sr-only">Remove {college.name}</span>
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const best = bestSlugs(row, colleges);
            return (
              <tr
                key={row.label}
                className={cx(
                  "grid border-b border-neutral-200 py-2 last:border-0 sm:table-row sm:border-0 sm:py-0",
                  columns,
                )}
              >
                <th
                  scope="row"
                  className="col-span-full px-3 pt-1 pb-0.5 text-left text-xs font-medium text-neutral-500 sm:table-cell sm:w-52 sm:border-b sm:border-neutral-200 sm:px-4 sm:py-3 sm:text-sm sm:font-normal sm:text-neutral-600"
                >
                  {row.label}
                </th>
                {colleges.map((college) => (
                  <td key={college.slug} className={cell}>
                    <span className="font-medium text-neutral-900 tabular-nums">
                      {row.render(college)}
                    </span>
                    {best.has(college.slug) ? (
                      <span className="mt-0.5 block text-xs font-medium text-success-700">
                        {row.best === "lowest" ? "Lowest" : "Highest"}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
