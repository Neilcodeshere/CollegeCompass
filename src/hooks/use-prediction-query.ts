"use client";

import { useQuery } from "@tanstack/react-query";

import { predictColleges } from "@/lib/api/client";
import type { PredictRequest } from "@/lib/validation/predictor";
import type { PredictionResult } from "@/types/api";

export const predictionKey = (input: PredictRequest | null) =>
  input ? `${input.exam}|${input.rank}|${input.category}` : "none";

/**
 * Predictions are a read, not a mutation: the same exam and rank always give
 * the same answer, so they are cached like any other query even though the
 * endpoint is a POST (the inputs are a body, not a path).
 */
export function usePredictionQuery(
  input: PredictRequest | null,
  initial?: { input: PredictRequest; data: PredictionResult },
) {
  const key = predictionKey(input);
  const isInitial = initial !== undefined && key === predictionKey(initial.input);

  return useQuery({
    queryKey: ["prediction", key],
    queryFn: ({ signal }) =>
      predictColleges(input as PredictRequest, signal).then((response) => response.data),
    enabled: input !== null,
    ...(isInitial && { initialData: initial.data }),
    staleTime: 5 * 60_000,
  });
}
