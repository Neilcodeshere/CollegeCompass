import { beforeAll, describe, expect, it } from "vitest";

import { DATA_YEARS, generateDataset, type SeedDataset } from "./generate";

let data: SeedDataset;

beforeAll(() => {
  data = generateDataset();
});

describe("generateDataset", () => {
  it("is deterministic for a given seed", () => {
    expect(generateDataset()).toEqual(data);
    expect(generateDataset(1)).not.toEqual(data);
  });

  it("creates enough colleges to exercise search, filters and pagination", () => {
    expect(data.colleges.length).toBe(125);
    expect(new Set(data.colleges.map((c) => c.state)).size).toBeGreaterThanOrEqual(15);
    expect(data.colleges.some((c) => c.ownership === "GOVERNMENT")).toBe(true);
    expect(data.colleges.some((c) => c.ownership === "PRIVATE")).toBe(true);
  });

  it("gives every college a unique name and URL-safe slug", () => {
    const names = data.colleges.map((c) => c.name);
    const slugs = data.colleges.map((c) => c.slug);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("only references rows that exist", () => {
    const collegeIds = new Set(data.colleges.map((c) => c.id));
    const courseIds = new Set(data.courses.map((c) => c.id));
    for (const course of data.courses) expect(collegeIds).toContain(course.collegeId);
    for (const review of data.reviews) expect(collegeIds).toContain(review.collegeId);
    for (const placement of data.placements) expect(collegeIds).toContain(placement.collegeId);
    for (const cutoff of data.cutoffs) expect(courseIds).toContain(cutoff.courseId);
  });

  it("keeps denormalised college fields consistent with their source rows", () => {
    for (const college of data.colleges) {
      const reviews = data.reviews.filter((r) => r.collegeId === college.id);
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      expect(college.reviewCount).toBe(reviews.length);
      expect(college.rating).toBeCloseTo(average, 1);

      const btech = data.courses.filter((c) => c.collegeId === college.id && c.degree === "BTECH");
      expect(btech.length).toBeGreaterThan(0);
      for (const course of btech) expect(course.annualFees).toBe(college.annualFees);
    }
  });

  it("records placements for every college and year", () => {
    for (const college of data.colleges) {
      const years = data.placements.filter((p) => p.collegeId === college.id).map((p) => p.year);
      expect(years).toEqual([...DATA_YEARS]);
    }
    for (const p of data.placements) {
      expect(p.medianPackage).toBeLessThanOrEqual(p.averagePackage);
      expect(p.highestPackage).toBeGreaterThan(p.averagePackage);
      expect(p.placementRate).toBeGreaterThan(0);
      expect(p.placementRate).toBeLessThanOrEqual(1);
    }
  });

  it("only generates cutoffs for B.Tech courses", () => {
    const btechIds = new Set(data.courses.filter((c) => c.degree === "BTECH").map((c) => c.id));
    for (const cutoff of data.cutoffs) expect(btechIds).toContain(cutoff.courseId);
  });

  it("produces closing ranks that behave like real counselling data", () => {
    type Cutoff = SeedDataset["cutoffs"][number];
    // Index once: 26,000 rows make a per-row `find` far too slow.
    const byRound = new Map<string, number[]>();
    const byCategory = new Map<string, number>();
    const roundKey = (c: Cutoff) => `${c.courseId}|${c.exam}|${c.category}|${c.year}`;
    const categoryKey = (c: Cutoff) => `${c.courseId}|${c.exam}|${c.year}|${c.round}`;

    for (const cutoff of data.cutoffs) {
      byRound.set(roundKey(cutoff), [...(byRound.get(roundKey(cutoff)) ?? []), cutoff.closingRank]);
      if (cutoff.category === "GENERAL") byCategory.set(categoryKey(cutoff), cutoff.closingRank);
    }

    // Collect every violation and assert once, so a failure names the offender
    // instead of stopping at the first row.
    const invalidRanks = data.cutoffs.filter(
      (c) => !Number.isInteger(c.closingRank) || c.closingRank < 1,
    );
    const roundsOutOfOrder = [...byRound.entries()].filter(([, ranks]) => {
      const [firstRound, finalRound] = ranks;
      return ranks.length !== 2 || (finalRound ?? 0) < (firstRound ?? 0);
    });
    const categoriesOutOfOrder = data.cutoffs.filter(
      (c) =>
        c.category !== "GENERAL" &&
        c.closingRank < (byCategory.get(categoryKey(c)) ?? Number.POSITIVE_INFINITY),
    );

    expect(invalidRanks).toEqual([]);
    expect(roundsOutOfOrder).toEqual([]);
    expect(categoriesOutOfOrder).toEqual([]);
  });
});
