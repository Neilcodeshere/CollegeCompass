import "server-only";

import { db } from "@/lib/db";
import { BAND_THRESHOLDS, buildPredictions } from "@/lib/predictor/match";
import type { PredictRequest } from "@/lib/validation/predictor";
import type { PredictionResult } from "@/types/api";

import { collegeBasicsSelect } from "./colleges";

export async function predictColleges({
  exam,
  rank,
  category,
}: PredictRequest): Promise<PredictionResult> {
  const latest = await db.cutoff.aggregate({ where: { exam }, _max: { year: true } });
  const basisYear = latest._max.year;
  if (basisYear === null) {
    return {
      exam,
      category,
      rank,
      basisYear,
      results: [],
      counts: { LIKELY: 0, BORDERLINE: 0, REACH: 0 },
    };
  }

  // Filter in the database with the loosest band so only possible matches are
  // loaded. Final rounds always close at or above earlier rounds, so this never
  // drops a course's final-round row.
  const rows = await db.cutoff.findMany({
    where: {
      exam,
      category,
      year: basisYear,
      closingRank: { gte: Math.ceil(rank * BAND_THRESHOLDS.reach) },
    },
    select: {
      round: true,
      closingRank: true,
      course: {
        select: { id: true, name: true, college: { select: collegeBasicsSelect } },
      },
    },
  });

  const { results, counts } = buildPredictions(
    rows.map(({ round, closingRank, course }) => ({
      courseId: course.id,
      courseName: course.name,
      round,
      closingRank,
      college: course.college,
    })),
    rank,
  );

  return { exam, category, rank, basisYear, results, counts };
}
