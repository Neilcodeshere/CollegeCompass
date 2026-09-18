import { PageContainer } from "@/components/layout/page-container";
import { CollegeResultsSkeleton } from "@/components/colleges/college-results";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the server renders the first page of results. */
export default function CollegesLoading() {
  return (
    <PageContainer className="py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <div className="hidden space-y-6 lg:block">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-4 w-32" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-2 h-4 w-32" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-56" />
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <CollegeResultsSkeleton />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
