import type { Exam } from "@/generated/prisma/enums";

/** Display order used wherever exams are listed. */
export const EXAMS: readonly Exam[] = ["JEE_MAIN", "MHT_CET", "KCET", "WBJEE"];

export const EXAM_LABELS: Record<Exam, string> = {
  JEE_MAIN: "JEE Main",
  MHT_CET: "MHT CET",
  KCET: "KCET",
  WBJEE: "WBJEE",
};

/**
 * Largest rank we accept per exam: a little above the size of each merit
 * list, so a typo like an extra digit is caught before searching.
 */
export const EXAM_MAX_RANK: Record<Exam, number> = {
  JEE_MAIN: 1_500_000,
  MHT_CET: 400_000,
  KCET: 300_000,
  WBJEE: 150_000,
};

export function sortExams(exams: Iterable<Exam>): Exam[] {
  return [...new Set(exams)].sort((a, b) => EXAMS.indexOf(a) - EXAMS.indexOf(b));
}
