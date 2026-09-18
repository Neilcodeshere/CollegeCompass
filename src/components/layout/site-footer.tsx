import { PageContainer } from "./page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <PageContainer className="flex flex-col gap-2 py-6 text-sm text-neutral-600 md:flex-row md:justify-between md:gap-8">
        <p>
          <span className="font-medium text-neutral-900">CollegeCompass</span>
          <span aria-hidden="true"> · </span>
          Search, compare and shortlist colleges.
        </p>
        <p className="md:max-w-md md:text-right">
          College information on this site is sample data for demonstration. Confirm fees, cutoffs
          and placements with each institution before deciding.
        </p>
      </PageContainer>
    </footer>
  );
}
