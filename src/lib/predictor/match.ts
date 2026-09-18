/**
 * Rule-based college matching from historical closing ranks.
 *
 * A closing rank is the last merit-list position admitted to a course. We
 * compare it with the student's rank as a ratio:
 *
 *   ratio = closingRank / studentRank
 *
 *   ratio ≥ 1.10        Likely      the course closed well after this rank
 *   0.90 ≤ ratio < 1.10 Borderline  the rank is close to the cutoff
 *   0.70 ≤ ratio < 0.90 Reach       the cutoff was somewhat better than this rank
 *   ratio < 0.70        not shown   the cutoff was far better than this rank
 *
 * A ratio (rather than a fixed rank difference) scales naturally: being 500
 * ranks away matters a lot at rank 1,000 and very little at rank 2,00,000.
 */
import type {
  CollegeBasics,
  MatchBand,
  Prediction,
  PredictionCourse,
  PredictionCounts,
} from "@/types/api";

import { MATCH_BANDS } from "./constants";

export const BAND_THRESHOLDS = {
  likely: 1.1,
  borderline: 0.9,
  reach: 0.7,
} as const;

/** Colleges returned per band. Counts still report every match. */
export const RESULTS_PER_BAND = 20;

export type CutoffCandidate = {
  courseId: string;
  courseName: string;
  round: number;
  closingRank: number;
  college: CollegeBasics;
};

export function classifyRank(studentRank: number, closingRank: number): MatchBand | null {
  const ratio = closingRank / studentRank;
  if (ratio >= BAND_THRESHOLDS.likely) return "LIKELY";
  if (ratio >= BAND_THRESHOLDS.borderline) return "BORDERLINE";
  if (ratio >= BAND_THRESHOLDS.reach) return "REACH";
  return null;
}

/** How far a cutoff is from the student's rank, regardless of direction. */
function distance(studentRank: number, closingRank: number): number {
  return Math.abs(Math.log(closingRank / studentRank));
}

const bandOrder = (band: MatchBand) => MATCH_BANDS.indexOf(band);

/** Keeps only the last counselling round for each course, which is the final cutoff. */
export function latestRoundPerCourse(candidates: readonly CutoffCandidate[]): CutoffCandidate[] {
  const byCourse = new Map<string, CutoffCandidate>();
  for (const candidate of candidates) {
    const current = byCourse.get(candidate.courseId);
    if (!current || candidate.round > current.round) byCourse.set(candidate.courseId, candidate);
  }
  return [...byCourse.values()];
}

/**
 * Turns final-round cutoffs into ranked college recommendations:
 * - each course is classified into a band;
 * - a college takes the best band among its courses;
 * - colleges are ordered by band, then by how close their nearest matching
 *   course is to the student's rank, then by name.
 */
export function buildPredictions(
  candidates: readonly CutoffCandidate[],
  studentRank: number,
  limitPerBand: number = RESULTS_PER_BAND,
): { results: Prediction[]; counts: PredictionCounts } {
  const colleges = new Map<string, { college: CollegeBasics; courses: PredictionCourse[] }>();

  for (const candidate of latestRoundPerCourse(candidates)) {
    const band = classifyRank(studentRank, candidate.closingRank);
    if (!band) continue;
    const entry = colleges.get(candidate.college.id) ?? { college: candidate.college, courses: [] };
    entry.courses.push({
      courseId: candidate.courseId,
      name: candidate.courseName,
      closingRank: candidate.closingRank,
      band,
    });
    colleges.set(candidate.college.id, entry);
  }

  const ranked = [...colleges.values()]
    .map(({ college, courses }) => {
      const sortedCourses = [...courses].sort(
        (a, b) =>
          bandOrder(a.band) - bandOrder(b.band) ||
          distance(studentRank, a.closingRank) - distance(studentRank, b.closingRank) ||
          a.name.localeCompare(b.name),
      );
      const best = sortedCourses[0] as PredictionCourse;
      return {
        prediction: { college, band: best.band, courses: sortedCourses },
        closeness: distance(studentRank, best.closingRank),
      };
    })
    .sort(
      (a, b) =>
        bandOrder(a.prediction.band) - bandOrder(b.prediction.band) ||
        a.closeness - b.closeness ||
        a.prediction.college.name.localeCompare(b.prediction.college.name),
    )
    .map(({ prediction }) => prediction);

  const counts: PredictionCounts = { LIKELY: 0, BORDERLINE: 0, REACH: 0 };
  const results: Prediction[] = [];
  for (const prediction of ranked) {
    counts[prediction.band] += 1;
    if (counts[prediction.band] <= limitPerBand) results.push(prediction);
  }

  return { results, counts };
}
