import type { Metadata } from "next";

import { ComparisonView } from "@/components/compare/comparison-view";
import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";
import { getCollegesForComparison } from "@/lib/services/colleges";
import { compareQuerySchema } from "@/lib/validation/colleges";

export const metadata: Metadata = {
  title: `Compare Colleges — Fees, Placements and Ratings Side by Side`,
  description: `Compare up to ${MAX_COMPARE_COLLEGES} colleges on fees, placements, ratings, courses and accepted entrance exams.`,
};

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.slugs;
  const parsed = compareQuerySchema.safeParse({
    slugs: Array.isArray(raw) ? raw.at(-1) : raw,
  });

  // An invalid or empty `slugs` parameter isn't an error here: the page shows
  // its empty state and invites the student to pick colleges.
  const slugs = parsed.success ? parsed.data.slugs : [];
  const initialData =
    slugs.length > 0 ? await getCollegesForComparison(slugs) : { colleges: [], missing: [] };

  return <ComparisonView initialSlugs={slugs} initialData={initialData} />;
}
