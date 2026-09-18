import type { Metadata } from "next";

import { PredictorView } from "@/components/predictor/predictor-view";
import { predictColleges } from "@/lib/services/predictor";
import { predictorFormSchema } from "@/lib/validation/predictor";

export const metadata: Metadata = {
  title: "College Predictor — Explore Colleges Based on Your Rank",
  description:
    "Enter your entrance exam and rank to see colleges whose historical closing ranks sit near it, grouped as likely, borderline or a reach.",
};

/**
 * A /predictor link that already carries a valid exam and rank is rendered
 * with its results, so a shared prediction works on first paint. Invalid or
 * missing inputs simply show the empty form.
 */
export default async function PredictorPage(props: PageProps<"/predictor">) {
  const searchParams = await props.searchParams;
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value.at(-1) : value;

  const parsed = predictorFormSchema.safeParse({
    exam: single(searchParams.exam),
    rank: single(searchParams.rank),
    category: single(searchParams.category),
  });

  if (!parsed.success) return <PredictorView />;

  const data = await predictColleges(parsed.data);
  return <PredictorView initial={{ input: parsed.data, data }} />;
}
