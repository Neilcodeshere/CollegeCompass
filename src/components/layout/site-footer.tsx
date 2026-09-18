import { PageContainer } from "./page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <PageContainer className="py-6 text-sm text-neutral-600">
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:gap-8">
          <p>
            <span className="font-medium text-neutral-900">CollegeCompass</span>
            <span aria-hidden="true"> · </span>
            Search, compare and shortlist colleges.
          </p>
          <p className="md:max-w-md md:text-right">
            College information on this site is sample data for demonstration. Confirm fees, cutoffs
            and placements with each institution before deciding.
          </p>
        </div>
        <p className="mt-4 border-t border-neutral-100 pt-4 text-center text-neutral-500">
          Made for internship purposes by Neil{" "}
          <span role="img" aria-label="love">
            ❤️
          </span>
        </p>
      </PageContainer>
    </footer>
  );
}
