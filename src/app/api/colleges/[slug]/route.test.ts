import { afterEach, describe, expect, it, vi } from "vitest";

import { getCollegeBySlug } from "@/lib/services/colleges";
import { makeCollege } from "@/test/fixtures";
import type { CollegeDetail } from "@/types/api";

import { GET } from "./route";

vi.mock("@/lib/services/colleges", () => ({ getCollegeBySlug: vi.fn() }));

const getCollegeBySlugMock = vi.mocked(getCollegeBySlug);

function get(slug: string) {
  return GET(new Request(`http://localhost/api/colleges/${encodeURIComponent(slug)}`), {
    params: Promise.resolve({ slug }),
  });
}

const detail: CollegeDetail = {
  ...makeCollege({ slug: "kaveri-valley-institute-of-technology-mysuru" }),
  overview: "A private engineering institute.",
  establishedYear: null,
  accreditation: null,
  exams: ["KCET"],
  courses: [],
  placements: [],
  ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 5, 5: 4 },
  reviews: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/colleges/:slug", () => {
  it("returns the college", async () => {
    getCollegeBySlugMock.mockResolvedValue(detail);

    const response = await get(detail.slug);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: detail });
    expect(getCollegeBySlugMock).toHaveBeenCalledWith(detail.slug);
  });

  it("returns 404 when the college doesn't exist", async () => {
    getCollegeBySlugMock.mockResolvedValue(null);

    const response = await get("no-such-college");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "College not found." },
    });
  });

  it.each([
    "Upper-Case",
    "has spaces",
    "double--hyphen",
    "-leading",
    "semi;colon",
    "a".repeat(121),
  ])("rejects the malformed slug %j without querying", async (slug) => {
    const response = await get(slug);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toEqual(expect.any(String));
    expect(getCollegeBySlugMock).not.toHaveBeenCalled();
  });
});
