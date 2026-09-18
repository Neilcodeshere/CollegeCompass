import * as z from "zod/mini";

import { Category, Exam } from "@/generated/prisma/enums";
import { EXAM_LABELS, EXAM_MAX_RANK } from "@/lib/exams";
import { formatRank } from "@/lib/format";

import { emptyToUndefined, toNumber } from "./shared";

type RankInput = { exam: Exam; rank: number };

/**
 * Each exam's merit list has a different size, so the rank limit depends on
 * the exam chosen. Shared by the API body schema and the form schema so the
 * browser and the server enforce exactly the same rule.
 */
function rankTooLargeMessage({ exam, rank }: RankInput): string | null {
  const maxRank = EXAM_MAX_RANK[exam];
  if (rank <= maxRank) return null;
  return `${EXAM_LABELS[exam]} ranks go up to ${formatRank(maxRank)}.`;
}

const rankSchema = z
  .number({ error: "Enter your rank as a number." })
  .check(z.int("Rank must be a whole number."), z.positive("Rank must be greater than 0."));

/** Body of POST /api/predict, where rank arrives as a JSON number. */
export const predictRequestSchema = z
  .object({
    exam: z.enum(Exam, { error: "Choose an entrance exam." }),
    rank: rankSchema,
    category: z._default(z.enum(Category, { error: "Choose a valid category." }), Category.GENERAL),
  })
  .check((ctx) => {
    const message = rankTooLargeMessage(ctx.value);
    if (message) ctx.issues.push({ code: "custom", message, path: ["rank"], input: ctx.value });
  });

export type PredictRequest = z.output<typeof predictRequestSchema>;

/**
 * The same inputs as they arrive from the form and the URL: all strings.
 * Used to validate before submitting and to read a shared /predictor link.
 */
export const predictorFormSchema = z
  .object({
    exam: z.pipe(
      z.transform(emptyToUndefined),
      z.enum(Exam, { error: "Choose an entrance exam." }),
    ),
    rank: z.pipe(
      z.transform(toNumber),
      z
        .number({
          error: (issue) =>
            issue.input === undefined ? "Enter your rank." : "Rank must be a number.",
        })
        .check(z.int("Rank must be a whole number."), z.positive("Rank must be greater than 0.")),
    ),
    category: z.pipe(
      z.transform(emptyToUndefined),
      z._default(z.enum(Category, { error: "Choose a valid category." }), Category.GENERAL),
    ),
  })
  .check((ctx) => {
    const message = rankTooLargeMessage(ctx.value);
    if (message) ctx.issues.push({ code: "custom", message, path: ["rank"], input: ctx.value });
  });

export type PredictorFormValues = z.output<typeof predictorFormSchema>;

/** First error message per field, ready to render under each input. */
export type PredictorFieldErrors = Partial<Record<"exam" | "rank" | "category", string>>;

export function toFieldErrors(error: z.core.$ZodError): PredictorFieldErrors {
  const fieldErrors: PredictorFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "exam" || field === "rank" || field === "category") {
      fieldErrors[field] ??= issue.message;
    }
  }
  return fieldErrors;
}
