import * as z from "zod/mini";

import { Ownership } from "@/generated/prisma/enums";
import {
  COLLEGE_SORTS,
  DEFAULT_COLLEGE_SORT,
  DEFAULT_PAGE_SIZE,
  MAX_COMPARE_COLLEGES,
  MAX_PAGE_SIZE,
} from "@/lib/colleges/constants";

import { collegeSlugSchema, emptyToUndefined, optionalText, toNumber } from "./shared";

const MAX_FEES = 10_000_000;

const feesSchema = z
  .number({ error: "Fees must be a number." })
  .check(
    z.int("Fees must be a whole number of rupees."),
    z.minimum(0, "Fees can't be negative."),
    z.maximum(MAX_FEES, "Fees must be ₹1 crore or less."),
  );

/**
 * Query parameters for GET /api/colleges. Shared with the discovery page so
 * the server, the API and the URL all agree on what a valid filter is.
 */
export const collegeListQuerySchema = z
  .object({
    search: optionalText(100, "Search text must be 100 characters or fewer."),
    state: optionalText(60, "State must be 60 characters or fewer."),
    ownership: z.pipe(
      z.transform(emptyToUndefined),
      z.optional(z.enum(Ownership, { error: "Ownership must be GOVERNMENT or PRIVATE." })),
    ),
    minFees: z.pipe(z.transform(toNumber), z.optional(feesSchema)),
    maxFees: z.pipe(z.transform(toNumber), z.optional(feesSchema)),
    minRating: z.pipe(
      z.transform(toNumber),
      z.optional(
        z
          .number({ error: "Minimum rating must be a number." })
          .check(
            z.minimum(0, "Minimum rating must be between 0 and 5."),
            z.maximum(5, "Minimum rating must be between 0 and 5."),
          ),
      ),
    ),
    sort: z.pipe(
      z.transform(emptyToUndefined),
      z._default(
        z.enum(COLLEGE_SORTS, { error: `Sort must be one of: ${COLLEGE_SORTS.join(", ")}.` }),
        DEFAULT_COLLEGE_SORT,
      ),
    ),
    page: z.pipe(
      z.transform(toNumber),
      z._default(
        z
          .number({ error: "Page must be a number." })
          .check(
            z.int("Page must be a whole number."),
            z.minimum(1, "Page must be 1 or greater."),
            z.maximum(10_000, "Page is too large."),
          ),
        1,
      ),
    ),
    limit: z.pipe(
      z.transform(toNumber),
      z._default(
        z
          .number({ error: "Limit must be a number." })
          .check(
            z.int("Limit must be a whole number."),
            z.minimum(1, `Limit must be between 1 and ${MAX_PAGE_SIZE}.`),
            z.maximum(MAX_PAGE_SIZE, `Limit must be between 1 and ${MAX_PAGE_SIZE}.`),
          ),
        DEFAULT_PAGE_SIZE,
      ),
    ),
  })
  .check(
    z.refine(
      (query) =>
        query.minFees === undefined ||
        query.maxFees === undefined ||
        query.minFees <= query.maxFees,
      {
        error: "Maximum fees must be greater than or equal to minimum fees.",
        path: ["maxFees"],
      },
    ),
  );

export type CollegeListQuery = z.output<typeof collegeListQuerySchema>;

/** Query parameters for GET /api/colleges/compare: `?slugs=a,b,c`. */
export const compareQuerySchema = z.object({
  slugs: z.pipe(
    z.string({
      error: `Provide 1 to ${MAX_COMPARE_COLLEGES} college slugs, separated by commas.`,
    }),
    z.pipe(
      z.transform((value: string) =>
        value
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean),
      ),
      z.array(collegeSlugSchema).check(
        z.minLength(1, `Provide 1 to ${MAX_COMPARE_COLLEGES} college slugs, separated by commas.`),
        z.maxLength(
          MAX_COMPARE_COLLEGES,
          `You can compare at most ${MAX_COMPARE_COLLEGES} colleges.`,
        ),
        z.refine((slugs) => new Set(slugs).size === slugs.length, {
          error: "Each college can only be compared once.",
        }),
      ),
    ),
  ),
});
