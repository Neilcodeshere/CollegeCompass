import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Exam } from "@/generated/prisma/enums";
import { RECENT_REVIEW_LIMIT, type CollegeSort } from "@/lib/colleges/constants";
import { db } from "@/lib/db";
import { sortExams } from "@/lib/exams";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type {
  CollegeDetail,
  CollegeSummary,
  ComparisonResult,
  FilterOptions,
  PaginatedResponse,
  RatingDistribution,
} from "@/types/api";

const MAX_SEARCH_TERMS = 5;

// Every sort ends with `id` so rows with equal values keep a stable order
// across pages; otherwise a college could appear on two pages or none.
const ORDER_BY: Record<CollegeSort, Prisma.CollegeOrderByWithRelationInput[]> = {
  rating: [{ rating: "desc" }, { reviewCount: "desc" }, { name: "asc" }, { id: "asc" }],
  fees_asc: [{ annualFees: "asc" }, { name: "asc" }, { id: "asc" }],
  fees_desc: [{ annualFees: "desc" }, { name: "asc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

export const collegeBasicsSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  city: true,
  state: true,
  ownership: true,
  annualFees: true,
  rating: true,
  reviewCount: true,
} satisfies Prisma.CollegeSelect;

const placementSelect = {
  year: true,
  averagePackage: true,
  medianPackage: true,
  highestPackage: true,
  placementRate: true,
  recruiterCount: true,
} satisfies Prisma.PlacementRecordSelect;

/**
 * Each search term must match the name, short name, city or state, so
 * "pune computer" narrows results instead of matching nothing.
 */
function buildSearchFilter(search: string): Prisma.CollegeWhereInput[] {
  const terms = search.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS);
  return terms.map((term) => ({
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { shortName: { contains: term, mode: "insensitive" } },
      { city: { contains: term, mode: "insensitive" } },
      { state: { contains: term, mode: "insensitive" } },
    ],
  }));
}

function buildWhere(params: CollegeListQuery): Prisma.CollegeWhereInput {
  return {
    AND: params.search ? buildSearchFilter(params.search) : undefined,
    state: params.state,
    ownership: params.ownership,
    annualFees:
      params.minFees !== undefined || params.maxFees !== undefined
        ? { gte: params.minFees, lte: params.maxFees }
        : undefined,
    rating: params.minRating !== undefined ? { gte: params.minRating } : undefined,
  };
}

export async function listColleges(
  params: CollegeListQuery,
): Promise<PaginatedResponse<CollegeSummary>> {
  const where = buildWhere(params);

  // Two independent queries rather than one transaction: the data only changes
  // when the database is reseeded, so a shared snapshot buys nothing, and
  // holding a pooled connection across both round trips exhausts the pooler
  // under concurrent traffic.
  const [total, rows] = await Promise.all([
    db.college.count({ where }),
    db.college.findMany({
      where,
      orderBy: ORDER_BY[params.sort],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: {
        ...collegeBasicsSelect,
        placements: {
          orderBy: { year: "desc" },
          take: 1,
          select: { year: true, averagePackage: true },
        },
      },
    }),
  ]);

  return {
    data: rows.map(({ placements, ...college }) => ({
      ...college,
      averagePackage: placements[0]?.averagePackage ?? null,
      placementYear: placements[0]?.year ?? null,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getCollegeBySlug(slug: string): Promise<CollegeDetail | null> {
  const college = await db.college.findUnique({
    where: { slug },
    select: {
      ...collegeBasicsSelect,
      overview: true,
      establishedYear: true,
      accreditation: true,
      courses: {
        orderBy: [{ degree: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          degree: true,
          durationYears: true,
          annualFees: true,
          seats: true,
        },
      },
      placements: { orderBy: { year: "desc" }, select: placementSelect },
      reviews: {
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: RECENT_REVIEW_LIMIT,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          authorLabel: true,
          createdAt: true,
        },
      },
    },
  });
  if (!college) return null;

  const [ratingGroups, examsByCollege] = await Promise.all([
    db.review.groupBy({
      by: ["rating"],
      where: { collegeId: college.id },
      _count: { _all: true },
    }),
    getExamsByCollege([college.id]),
  ]);

  const ratingDistribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of ratingGroups) {
    if (group.rating in ratingDistribution) {
      ratingDistribution[group.rating as keyof RatingDistribution] = group._count._all;
    }
  }

  return {
    ...college,
    exams: examsByCollege.get(college.id) ?? [],
    ratingDistribution,
    reviews: college.reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}

export async function getCollegesForComparison(slugs: string[]): Promise<ComparisonResult> {
  const rows = await db.college.findMany({
    where: { slug: { in: slugs } },
    select: {
      ...collegeBasicsSelect,
      establishedYear: true,
      accreditation: true,
      _count: { select: { courses: true } },
      placements: { orderBy: { year: "desc" }, take: 1, select: placementSelect },
    },
  });
  const examsByCollege = await getExamsByCollege(rows.map((row) => row.id));
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  return {
    colleges: slugs.flatMap((slug) => {
      const row = bySlug.get(slug);
      if (!row) return [];
      const { _count, placements, ...college } = row;
      return [
        {
          ...college,
          exams: examsByCollege.get(college.id) ?? [],
          courseCount: _count.courses,
          latestPlacement: placements[0] ?? null,
        },
      ];
    }),
    missing: slugs.filter((slug) => !bySlug.has(slug)),
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [stateGroups, fees] = await Promise.all([
    db.college.groupBy({
      by: ["state"],
      _count: { _all: true },
      orderBy: { state: "asc" },
    }),
    db.college.aggregate({ _min: { annualFees: true }, _max: { annualFees: true } }),
  ]);

  return {
    states: stateGroups.map((group) => ({ name: group.state, count: group._count._all })),
    feeRange: { min: fees._min.annualFees ?? 0, max: fees._max.annualFees ?? 0 },
  };
}

/** Every college slug, used to prerender the detail pages. */
export async function getAllCollegeSlugs(): Promise<string[]> {
  const rows = await db.college.findMany({ select: { slug: true }, orderBy: { name: "asc" } });
  return rows.map((row) => row.slug);
}

/** Slugs and last-modified dates for the sitemap. */
export async function getCollegeSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db.college.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Exams a college accepts, derived from the cutoffs of its courses rather than
 * stored separately, so the two can never disagree.
 */
async function getExamsByCollege(collegeIds: string[]): Promise<Map<string, Exam[]>> {
  if (collegeIds.length === 0) return new Map();

  const rows = await db.cutoff.findMany({
    where: { course: { collegeId: { in: collegeIds } } },
    distinct: ["courseId", "exam"],
    select: { exam: true, course: { select: { collegeId: true } } },
  });

  const exams = new Map<string, Set<Exam>>();
  for (const { exam, course } of rows) {
    const set = exams.get(course.collegeId) ?? new Set<Exam>();
    set.add(exam);
    exams.set(course.collegeId, set);
  }
  return new Map([...exams].map(([collegeId, set]) => [collegeId, sortExams(set)]));
}
