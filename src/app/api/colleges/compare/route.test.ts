import { afterEach, describe, expect, it, vi } from "vitest";

import { getCollegesForComparison } from "@/lib/services/colleges";

import { GET } from "./route";

vi.mock("@/lib/services/colleges", () => ({ getCollegesForComparison: vi.fn() }));

const compareMock = vi.mocked(getCollegesForComparison);

function get(query: string) {
  return GET(new Request(`http://localhost/api/colleges/compare${query}`));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/colleges/compare", () => {
  it("passes trimmed slugs through in order and returns the result", async () => {
    compareMock.mockResolvedValue({ colleges: [], missing: ["b"] });

    const response = await get("?slugs=%20a%20,b,c,");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { colleges: [], missing: ["b"] } });
    expect(compareMock).toHaveBeenCalledWith(["a", "b", "c"]);
  });

  it("accepts a single college so the page can show a partial comparison", async () => {
    compareMock.mockResolvedValue({ colleges: [], missing: [] });

    const response = await get("?slugs=only-one");

    expect(response.status).toBe(200);
    expect(compareMock).toHaveBeenCalledWith(["only-one"]);
  });

  it.each([
    ["", "missing parameter"],
    ["?slugs=", "empty list"],
    ["?slugs=,,", "only separators"],
    ["?slugs=a,b,c,d", "more than three"],
    ["?slugs=a,b,a", "duplicates"],
    ["?slugs=a,Not%20Valid", "invalid slug"],
  ])("rejects %j (%s)", async (query) => {
    const response = await get(query);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fieldErrors.slugs).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("explains the three-college limit", async () => {
    const body = await (await get("?slugs=a,b,c,d")).json();
    expect(body.error.fieldErrors.slugs).toContain("You can compare at most 3 colleges.");
  });
});
