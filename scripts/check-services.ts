/**
 * Smoke-checks the college services against the configured database.
 * Run: npm run db:check
 */
import "dotenv/config";

import {
  getCollegeBySlug,
  getCollegesForComparison,
  getFilterOptions,
  listColleges,
} from "@/lib/services/colleges";

function check(condition: boolean, message: string) {
  if (!condition) throw new Error(`Check failed: ${message}`);
  console.log(`  ✓ ${message}`);
}

async function main() {
  const defaults = { sort: "rating", page: 1, limit: 12 } as const;

  const firstPage = await listColleges(defaults);
  check(firstPage.data.length === 12, "first page returns 12 colleges");
  check(firstPage.pagination.total === 125, "total counts all 125 colleges");
  check(
    firstPage.data.every((c, i, all) => i === 0 || all[i - 1]!.rating >= c.rating),
    "default sort is highest rated first",
  );
  check(
    firstPage.data.every((c) => c.averagePackage !== null),
    "rows include latest placement",
  );

  const pages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages }, (_, i) =>
      listColleges({ ...defaults, page: i + 1 }),
    ),
  );
  const seen = pages.flatMap((p) => p.data.map((c) => c.id));
  check(
    new Set(seen).size === 125 && seen.length === 125,
    "paging visits every college exactly once",
  );

  const pastEnd = await listColleges({ ...defaults, page: 99 });
  check(
    pastEnd.data.length === 0 && pastEnd.pagination.total === 125,
    "page past the end is empty",
  );

  const pune = await listColleges({ ...defaults, search: "pune" });
  check(pune.data.length > 0 && pune.data.every((c) => c.city === "Pune"), "search matches city");

  const multi = await listColleges({ ...defaults, search: "institute bengaluru" });
  check(
    multi.data.every((c) => c.city === "Bengaluru" && /institute/i.test(c.name)),
    "multi-word search requires every term",
  );

  const filtered = await listColleges({
    ...defaults,
    state: "Karnataka",
    ownership: "PRIVATE",
    minFees: 150_000,
    maxFees: 300_000,
    minRating: 3.5,
    sort: "fees_asc",
  });
  check(
    filtered.data.every(
      (c) =>
        c.state === "Karnataka" &&
        c.ownership === "PRIVATE" &&
        c.annualFees >= 150_000 &&
        c.annualFees <= 300_000 &&
        c.rating >= 3.5,
    ),
    `combined filters hold (${filtered.pagination.total} matches)`,
  );
  check(
    filtered.data.every((c, i, all) => i === 0 || all[i - 1]!.annualFees <= c.annualFees),
    "fees ascending sort",
  );

  const none = await listColleges({ ...defaults, search: "zzzz-no-such-college" });
  check(none.data.length === 0 && none.pagination.totalPages === 0, "no matches returns empty");

  const slug = firstPage.data[0]!.slug;
  const detail = await getCollegeBySlug(slug);
  check(detail !== null, `detail found for ${slug}`);
  check(
    detail!.courses.length > 0 && detail!.placements.length === 3,
    "detail has courses and 3 placement years",
  );
  check(detail!.placements[0]!.year === 2025, "placements are newest first");
  check(
    detail!.reviews.length <= 10 && typeof detail!.reviews[0]?.createdAt === "string",
    "reviews are capped and serialised",
  );
  check(
    Object.values(detail!.ratingDistribution).reduce((a, b) => a + b, 0) === detail!.reviewCount,
    "rating distribution sums to review count",
  );
  check(detail!.exams.length > 0, `exams derived from cutoffs: ${detail!.exams.join(", ")}`);
  check((await getCollegeBySlug("does-not-exist")) === null, "unknown slug returns null");

  const slugs = firstPage.data.slice(0, 2).map((c) => c.slug);
  const comparison = await getCollegesForComparison([slugs[1]!, "missing-college", slugs[0]!]);
  check(
    comparison.colleges.map((c) => c.slug).join() === [slugs[1], slugs[0]].join(),
    "comparison keeps requested order",
  );
  check(comparison.missing.join() === "missing-college", "comparison reports missing slugs");
  check(
    comparison.colleges.every((c) => c.latestPlacement?.year === 2025 && c.courseCount > 0),
    "comparison includes latest placement",
  );

  const options = await getFilterOptions();
  check(
    options.states.reduce((sum, s) => sum + s.count, 0) === 125,
    `${options.states.length} states with counts`,
  );
  check(
    options.feeRange.min < options.feeRange.max,
    `fee range ₹${options.feeRange.min}–₹${options.feeRange.max}`,
  );
}

main()
  .then(() => {
    console.log("All service checks passed.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
