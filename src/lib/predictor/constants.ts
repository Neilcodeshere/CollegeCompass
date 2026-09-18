import type { Category } from "@/generated/prisma/enums";
import type { MatchBand } from "@/types/api";

export const CATEGORIES: readonly Category[] = ["GENERAL", "EWS", "OBC", "SC", "ST"];

export const CATEGORY_LABELS: Record<Category, string> = {
  GENERAL: "General",
  EWS: "EWS",
  OBC: "OBC (non-creamy layer)",
  SC: "SC",
  ST: "ST",
};

/** Bands in display order, most attainable first. */
export const MATCH_BANDS: readonly MatchBand[] = ["LIKELY", "BORDERLINE", "REACH"];

export const MATCH_BAND_LABELS: Record<MatchBand, string> = {
  LIKELY: "Likely",
  BORDERLINE: "Borderline",
  REACH: "Reach",
};
