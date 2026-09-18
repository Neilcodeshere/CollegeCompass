import type { CollegeBasics, CollegeSummary } from "@/types/api";

export function makeCollege(overrides: Partial<CollegeBasics> = {}): CollegeBasics {
  const id = overrides.id ?? "college-1";
  return {
    id,
    slug: `${id}-slug`,
    name: `College ${id}`,
    shortName: "CC",
    city: "Pune",
    state: "Maharashtra",
    ownership: "PRIVATE",
    annualFees: 200_000,
    rating: 4.1,
    reviewCount: 10,
    ...overrides,
  };
}

export function makeCollegeSummary(overrides: Partial<CollegeSummary> = {}): CollegeSummary {
  return {
    ...makeCollege(overrides),
    averagePackage: 800_000,
    placementYear: 2025,
    ...overrides,
  };
}
