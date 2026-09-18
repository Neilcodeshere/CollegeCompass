import { EmptyState } from "@/components/ui/empty-state";
import { EXAM_LABELS } from "@/lib/exams";
import { RESULTS_PER_BAND } from "@/lib/predictor/match";
import { CATEGORY_LABELS, MATCH_BANDS, MATCH_BAND_LABELS } from "@/lib/predictor/constants";
import { formatRank } from "@/lib/format";
import type { MatchBand, PredictionResult } from "@/types/api";

import { PredictionCard } from "./prediction-card";

/** Says plainly what each band means, in terms of the student's own rank. */
const BAND_EXPLANATIONS: Record<MatchBand, string> = {
  LIKELY: "Closed well after your rank last year, so admission looks comfortable.",
  BORDERLINE: "Closed close to your rank, so it could go either way.",
  REACH: "Closed ahead of your rank, so admission would need cutoffs to loosen.",
};

export function PredictorResults({ result }: { result: PredictionResult }) {
  const total = result.results.length;

  if (result.basisYear === null) {
    return (
      <EmptyState
        title="No cutoff data for this exam"
        description={`We don't have closing ranks for ${EXAM_LABELS[result.exam]} yet, so we can't suggest colleges.`}
      />
    );
  }

  if (total === 0) {
    return (
      <EmptyState
        title="No matching colleges were found"
        description={`No college in our data admitted ${CATEGORY_LABELS[result.category]} candidates near rank ${formatRank(result.rank)} in ${EXAM_LABELS[result.exam]}. Try another exam or category, or check the rank you entered.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-600" aria-live="polite">
        {Object.values(result.counts).reduce((sum, count) => sum + count, 0)} colleges match rank{" "}
        {formatRank(result.rank)} in {EXAM_LABELS[result.exam]} ({CATEGORY_LABELS[result.category]}
        ), based on {result.basisYear} final-round closing ranks.
      </p>

      {MATCH_BANDS.map((band) => {
        const predictions = result.results.filter((prediction) => prediction.band === band);
        if (predictions.length === 0) return null;
        const matchCount = result.counts[band];

        return (
          <section key={band} aria-labelledby={`band-${band}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`band-${band}`} className="text-lg font-semibold text-neutral-900">
                {MATCH_BAND_LABELS[band]}{" "}
                <span className="font-normal text-neutral-500 tabular-nums">({matchCount})</span>
              </h2>
              {matchCount > predictions.length ? (
                <p className="text-sm text-neutral-500">Showing the closest {RESULTS_PER_BAND}</p>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-neutral-600">{BAND_EXPLANATIONS[band]}</p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {predictions.map((prediction) => (
                <PredictionCard
                  key={prediction.college.id}
                  prediction={prediction}
                  basisYear={result.basisYear as number}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
