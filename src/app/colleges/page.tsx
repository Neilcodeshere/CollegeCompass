import type { Metadata } from "next";

import { CollegeDiscovery } from "@/components/colleges/college-discovery";
import { parseCollegeFilters } from "@/lib/filters/college-filters";
import { getFilterOptions, listColleges } from "@/lib/services/colleges";

export const metadata: Metadata = {
  title: "Browse Colleges — Search by Location, Fees and Rating",
  description:
    "Search engineering colleges by name, city or state, filter by fees, ownership and rating, and open any college for courses, placements and reviews.",
};

/**
 * Renders the first result set on the server so the page arrives with content
 * (good for sharing and indexing), then hands the same filters and data to the
 * client, which takes over subsequent searches, filters and paging.
 */
export default async function CollegesPage(props: PageProps<"/colleges">) {
  const filters = parseCollegeFilters(await props.searchParams);

  const [initialData, filterOptions] = await Promise.all([
    listColleges(filters),
    getFilterOptions(),
  ]);
  const totalColleges = filterOptions.states.reduce((sum, state) => sum + state.count, 0);

  return (
    <CollegeDiscovery
      initialQuery={filters}
      initialData={initialData}
      filterOptions={filterOptions}
      totalColleges={totalColleges}
    />
  );
}
