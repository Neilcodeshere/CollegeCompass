import { describe, expect, it } from "vitest";

import { makeCollege } from "@/test/fixtures";

import {
  buildPredictions,
  classifyRank,
  latestRoundPerCourse,
  type CutoffCandidate,
} from "./match";

function candidate(
  collegeId: string,
  courseId: string,
  closingRank: number,
  round = 6,
): CutoffCandidate {
  return {
    courseId,
    courseName: `Course ${courseId}`,
    round,
    closingRank,
    college: makeCollege({ id: collegeId, name: `College ${collegeId}` }),
  };
}

describe("classifyRank", () => {
  it.each([
    // [student rank, closing rank, expected band]
    [10_000, 20_000, "LIKELY"],
    [10_000, 11_000, "LIKELY"], // ratio exactly 1.10
    [10_000, 10_999, "BORDERLINE"],
    [10_000, 10_000, "BORDERLINE"], // same rank
    [10_000, 9_000, "BORDERLINE"], // ratio exactly 0.90
    [10_000, 8_999, "REACH"],
    [10_000, 7_000, "REACH"], // ratio exactly 0.70
    [10_000, 6_999, null],
    [10_000, 500, null],
  ] as const)("rank %i vs closing rank %i → %s", (rank, closing, expected) => {
    expect(classifyRank(rank, closing)).toBe(expected);
  });

  it("scales with rank size instead of using a fixed rank gap", () => {
    expect(classifyRank(1_000, 1_500)).toBe("LIKELY");
    expect(classifyRank(200_000, 200_500)).toBe("BORDERLINE");
  });
});

describe("latestRoundPerCourse", () => {
  it("keeps only the highest round for each course", () => {
    const rows = [
      candidate("a", "c1", 900, 1),
      candidate("a", "c1", 1_200, 6),
      candidate("a", "c2", 5_000, 1),
    ];
    const latest = latestRoundPerCourse(rows);
    expect(latest).toHaveLength(2);
    expect(latest.find((row) => row.courseId === "c1")?.closingRank).toBe(1_200);
    expect(latest.find((row) => row.courseId === "c2")?.closingRank).toBe(5_000);
  });
});

describe("buildPredictions", () => {
  it("uses the final round, not round 1, to classify a course", () => {
    // Round 1 closed below the reach threshold; the final round is likely.
    const { results } = buildPredictions(
      [candidate("a", "c1", 5_000, 1), candidate("a", "c1", 15_000, 6)],
      10_000,
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.band).toBe("LIKELY");
    expect(results[0]?.courses[0]?.closingRank).toBe(15_000);
  });

  it("gives a college the best band among its courses and orders its courses", () => {
    const { results } = buildPredictions(
      [
        candidate("a", "reach", 8_000),
        candidate("a", "likely-far", 40_000),
        candidate("a", "likely-near", 12_000),
        candidate("a", "excluded", 1_000),
      ],
      10_000,
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.band).toBe("LIKELY");
    expect(results[0]?.courses.map((course) => course.courseId)).toEqual([
      "likely-near",
      "likely-far",
      "reach",
    ]);
  });

  it("orders colleges by band, then by how close the cutoff is to the rank", () => {
    const { results } = buildPredictions(
      [
        candidate("reach", "r", 8_000),
        candidate("likely-far", "lf", 50_000),
        candidate("borderline", "b", 10_200),
        candidate("likely-near", "ln", 11_500),
      ],
      10_000,
    );
    expect(results.map((prediction) => prediction.college.id)).toEqual([
      "likely-near",
      "likely-far",
      "borderline",
      "reach",
    ]);
  });

  it("drops colleges with no course within reach", () => {
    const { results, counts } = buildPredictions([candidate("a", "c1", 2_000)], 10_000);
    expect(results).toEqual([]);
    expect(counts).toEqual({ LIKELY: 0, BORDERLINE: 0, REACH: 0 });
  });

  it("caps results per band while counting every match", () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => candidate(`likely-${i}`, `l${i}`, 20_000 + i)),
      candidate("borderline", "b", 10_000),
    ];
    const { results, counts } = buildPredictions(rows, 10_000, 3);
    expect(counts).toEqual({ LIKELY: 5, BORDERLINE: 1, REACH: 0 });
    expect(results.filter((prediction) => prediction.band === "LIKELY")).toHaveLength(3);
    expect(results.filter((prediction) => prediction.band === "BORDERLINE")).toHaveLength(1);
  });
});
