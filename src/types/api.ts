/**
 * Response shapes shared by the API routes and the UI. These are the public
 * contract: services map database rows into them, so Prisma models never leak
 * to the client and dates are always ISO strings.
 */
import type { Category, Degree, Exam, Ownership } from "@/generated/prisma/enums";

export type { Category, Degree, Exam, Ownership };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type DataResponse<T> = {
  data: T;
};

export type ApiErrorCode =
  "VALIDATION_ERROR" | "NOT_FOUND" | "PAYLOAD_TOO_LARGE" | "INTERNAL_ERROR";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

/** One row in the college listing. */
export type CollegeSummary = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  ownership: Ownership;
  /** Annual B.Tech tuition in rupees. */
  annualFees: number;
  rating: number;
  reviewCount: number;
  /** Most recent year's average package in rupees, if reported. */
  averagePackage: number | null;
  placementYear: number | null;
};

/** College identity and headline numbers, without placement data. */
export type CollegeBasics = Omit<CollegeSummary, "averagePackage" | "placementYear">;

export type Course = {
  id: string;
  name: string;
  degree: Degree;
  durationYears: number;
  annualFees: number;
  seats: number | null;
};

export type Placement = {
  year: number;
  averagePackage: number;
  medianPackage: number;
  highestPackage: number;
  /** Share of eligible students placed, from 0 to 1. */
  placementRate: number;
  recruiterCount: number;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorLabel: string;
  createdAt: string;
};

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export type CollegeDetail = CollegeBasics & {
  overview: string;
  establishedYear: number | null;
  accreditation: string | null;
  exams: Exam[];
  courses: Course[];
  /** Newest year first. */
  placements: Placement[];
  ratingDistribution: RatingDistribution;
  /** Most recent reviews, newest first. */
  reviews: Review[];
};

export type ComparisonCollege = CollegeBasics & {
  establishedYear: number | null;
  accreditation: string | null;
  exams: Exam[];
  courseCount: number;
  latestPlacement: Placement | null;
};

export type ComparisonResult = {
  /** In the order the slugs were requested. */
  colleges: ComparisonCollege[];
  /** Requested slugs that don't match a college. */
  missing: string[];
};

/** How a historical closing rank compares with the student's rank. */
export type MatchBand = "LIKELY" | "BORDERLINE" | "REACH";

export type PredictionCourse = {
  courseId: string;
  name: string;
  closingRank: number;
  band: MatchBand;
};

export type Prediction = {
  college: CollegeBasics;
  /** Best band among the college's matching courses. */
  band: MatchBand;
  /** Matching B.Tech courses, best match first. */
  courses: PredictionCourse[];
};

export type PredictionCounts = Record<MatchBand, number>;

export type PredictionResult = {
  exam: Exam;
  category: Category;
  rank: number;
  /** Counselling year the cutoffs come from; null when the exam has no data. */
  basisYear: number | null;
  /** Best matches, capped per band; `counts` covers every match. */
  results: Prediction[];
  counts: PredictionCounts;
};

export type FilterOptions = {
  states: Array<{ name: string; count: number }>;
  feeRange: { min: number; max: number };
};
