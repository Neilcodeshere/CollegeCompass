import { Star } from "lucide-react";

import { formatRating } from "@/lib/format";

/**
 * Shows a rating as a number rather than five stars: a single figure is easier
 * to compare down a column, and the review count shows how much to trust it.
 */
export function RatingValue({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <Star aria-hidden="true" className="size-3.5 translate-y-0.5 fill-rating text-rating" />
      <span className="tabular-nums">{formatRating(rating)}</span>
      {reviewCount !== undefined ? (
        <span className="text-xs font-normal text-neutral-500 tabular-nums">({reviewCount})</span>
      ) : null}
      <span className="sr-only">out of 5</span>
    </span>
  );
}
