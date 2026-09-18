import Link from "next/link";
import type { ReactNode } from "react";

import { CompareButton } from "@/components/compare/compare-button";
import { OWNERSHIP_LABELS } from "@/lib/colleges/constants";
import { formatCurrency, formatPackage } from "@/lib/format";
import type { CollegeSummary } from "@/types/api";

import { RatingValue } from "./rating-value";

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-neutral-900 tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * One row of results. Laid out as aligned columns rather than a card grid so
 * fees, packages and ratings can be compared straight down the list.
 */
export function CollegeResultItem({ college }: { college: CollegeSummary }) {
  return (
    <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6 sm:px-5">
      <div className="min-w-0">
        <h3 className="text-base font-semibold">
          <Link
            href={`/colleges/${college.slug}`}
            className="text-neutral-900 underline-offset-2 hover:underline"
          >
            {college.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          {college.city}, {college.state}
          <span aria-hidden="true"> · </span>
          {OWNERSHIP_LABELS[college.ownership]}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-4 sm:w-80 sm:gap-6">
        <Stat label="Annual fees">{formatCurrency(college.annualFees)}</Stat>
        <Stat label="Avg. package">
          {college.averagePackage === null ? (
            <span className="font-normal text-neutral-500">Not reported</span>
          ) : (
            formatPackage(college.averagePackage)
          )}
        </Stat>
        <Stat label="Rating">
          <RatingValue rating={college.rating} reviewCount={college.reviewCount} />
        </Stat>
      </dl>

      <div className="justify-self-start">
        <CompareButton
          college={{
            slug: college.slug,
            name: college.name,
            shortName: college.shortName,
            city: college.city,
          }}
        />
      </div>
    </article>
  );
}
