import { describe, expect, it } from "vitest";

import { pageItems } from "./pagination";

describe("pageItems", () => {
  it("shows nothing to navigate for zero or one page", () => {
    expect(pageItems(1, 0)).toEqual([]);
    expect(pageItems(1, 1)).toEqual([1]);
  });

  it("lists every page when they all fit", () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it("shows the number instead of an ellipsis when only one page is skipped", () => {
    // Pages 1, 2, 3, 4 and 6 are kept, so page 5 is filled in rather than hidden.
    expect(pageItems(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("adds a gap where pages are skipped", () => {
    expect(pageItems(1, 11)).toEqual([1, 2, "gap", 11]);
    expect(pageItems(6, 11)).toEqual([1, "gap", 5, 6, 7, "gap", 11]);
    expect(pageItems(11, 11)).toEqual([1, "gap", 10, 11]);
  });

  it("never repeats a page or drops the current one", () => {
    for (let totalPages = 1; totalPages <= 20; totalPages++) {
      for (let page = 1; page <= totalPages; page++) {
        const items = pageItems(page, totalPages);
        const numbers = items.filter((item): item is number => item !== "gap");
        expect(new Set(numbers).size).toBe(numbers.length);
        expect(numbers).toContain(page);
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      }
    }
  });
});
