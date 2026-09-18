import { describe, expect, it } from "vitest";

import {
  applyFilterPatch,
  clearNarrowingFilters,
  countActiveFilters,
  DEFAULT_FILTERS,
  feeBucketPatch,
  findFeeBucketId,
  parseCollegeFilters,
  serializeCollegeFilters,
} from "./college-filters";

const parse = (query: string) => parseCollegeFilters(new URLSearchParams(query));

describe("parseCollegeFilters", () => {
  it("applies defaults when nothing is in the URL", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("reads every supported filter", () => {
    expect(
      parse(
        "search=pune&state=Maharashtra&ownership=PRIVATE&minFees=100000&maxFees=200000&minRating=4&sort=fees_asc&page=3&limit=24",
      ),
    ).toEqual({
      search: "pune",
      state: "Maharashtra",
      ownership: "PRIVATE",
      minFees: 100_000,
      maxFees: 200_000,
      minRating: 4,
      sort: "fees_asc",
      page: 3,
      limit: 24,
    });
  });

  it("ignores invalid values but keeps the valid ones", () => {
    // A hand-edited or outdated URL should still show results.
    expect(parse("search=pune&page=0&minRating=nine&sort=popularity&state=Kerala")).toEqual({
      ...DEFAULT_FILTERS,
      search: "pune",
      state: "Kerala",
    });
  });

  it("drops an impossible fee range rather than erroring", () => {
    expect(parse("minFees=300000&maxFees=100000")).toEqual({
      ...DEFAULT_FILTERS,
      minFees: 300_000,
    });
  });

  it("keeps the last value when a parameter is repeated", () => {
    expect(parse("state=Kerala&state=Punjab").state).toBe("Punjab");
    expect(parseCollegeFilters({ state: ["Kerala", "Punjab"] }).state).toBe("Punjab");
  });

  it("ignores unrelated parameters", () => {
    expect(parse("utm_source=mail&ref=x")).toEqual(DEFAULT_FILTERS);
  });
});

describe("serializeCollegeFilters", () => {
  it("leaves defaults out of the URL", () => {
    expect(serializeCollegeFilters(DEFAULT_FILTERS)).toBe("");
    expect(serializeCollegeFilters({ ...DEFAULT_FILTERS, search: "pune" })).toBe("search=pune");
  });

  it("writes parameters in a stable order", () => {
    const url = serializeCollegeFilters({
      page: 2,
      limit: 12,
      sort: "name",
      search: "tech",
      state: "Kerala",
      minRating: 4,
      ownership: "GOVERNMENT",
    });
    expect(url).toBe("search=tech&state=Kerala&ownership=GOVERNMENT&minRating=4&sort=name&page=2");
  });

  it("round-trips through parsing", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      search: "kaveri valley",
      state: "Karnataka",
      minFees: 100_000,
      maxFees: 199_999,
      page: 4,
    };
    expect(parse(serializeCollegeFilters(filters))).toEqual(filters);
  });
});

describe("applyFilterPatch", () => {
  const onPageThree = { ...DEFAULT_FILTERS, search: "pune", page: 3 };

  it("resets to page 1 when a filter changes", () => {
    expect(applyFilterPatch(onPageThree, { state: "Kerala" })).toEqual({
      ...DEFAULT_FILTERS,
      search: "pune",
      state: "Kerala",
      page: 1,
    });
  });

  it("resets to page 1 when the search or sort changes", () => {
    expect(applyFilterPatch(onPageThree, { search: "kochi" }).page).toBe(1);
    expect(applyFilterPatch(onPageThree, { sort: "name" }).page).toBe(1);
  });

  it("keeps other filters when only the page changes", () => {
    expect(applyFilterPatch(onPageThree, { page: 5 })).toEqual({ ...onPageThree, page: 5 });
  });

  it("removes a filter that is set back to undefined", () => {
    const withState = { ...DEFAULT_FILTERS, state: "Kerala" };
    expect(applyFilterPatch(withState, { state: undefined })).not.toHaveProperty("state");
  });
});

describe("clearNarrowingFilters", () => {
  it("clears the filters but keeps the search text and sort", () => {
    expect(
      clearNarrowingFilters({
        search: "pune",
        state: "Maharashtra",
        ownership: "PRIVATE",
        minFees: 100_000,
        maxFees: 200_000,
        minRating: 4,
        sort: "fees_asc",
        page: 6,
        limit: 12,
      }),
    ).toEqual({ search: "pune", sort: "fees_asc", page: 1, limit: 12 });
  });
});

describe("countActiveFilters", () => {
  it("counts a fee range once and ignores search, sort and paging", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, search: "pune", page: 3 })).toBe(0);
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        state: "Kerala",
        minFees: 100_000,
        maxFees: 200_000,
        minRating: 4,
      }),
    ).toBe(3);
  });
});

describe("fee buckets", () => {
  it("maps between a bucket and its fee range", () => {
    const patch = feeBucketPatch("1l-2l");
    expect(patch).toEqual({ minFees: 100_000, maxFees: 199_999 });
    expect(findFeeBucketId({ ...DEFAULT_FILTERS, ...patch })).toBe("1l-2l");
  });

  it("clears both bounds when no bucket is selected", () => {
    expect(feeBucketPatch(undefined)).toEqual({ minFees: undefined, maxFees: undefined });
  });

  it("returns no bucket for a range that isn't a preset", () => {
    expect(findFeeBucketId({ ...DEFAULT_FILTERS, minFees: 123_456 })).toBeUndefined();
  });
});
