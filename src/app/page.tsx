import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFilterOptions } from "@/lib/services/colleges";
import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";

const FEATURES = [
  {
    title: "Search and filter",
    description:
      "Narrow colleges by state, ownership, annual fees and student rating. Every filter is in the URL, so a shortlist can be bookmarked or shared.",
  },
  {
    title: "Compare side by side",
    description: `Put up to ${MAX_COMPARE_COLLEGES} colleges next to each other on fees, placements, ratings, courses and accepted exams.`,
  },
  {
    title: "Check your rank",
    description:
      "Enter your entrance exam and rank to see which colleges' past cutoffs sit near it, grouped as likely, borderline or a reach.",
  },
] as const;

export default async function HomePage() {
  const { states } = await getFilterOptions();
  const totalColleges = states.reduce((sum, state) => sum + state.count, 0);

  return (
    <PageContainer className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-neutral-900">Find the right college for you.</h1>
        <p className="mt-3 text-neutral-600">
          Search {totalColleges} engineering colleges by location, fees and rating, compare them
          side by side, and see which ones admitted students near your entrance-exam rank.
        </p>

        {/*
          A plain GET form: it navigates to the discovery page with the search
          already applied, and works before any JavaScript loads.
        */}
        <form action="/colleges" method="get" className="mt-6 flex gap-2" role="search">
          <Input
            name="search"
            type="text"
            aria-label="Search colleges"
            placeholder="Search by college, city or state"
            className="h-11"
            autoComplete="off"
          />
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-12 grid gap-8 border-t border-neutral-200 pt-8 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <section key={feature.title}>
            <h2 className="text-base font-semibold text-neutral-900">{feature.title}</h2>
            <p className="mt-1.5 text-sm text-neutral-600">{feature.description}</p>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
