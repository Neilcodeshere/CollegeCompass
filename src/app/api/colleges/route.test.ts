import { afterEach, describe, expect, it, vi } from "vitest";

import { listColleges } from "@/lib/services/colleges";
import { makeCollegeSummary } from "@/test/fixtures";

import { GET } from "./route";

vi.mock("@/lib/services/colleges", () => ({ listColleges: vi.fn() }));

const listCollegesMock = vi.mocked(listColleges);

function get(query = "") {
  return GET(new Request(`http://localhost/api/colleges${query}`));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/colleges", () => {
  it("returns a paginated list with defaults applied", async () => {
    const body = {
      data: [makeCollegeSummary()],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    };
    listCollegesMock.mockResolvedValue(body);

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage");
    expect(await response.json()).toEqual(body);
    expect(listCollegesMock).toHaveBeenCalledWith({ sort: "rating", page: 1, limit: 12 });
  });

  it("parses and forwards every filter", async () => {
    listCollegesMock.mockResolvedValue({
      data: [],
      pagination: { page: 2, limit: 24, total: 0, totalPages: 0 },
    });

    await get(
      "?search=%20pune%20&state=Maharashtra&ownership=GOVERNMENT&minFees=50000&maxFees=150000&minRating=3.5&sort=fees_asc&page=2&limit=24",
    );

    expect(listCollegesMock).toHaveBeenCalledWith({
      search: "pune",
      state: "Maharashtra",
      ownership: "GOVERNMENT",
      minFees: 50_000,
      maxFees: 150_000,
      minRating: 3.5,
      sort: "fees_asc",
      page: 2,
      limit: 24,
    });
  });

  it("treats blank parameters as not provided and ignores unknown ones", async () => {
    listCollegesMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    });

    const response = await get("?search=&state=&minFees=&page=&sort=&utm_source=newsletter");

    expect(response.status).toBe(200);
    expect(listCollegesMock).toHaveBeenCalledWith({ sort: "rating", page: 1, limit: 12 });
  });

  it.each([
    ["page=0", "page"],
    ["page=1.5", "page"],
    ["page=abc", "page"],
    ["limit=0", "limit"],
    ["limit=100", "limit"],
    ["minRating=6", "minRating"],
    ["minRating=-1", "minRating"],
    ["minFees=-5", "minFees"],
    ["minFees=cheap", "minFees"],
    ["minFees=300000&maxFees=100000", "maxFees"],
    ["sort=popularity", "sort"],
    ["ownership=public", "ownership"],
    [`search=${"a".repeat(101)}`, "search"],
  ])("rejects ?%s with a 400 on %s", async (query, field) => {
    const response = await get(`?${query}`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fieldErrors[field]).toEqual([expect.any(String)]);
    expect(listCollegesMock).not.toHaveBeenCalled();
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    listCollegesMock.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1:5432"));

    const response = await get();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on our side. Please try again.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
