/**
 * Schemas here are imported by client components, so they use `zod/mini`
 * rather than the classic API. Zod's chained API is not tree-shakeable: it
 * costs about 90 KB gzipped even for one small schema, while `zod/mini` costs
 * under 6 KB. Same library, same rules, one definition — just function calls
 * instead of chained methods.
 */
import * as z from "zod/mini";

/**
 * Query strings and form fields arrive as strings. Blank values mean "not
 * provided", so `?minFees=` behaves the same as leaving the parameter out.
 */
export function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Converts numeric strings to numbers; anything non-numeric becomes NaN and fails validation. */
export function toNumber(value: unknown): unknown {
  const cleaned = emptyToUndefined(value);
  return typeof cleaned === "string" ? Number(cleaned) : cleaned;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const collegeSlugSchema = z
  .string({ error: "A college slug is required." })
  .check(
    z.maxLength(120, "College slugs are at most 120 characters."),
    z.regex(SLUG_PATTERN, "College slugs contain only lowercase letters, numbers and hyphens."),
  );

/** Optional trimmed text: a blank value is treated as absent. */
export function optionalText(maxLength: number, tooLongMessage: string) {
  return z.pipe(
    z.transform(emptyToUndefined),
    z.optional(z.string().check(z.maxLength(maxLength, tooLongMessage))),
  );
}
