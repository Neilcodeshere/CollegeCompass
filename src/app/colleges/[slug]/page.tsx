import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CollegeHeader } from "@/components/colleges/college-header";
import { CompareButton } from "@/components/compare/compare-button";
import { CoursesTable } from "@/components/colleges/courses-table";
import { PlacementTable } from "@/components/colleges/placement-section";
import { ReviewsSection } from "@/components/colleges/reviews-section";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/ui/section";
import { DEGREE_LABELS } from "@/lib/colleges/constants";
import { formatCurrency } from "@/lib/format";
import { getAllCollegeSlugs, getCollegeBySlug } from "@/lib/services/colleges";
import { collegeSlugSchema } from "@/lib/validation/shared";

// College data changes only when the database is reseeded, so a rendered page
// can be cached and refreshed hourly instead of on every request.
export const revalidate = 3600;

/**
 * Only these slugs exist, so anything else is rejected during routing with a
 * real 404 status. Without this, Next streams the page shell (committing a 200
 * response) before `notFound()` runs, which would leave missing colleges as
 * soft 404s — fine for people, wrong for crawlers.
 *
 * The trade-off: the build needs database access, and a newly added college
 * needs a redeploy to become reachable.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllCollegeSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * `cache` dedupes the query within one request: the page and generateMetadata
 * both need the college, but only one database round trip happens.
 */
const loadCollege = cache(async (slug: string) => {
  const parsed = collegeSlugSchema.safeParse(slug);
  return parsed.success ? getCollegeBySlug(parsed.data) : null;
});

export async function generateMetadata(props: PageProps<"/colleges/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const college = await loadCollege(slug);
  if (!college) return { title: "College not found" };

  const latest = college.placements[0];
  return {
    title: `${college.name} — Courses, Fees, Placements & Reviews`,
    description: [
      `${college.name} is in ${college.city}, ${college.state}.`,
      `Annual B.Tech fees ${formatCurrency(college.annualFees)}.`,
      latest
        ? `${college.courses.length} programmes and placement data up to ${latest.year}.`
        : null,
      "Sample data for demonstration.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export default async function CollegeDetailPage(props: PageProps<"/colleges/[slug]">) {
  const { slug } = await props.params;
  const college = await loadCollege(slug);
  if (!college) notFound();

  const degreesOffered = [...new Set(college.courses.map((course) => course.degree))]
    .map((degree) => DEGREE_LABELS[degree])
    .join(", ");

  return (
    <PageContainer className="py-8">
      <CollegeHeader
        college={college}
        action={
          <CompareButton
            size="md"
            college={{
              slug: college.slug,
              name: college.name,
              shortName: college.shortName,
              city: college.city,
            }}
          />
        }
      />

      <div className="mt-8 space-y-8">
        <Section id="overview" title="Overview">
          <p className="max-w-prose text-neutral-700">{college.overview}</p>
        </Section>

        <Section
          id="courses"
          title="Courses"
          description={
            college.courses.length > 0
              ? `${college.courses.length} programmes across ${degreesOffered}.`
              : undefined
          }
        >
          <CoursesTable courses={college.courses} />
        </Section>

        <Section
          id="placements"
          title="Placements"
          description="Packages are per annum, as reported for each graduating batch."
        >
          <PlacementTable placements={college.placements} />
        </Section>

        <Section
          id="reviews"
          title="Student reviews"
          description="Sample reviews written for this demonstration dataset, not real students."
        >
          <ReviewsSection
            rating={college.rating}
            reviewCount={college.reviewCount}
            distribution={college.ratingDistribution}
            reviews={college.reviews}
          />
        </Section>
      </div>
    </PageContainer>
  );
}
