import { expect, test } from "@playwright/test";

/**
 * The API against the real database. Route-level unit tests cover validation
 * with the service mocked; these check the whole path end to end.
 */
test.describe("API", () => {
  test("lists colleges with pagination and caching headers", async ({ request }) => {
    const response = await request.get("/api/colleges");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("s-maxage");

    const body = await response.json();
    expect(body.data).toHaveLength(12);
    expect(body.pagination.total).toBeGreaterThan(100);
    expect(body.data[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      annualFees: expect.any(Number),
      rating: expect.any(Number),
    });
  });

  test("applies filters and rejects invalid ones", async ({ request }) => {
    const filtered = await request.get(
      "/api/colleges?state=Karnataka&ownership=PRIVATE&minRating=3.5&sort=fees_asc&limit=5",
    );
    const body = await filtered.json();
    expect(filtered.status()).toBe(200);
    for (const college of body.data) {
      expect(college.state).toBe("Karnataka");
      expect(college.ownership).toBe("PRIVATE");
      expect(college.rating).toBeGreaterThanOrEqual(3.5);
    }

    const invalid = await request.get("/api/colleges?page=0&minRating=9");
    expect(invalid.status()).toBe(400);
    const error = await invalid.json();
    expect(error.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.error.fieldErrors)).toEqual(
      expect.arrayContaining(["page", "minRating"]),
    );
  });

  test("returns a college with its courses, placements and reviews", async ({ request }) => {
    const list = await request.get("/api/colleges?limit=1");
    const { slug } = (await list.json()).data[0];

    const response = await request.get(`/api/colleges/${slug}`);
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.slug).toBe(slug);
    expect(data.courses.length).toBeGreaterThan(0);
    expect(data.placements.length).toBe(3);
    expect(data.exams.length).toBeGreaterThan(0);
    expect(Object.values(data.ratingDistribution).reduce((a: number, b) => a + Number(b), 0)).toBe(
      data.reviewCount,
    );

    const missing = await request.get("/api/colleges/no-such-college");
    expect(missing.status()).toBe(404);
    expect((await missing.json()).error.code).toBe("NOT_FOUND");
  });

  test("compares colleges and reports slugs it can't find", async ({ request }) => {
    const list = await request.get("/api/colleges?limit=2");
    const [first, second] = (await list.json()).data;

    const response = await request.get(
      `/api/colleges/compare?slugs=${first.slug},missing-college,${second.slug}`,
    );
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.colleges.map((c: { slug: string }) => c.slug)).toEqual([first.slug, second.slug]);
    expect(data.missing).toEqual(["missing-college"]);

    const tooMany = await request.get("/api/colleges/compare?slugs=a,b,c,d");
    expect(tooMany.status()).toBe(400);
  });

  test("predicts colleges from a rank", async ({ request }) => {
    const response = await request.post("/api/predict", {
      data: { exam: "MHT_CET", rank: 12450 },
    });
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.basisYear).toBeGreaterThan(2000);
    expect(data.results.length).toBeGreaterThan(0);

    const bandOrder = ["LIKELY", "BORDERLINE", "REACH"];
    const bands = data.results.map((r: { band: string }) => bandOrder.indexOf(r.band));
    expect(bands).toEqual([...bands].sort((a, b) => a - b));

    for (const result of data.results) {
      for (const course of result.courses) {
        // Nothing below the reach threshold should be suggested.
        expect(course.closingRank).toBeGreaterThanOrEqual(Math.ceil(12450 * 0.7));
      }
    }

    const invalid = await request.post("/api/predict", { data: { exam: "NEET", rank: -1 } });
    expect(invalid.status()).toBe(400);

    const wrongMethod = await request.get("/api/predict");
    expect(wrongMethod.status()).toBe(405);
  });
});
