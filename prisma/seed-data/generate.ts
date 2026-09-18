/**
 * Builds the sample dataset as plain rows, with no database access, so it can
 * be unit-tested and reproduced exactly.
 *
 * Each college gets a hidden `quality` score between 0 and 1. Fees, cutoffs,
 * placements and review sentiment are all derived from it, which keeps a
 * college's numbers consistent with each other: a college with competitive
 * cutoffs also has stronger placements and better reviews.
 */
import type { Prisma } from "../../src/generated/prisma/client";
import type { Category, Degree, Exam, Ownership } from "../../src/generated/prisma/enums";
import { EXAM_LABELS } from "../../src/lib/exams";
import {
  BTECH_BRANCHES,
  CATEGORY_RANK_FACTOR,
  EXAM_RANK_POOL,
  FINAL_ROUND,
  GOVERNMENT_NAME_TEMPLATES,
  MTECH_SPECIALISATIONS,
  OVERVIEW_DETAILS,
  PRIVATE_NAME_TEMPLATES,
  REGIONS,
  REVIEW_ASPECTS,
  REVIEW_SENTENCES,
  REVIEW_TITLES,
  type Branch,
  type Tone,
} from "./catalog";
import { at, createRandom, type Random } from "./random";

export const DATASET_SEED = 20260916;
export const DATA_YEARS = [2023, 2024, 2025] as const;

const LATEST_YEAR = 2025;
const LAKH = 100_000;
const CATEGORIES: readonly Category[] = ["GENERAL", "EWS", "OBC", "SC", "ST"];
const PLACEMENT_TREND: Record<(typeof DATA_YEARS)[number], number> = {
  2023: 0.9,
  2024: 0.95,
  2025: 1,
};
const REVIEW_WINDOW_START = Date.UTC(2023, 0, 1);
const REVIEW_WINDOW_MS = Date.UTC(2026, 0, 1) - REVIEW_WINDOW_START;

export type CollegeRow = Prisma.CollegeCreateManyInput & { id: string; rating: number };
export type CourseRow = Prisma.CourseCreateManyInput & { id: string; degree: Degree };
export type CutoffRow = Prisma.CutoffCreateManyInput;
export type PlacementRow = Prisma.PlacementRecordCreateManyInput;
export type ReviewRow = Prisma.ReviewCreateManyInput & { rating: number };

export type SeedDataset = {
  colleges: CollegeRow[];
  courses: CourseRow[];
  cutoffs: CutoffRow[];
  placements: PlacementRow[];
  reviews: ReviewRow[];
};

type PlannedCourse = { row: CourseRow; branch?: Branch };

export function generateDataset(seed: number = DATASET_SEED): SeedDataset {
  const rng = createRandom(seed);
  const dataset: SeedDataset = {
    colleges: [],
    courses: [],
    cutoffs: [],
    placements: [],
    reviews: [],
  };
  const usedNames = new Set<string>();
  const usedSlugs = new Set<string>();

  for (const region of REGIONS) {
    const stems = rng.shuffle(region.stems);
    const isNational = region.primaryExam === "JEE_MAIN";

    for (let i = 0; i < region.collegeCount; i++) {
      const id = `college-${String(dataset.colleges.length + 1).padStart(3, "0")}`;
      const ownership: Ownership = rng.chance(isNational ? 0.4 : 0.35) ? "GOVERNMENT" : "PRIVATE";
      const quality =
        ownership === "GOVERNMENT" ? rng.float(0.35, 0.95) : 0.05 + 0.9 * rng.next() ** 1.3;
      const city = at(region.cities, i % region.cities.length);
      const name = pickName(rng, stems, i, ownership, usedNames);
      const exams: Exam[] = [region.primaryExam];
      if (!isNational && rng.chance(0.3)) exams.push("JEE_MAIN");

      const annualFees = roundTo(
        ownership === "GOVERNMENT"
          ? isNational
            ? rng.float(120_000, 180_000)
            : rng.float(25_000, 95_000)
          : 90_000 + 260_000 * quality + rng.float(0, 60_000),
        5_000,
      );
      const establishedYear = rng.chance(0.1)
        ? null
        : ownership === "GOVERNMENT"
          ? rng.int(1955, 2010)
          : rng.int(1984, 2014);
      const accreditation = rng.chance(0.15) ? null : `NAAC ${naacGrade(quality)}`;

      const courses = buildCourses(rng, id, quality, ownership, annualFees);
      dataset.courses.push(...courses.map((course) => course.row));

      const examBaseRanks = exams.map((exam, index) => ({
        exam,
        pool: EXAM_RANK_POOL[exam] * (index === 0 ? 1 : 1.3),
      }));
      const cseRankByExam = examBaseRanks.map(({ exam, pool }) => ({
        exam,
        pool,
        cseRank:
          50 +
          pool *
            (1 - quality) ** 2.4 *
            (ownership === "GOVERNMENT" ? 0.7 : 1) *
            rng.float(0.85, 1.15),
      }));
      for (const { row, branch } of courses) {
        if (!branch) continue;
        for (const examRank of cseRankByExam) {
          dataset.cutoffs.push(...buildCutoffs(rng, row.id, branch, examRank));
        }
      }

      dataset.placements.push(...buildPlacements(rng, id, quality, ownership, isNational));

      const branchShortNames = courses.flatMap(({ branch }) => (branch ? [branch.shortName] : []));
      const reviews = buildReviews(rng, id, quality, branchShortNames);
      dataset.reviews.push(...reviews);

      dataset.colleges.push({
        id,
        slug: uniqueSlug(`${name} ${city}`, usedSlugs),
        name,
        shortName: acronym(name),
        city,
        state: region.state,
        ownership,
        establishedYear,
        accreditation,
        overview: writeOverview(rng, {
          name,
          city,
          state: region.state,
          ownership,
          establishedYear,
          accreditation,
          courses: courses.map((course) => course.row),
          exams,
        }),
        annualFees,
        rating: roundTo(mean(reviews.map((review) => review.rating)), 0.1),
        reviewCount: reviews.length,
      });
    }
  }

  return dataset;
}

function buildCourses(
  rng: Random,
  collegeId: string,
  quality: number,
  ownership: Ownership,
  annualFees: number,
): PlannedCourse[] {
  const planned: Array<Omit<CourseRow, "id" | "collegeId"> & { branch?: Branch }> = [];

  for (const branch of BTECH_BRANCHES) {
    if (!rng.chance(branch.offerChance(quality))) continue;
    planned.push({
      degree: "BTECH",
      name: branch.name,
      durationYears: 4,
      annualFees,
      seats: branch.shortName === "CSE" ? rng.pick([120, 180, 240]) : rng.pick([60, 60, 120]),
      branch,
    });
  }

  const mtechCount = quality > 0.6 ? rng.int(2, 3) : rng.chance(0.4) ? 1 : 0;
  for (const specialisation of rng.shuffle(MTECH_SPECIALISATIONS).slice(0, mtechCount)) {
    planned.push({
      degree: "MTECH",
      name: specialisation,
      durationYears: 2,
      annualFees: roundTo(annualFees * (ownership === "GOVERNMENT" ? 0.6 : 0.8), 5_000),
      seats: optionalSeats(rng, rng.pick([18, 24, 36])),
    });
  }

  if (rng.chance(ownership === "PRIVATE" ? 0.35 : 0.2)) {
    planned.push({
      degree: "MBA",
      name: "Business Administration",
      durationYears: 2,
      annualFees: roundTo(annualFees * rng.float(1.3, 1.8), 5_000),
      seats: optionalSeats(rng, rng.pick([60, 120])),
    });
  }

  if (rng.chance(0.3)) {
    planned.push({
      degree: "MCA",
      name: "Computer Applications",
      durationYears: 2,
      annualFees: roundTo(annualFees * 0.75, 5_000),
      seats: optionalSeats(rng, 60),
    });
  }

  return planned.map(({ branch, ...course }, index) => ({
    row: { ...course, id: `${collegeId}-course-${index + 1}`, collegeId },
    branch,
  }));
}

function buildCutoffs(
  rng: Random,
  courseId: string,
  branch: Branch,
  { exam, pool, cseRank }: { exam: Exam; pool: number; cseRank: number },
): CutoffRow[] {
  const rows: CutoffRow[] = [];
  const maxRank = Math.round(pool * 1.5);

  for (const year of DATA_YEARS) {
    const yearFactor = year === LATEST_YEAR ? 1 : 1 + rng.normal() * 0.07;
    // Earlier rounds close at better (smaller) ranks because seats open up
    // later. One ratio per year keeps category ordering intact in every round.
    const firstRoundRatio = rng.float(0.78, 0.9);
    for (const category of CATEGORIES) {
      const finalRank = clamp(
        Math.round(cseRank * branch.demand * yearFactor * CATEGORY_RANK_FACTOR[category]),
        1,
        maxRank,
      );
      const firstRoundRank = Math.max(1, Math.round(finalRank * firstRoundRatio));
      const shared = { courseId, exam, category, year };
      rows.push(
        { ...shared, round: 1, closingRank: firstRoundRank },
        { ...shared, round: FINAL_ROUND[exam], closingRank: finalRank },
      );
    }
  }

  return rows;
}

function buildPlacements(
  rng: Random,
  collegeId: string,
  quality: number,
  ownership: Ownership,
  isNational: boolean,
): PlacementRow[] {
  const nationalGovernmentBoost = ownership === "GOVERNMENT" && isNational ? 1 : 0;
  const baseAverageLakhs = Math.max(
    3.2,
    3.4 + 13 * quality ** 1.5 + nationalGovernmentBoost + rng.normal() * 0.5,
  );
  const baseRecruiters = 40 + 260 * quality;

  return DATA_YEARS.map((year) => {
    const trend = PLACEMENT_TREND[year] * (1 + rng.normal() * 0.03);
    const averagePackage = roundTo(baseAverageLakhs * trend * LAKH, 10_000);
    return {
      collegeId,
      year,
      averagePackage,
      medianPackage: roundTo(averagePackage * rng.float(0.78, 0.9), 10_000),
      highestPackage: Math.max(
        roundTo(averagePackage * (3 + 7 * quality + rng.next()), LAKH),
        averagePackage * 2,
      ),
      placementRate: roundTo(clamp(0.55 + 0.4 * quality + rng.normal() * 0.04, 0.4, 0.98), 0.01),
      recruiterCount: Math.max(15, Math.round(baseRecruiters * trend + rng.normal() * 10)),
    };
  });
}

function buildReviews(
  rng: Random,
  collegeId: string,
  quality: number,
  branchShortNames: readonly string[],
): ReviewRow[] {
  const count = rng.int(6, 15);
  const targetRating = 2.9 + 1.7 * quality + rng.normal() * 0.15;
  const placementTone: Tone = quality > 0.6 ? "positive" : quality > 0.35 ? "mixed" : "negative";

  return Array.from({ length: count }, () => {
    const rating = clamp(Math.round(targetRating + rng.normal() * 0.8), 1, 5);
    const tone: Tone = rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
    const aspects = rng.shuffle(REVIEW_ASPECTS).slice(0, rng.int(2, 3));
    const body = aspects
      .map((aspect) =>
        rng.pick(REVIEW_SENTENCES[aspect][aspect === "placements" ? placementTone : tone]),
      )
      .join(" ");
    const createdAt = new Date(REVIEW_WINDOW_START + Math.floor(rng.next() * REVIEW_WINDOW_MS));
    const classOf = createdAt.getUTCFullYear() + rng.int(0, 3);

    return {
      collegeId,
      rating,
      title: rng.pick(REVIEW_TITLES[tone]),
      body,
      authorLabel: `B.Tech ${rng.pick(branchShortNames)}, class of ${classOf}`,
      createdAt,
    };
  });
}

type OverviewInput = {
  name: string;
  city: string;
  state: string;
  ownership: Ownership;
  establishedYear: number | null;
  accreditation: string | null;
  courses: readonly CourseRow[];
  exams: readonly Exam[];
};

function writeOverview(rng: Random, college: OverviewInput): string {
  const kind = college.ownership === "GOVERNMENT" ? "government" : "private";
  const founded = college.establishedYear ? `, established in ${college.establishedYear}` : "";
  const btechCount = college.courses.filter((course) => course.degree === "BTECH").length;
  const postgraduate = [
    ...new Set(
      college.courses.flatMap((course) =>
        course.degree === "MTECH"
          ? ["M.Tech"]
          : course.degree === "MBA"
            ? ["MBA"]
            : course.degree === "MCA"
              ? ["MCA"]
              : [],
      ),
    ),
  ];

  const sentences = [
    `${college.name} is a ${kind} engineering institute in ${college.city}, ${college.state}${founded}.`,
    `It offers B.Tech programmes in ${btechCount} disciplines${
      postgraduate.length ? `, along with postgraduate programmes (${joinList(postgraduate)})` : ""
    }.`,
    `B.Tech admissions are based on ${joinList(college.exams.map((exam) => EXAM_LABELS[exam]))} ranks.`,
  ];
  if (college.accreditation) {
    sentences.push(`The institute holds a ${college.accreditation} accreditation.`);
  }
  sentences.push(rng.pick(OVERVIEW_DETAILS));
  return sentences.join(" ");
}

function pickName(
  rng: Random,
  stems: readonly string[],
  offset: number,
  ownership: Ownership,
  used: Set<string>,
): string {
  const templates = rng.shuffle(
    ownership === "GOVERNMENT" ? GOVERNMENT_NAME_TEMPLATES : PRIVATE_NAME_TEMPLATES,
  );
  for (let step = 0; step < stems.length; step++) {
    const stem = at(stems, (offset + step) % stems.length);
    for (const template of templates) {
      const name = template.replace("{stem}", stem);
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
    }
  }
  throw new Error("Ran out of unique college names; add more stems to the catalog.");
}

function uniqueSlug(text: string, used: Set<string>): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  used.add(slug);
  return slug;
}

const ACRONYM_SKIP_WORDS = new Set(["of", "and"]);

function acronym(name: string): string {
  return name
    .split(" ")
    .filter((word) => !ACRONYM_SKIP_WORDS.has(word))
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function naacGrade(quality: number): string {
  if (quality > 0.85) return "A++";
  if (quality > 0.7) return "A+";
  if (quality > 0.5) return "A";
  if (quality > 0.3) return "B++";
  return "B+";
}

function optionalSeats(rng: Random, seats: number): number | null {
  return rng.chance(0.1) ? null : seats;
}

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${at(items, items.length - 1)}`;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to the nearest multiple of `step` (e.g. 5_000 rupees, or 0.1 stars). */
function roundTo(value: number, step: number): number {
  const rounded = Math.round(value / step) * step;
  // Clean up float noise such as 4.300000000000001.
  return Number(rounded.toFixed(step < 1 ? 2 : 0));
}
