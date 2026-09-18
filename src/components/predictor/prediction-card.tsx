import { RatingValue } from "@/components/colleges/rating-value";
import { CompareButton } from "@/components/compare/compare-button";
import { ButtonLink } from "@/components/ui/button";
import { OWNERSHIP_LABELS } from "@/lib/colleges/constants";
import { formatCurrency, formatRank } from "@/lib/format";
import { MATCH_BAND_LABELS } from "@/lib/predictor/constants";
import { cx } from "@/lib/utils";
import type { MatchBand, Prediction } from "@/types/api";

const COURSES_SHOWN = 3;

const BAND_STYLES: Record<MatchBand, string> = {
  LIKELY: "border-success-600/30 bg-success-50 text-success-700",
  BORDERLINE: "border-warning-600/30 bg-warning-50 text-warning-700",
  REACH: "border-neutral-300 bg-neutral-100 text-neutral-700",
};

export function MatchBandBadge({ band }: { band: MatchBand }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        BAND_STYLES[band],
      )}
    >
      {MATCH_BAND_LABELS[band]}
    </span>
  );
}

export function PredictionCard({
  prediction,
  basisYear,
}: {
  prediction: Prediction;
  basisYear: number;
}) {
  const { college, courses, band } = prediction;
  const shown = courses.slice(0, COURSES_SHOWN);
  const remaining = courses.length - shown.length;

  return (
    <article className="flex flex-col rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900">{college.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            {college.city}, {college.state}
            <span aria-hidden="true"> · </span>
            {OWNERSHIP_LABELS[college.ownership]}
          </p>
        </div>
        <MatchBandBadge band={band} />
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">Fees</dt>
          <dd className="font-medium text-neutral-900 tabular-nums">
            {formatCurrency(college.annualFees)}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">Rating</dt>
          <dd className="font-medium text-neutral-900">
            <RatingValue rating={college.rating} reviewCount={college.reviewCount} />
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-neutral-200 pt-3">
        <div className="flex items-baseline justify-between gap-2 text-xs text-neutral-500">
          <span>Matching branches</span>
          <span>{basisYear} closing rank</span>
        </div>
        <ul className="mt-1.5 space-y-1">
          {shown.map((course) => (
            <li key={course.courseId} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 text-neutral-900">{course.name}</span>
              <span className="shrink-0 text-neutral-700 tabular-nums">
                {formatRank(course.closingRank)}
              </span>
            </li>
          ))}
        </ul>
        {remaining > 0 ? (
          <p className="mt-1.5 text-xs text-neutral-500">
            +{remaining} more matching {remaining === 1 ? "branch" : "branches"}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href={`/colleges/${college.slug}`} variant="secondary" size="sm">
          View college
        </ButtonLink>
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
