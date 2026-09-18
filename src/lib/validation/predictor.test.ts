import { describe, expect, it } from "vitest";

import { predictorFormSchema, toFieldErrors } from "./predictor";

/** Validates raw form/URL values and returns per-field messages. */
function validate(values: Record<string, string>) {
  const result = predictorFormSchema.safeParse(values);
  return result.success ? { data: result.data } : { errors: toFieldErrors(result.error) };
}

describe("predictorFormSchema", () => {
  it("accepts a complete form and defaults the category to General", () => {
    expect(validate({ exam: "MHT_CET", rank: "12450", category: "" })).toEqual({
      data: { exam: "MHT_CET", rank: 12450, category: "GENERAL" },
    });
  });

  it("keeps an explicit category", () => {
    expect(validate({ exam: "JEE_MAIN", rank: "45000", category: "OBC" }).data?.category).toBe(
      "OBC",
    );
  });

  it("requires an exam", () => {
    expect(validate({ exam: "", rank: "100" }).errors?.exam).toBe("Choose an entrance exam.");
    expect(validate({ exam: "NEET", rank: "100" }).errors?.exam).toBe("Choose an entrance exam.");
  });

  it.each([
    ["", "Enter your rank."],
    ["   ", "Enter your rank."],
    ["abc", "Rank must be a number."],
    ["12,450", "Rank must be a number."],
    ["0", "Rank must be greater than 0."],
    ["-5", "Rank must be greater than 0."],
    ["12.5", "Rank must be a whole number."],
  ])("rejects the rank %j with %j", (rank, message) => {
    expect(validate({ exam: "KCET", rank }).errors?.rank).toBe(message);
  });

  it("caps the rank at each exam's merit list size", () => {
    expect(validate({ exam: "KCET", rank: "300001" }).errors?.rank).toBe(
      "KCET ranks go up to 3,00,000.",
    );
    expect(validate({ exam: "KCET", rank: "300000" }).data?.rank).toBe(300_000);
    // A rank invalid for one exam can be valid for a bigger one.
    expect(validate({ exam: "JEE_MAIN", rank: "300001" }).data?.rank).toBe(300_001);
  });

  it("reports every invalid field at once", () => {
    expect(validate({ exam: "", rank: "" }).errors).toEqual({
      exam: "Choose an entrance exam.",
      rank: "Enter your rank.",
    });
  });
});
