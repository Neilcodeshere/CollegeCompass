import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { OWNERSHIP_LABELS } from "@/lib/colleges/constants";
import { EXAM_LABELS } from "@/lib/exams";
import { formatCurrency, formatPackage, formatPercent } from "@/lib/format";
import type { CollegeDetail } from "@/types/api";

import { RatingValue } from "./rating-value";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-neutral-900 tabular-nums">{children}</dd>
    </div>
  );
}

const NOT_REPORTED = <span className="text-base font-normal text-neutral-500">Not reported</span>;

/**
 * Identity and headline numbers. Details that may be missing (founding year,
 * accreditation, placement figures) are left out rather than shown as blanks.
 */
export function CollegeHeader({ college, action }: { college: CollegeDetail; action?: ReactNode }) {
  const latestPlacement = college.placements[0];

  const meta = [
    `${college.city}, ${college.state}`,
    OWNERSHIP_LABELS[college.ownership],
    college.establishedYear ? `Established ${college.establishedYear}` : null,
    college.accreditation,
  ].filter(Boolean);

  return (
    <header>
      <Link
        href="/colleges"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
      >
        <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
        All colleges
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-900">{college.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {meta.map((item, index) => (
              <span key={item}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                {item}
              </span>
            ))}
          </p>
          {college.exams.length > 0 ? (
            <p className="mt-2 text-sm text-neutral-600">
              B.Tech admissions through{" "}
              <span className="font-medium text-neutral-900">
                {college.exams.map((exam) => EXAM_LABELS[exam]).join(", ")}
              </span>
            </p>
          ) : null}
        </div>
        {action}
      </div>

      <dl className="mt-6 grid grid-cols-2 divide-neutral-200 rounded-lg border border-neutral-200 bg-white sm:grid-cols-4 sm:divide-x">
        <Fact label="Annual fees (B.Tech)">{formatCurrency(college.annualFees)}</Fact>
        <Fact label={`Average package${latestPlacement ? ` (${latestPlacement.year})` : ""}`}>
          {latestPlacement ? formatPackage(latestPlacement.averagePackage) : NOT_REPORTED}
        </Fact>
        <Fact label="Students placed">
          {latestPlacement ? formatPercent(latestPlacement.placementRate) : NOT_REPORTED}
        </Fact>
        <Fact label="Student rating">
          <RatingValue rating={college.rating} reviewCount={college.reviewCount} />
        </Fact>
      </dl>
    </header>
  );
}
