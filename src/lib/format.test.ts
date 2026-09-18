import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatPackage,
  formatPercent,
  formatRank,
  formatRating,
  formatReviewDate,
} from "./format";

describe("formatCurrency", () => {
  it("uses Indian digit grouping without decimals", () => {
    expect(formatCurrency(125000)).toBe("₹1,25,000");
    expect(formatCurrency(1450000)).toBe("₹14,50,000");
    expect(formatCurrency(99999.6)).toBe("₹1,00,000");
  });
});

describe("formatPackage", () => {
  it("expresses packages in lakhs per annum with at most one decimal", () => {
    expect(formatPackage(960000)).toBe("₹9.6 LPA");
    expect(formatPackage(1200000)).toBe("₹12 LPA");
    expect(formatPackage(9900000)).toBe("₹99 LPA");
  });

  it("switches to crore past a hundred lakh, as salaries are quoted in India", () => {
    expect(formatPackage(10_000_000)).toBe("₹1 Cr");
    expect(formatPackage(16_800_000)).toBe("₹1.68 Cr");
    expect(formatPackage(45_000_000)).toBe("₹4.5 Cr");
  });
});

describe("formatRank", () => {
  it("groups digits the Indian way", () => {
    expect(formatRank(12450)).toBe("12,450");
    expect(formatRank(124500)).toBe("1,24,500");
  });
});

describe("formatRating", () => {
  it("always shows one decimal place", () => {
    expect(formatRating(4)).toBe("4.0");
    expect(formatRating(3.86)).toBe("3.9");
  });
});

describe("formatPercent", () => {
  it("shows a whole-number percentage", () => {
    expect(formatPercent(0.87)).toBe("87%");
    expect(formatPercent(0.874)).toBe("87%");
    expect(formatPercent(1)).toBe("100%");
  });
});

describe("formatReviewDate", () => {
  it("shows the month and year", () => {
    expect(formatReviewDate("2025-03-18T00:00:00.000Z")).toBe("March 2025");
  });
});
