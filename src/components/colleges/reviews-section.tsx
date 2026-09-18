import { Star } from "lucide-react";

import { formatRating, formatReviewDate } from "@/lib/format";
import type { RatingDistribution, Review } from "@/types/api";

function DistributionRow({ stars, count, total }: { stars: number; count: number; total: number }) {
  const share = total === 0 ? 0 : count / total;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-neutral-600 tabular-nums">{stars}</span>
      <Star aria-hidden="true" className="size-3 fill-rating text-rating" />
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <span
          className="block h-full rounded-full bg-neutral-400"
          style={{ width: `${share * 100}%` }}
        />
      </span>
      <span className="w-8 text-right text-neutral-600 tabular-nums">{count}</span>
    </div>
  );
}

/**
 * Rating summary plus the most recent reviews. The distribution matters as
 * much as the average: a 3.8 from mostly 5s and 1s is a different college
 * from a 3.8 where everyone agrees.
 */
export function ReviewsSection({
  rating,
  reviewCount,
  distribution,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  distribution: RatingDistribution;
  reviews: Review[];
}) {
  if (reviewCount === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
        No student reviews yet for this college.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-neutral-900 tabular-nums">
            {formatRating(rating)}
          </span>
          <span className="text-sm text-neutral-600">out of 5</span>
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </p>
        <div className="mt-4 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => (
            <DistributionRow
              key={stars}
              stars={stars}
              count={distribution[stars]}
              total={reviewCount}
            />
          ))}
        </div>
      </div>

      <div>
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {reviews.map((review) => (
            <li key={review.id} className="px-4 py-4">
              <article>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-sm font-semibold text-neutral-900">{review.title}</h3>
                  <p className="text-sm text-neutral-600 tabular-nums">
                    <span className="sr-only">Rated </span>
                    {review.rating}/5
                  </p>
                </div>
                <p className="mt-1.5 text-sm text-neutral-700">{review.body}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {review.authorLabel}
                  <span aria-hidden="true"> · </span>
                  {formatReviewDate(review.createdAt)}
                </p>
              </article>
            </li>
          ))}
        </ul>
        {reviewCount > reviews.length ? (
          <p className="mt-3 text-sm text-neutral-600">
            Showing the {reviews.length} most recent of {reviewCount} reviews.
          </p>
        ) : null}
      </div>
    </div>
  );
}
