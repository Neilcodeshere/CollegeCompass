/**
 * Replaces all college data with the generated sample dataset.
 *
 * Safe to run repeatedly: everything happens in one transaction that clears
 * the tables and inserts the same deterministic rows, so the database either
 * ends up fully seeded or unchanged.
 *
 * Run with `npm run db:seed` (uses DIRECT_URL from .env).
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { generateDataset } from "./seed-data/generate";

const CUTOFF_BATCH_SIZE = 5_000;

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL is not set. Copy .env.example to .env and fill it in.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const data = generateDataset();
  const startedAt = Date.now();

  await prisma.$transaction(
    async (tx) => {
      // Children first. Deletes would cascade anyway; the order keeps intent obvious.
      await tx.review.deleteMany();
      await tx.cutoff.deleteMany();
      await tx.placementRecord.deleteMany();
      await tx.course.deleteMany();
      await tx.college.deleteMany();

      await tx.college.createMany({ data: data.colleges });
      await tx.course.createMany({ data: data.courses });
      await tx.placementRecord.createMany({ data: data.placements });
      await tx.review.createMany({ data: data.reviews });
      for (let i = 0; i < data.cutoffs.length; i += CUTOFF_BATCH_SIZE) {
        await tx.cutoff.createMany({ data: data.cutoffs.slice(i, i + CUTOFF_BATCH_SIZE) });
      }
    },
    { maxWait: 20_000, timeout: 180_000 },
  );

  console.log(
    [
      `Seeded sample data in ${((Date.now() - startedAt) / 1000).toFixed(1)}s:`,
      `  ${data.colleges.length} colleges`,
      `  ${data.courses.length} courses`,
      `  ${data.cutoffs.length} cutoffs`,
      `  ${data.placements.length} placement records`,
      `  ${data.reviews.length} reviews`,
    ].join("\n"),
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
