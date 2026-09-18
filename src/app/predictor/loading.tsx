import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function PredictorLoading() {
  return (
    <PageContainer className="py-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-full max-w-prose" />
      <Skeleton className="mt-6 h-28 w-full rounded-lg" />
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-52 w-full rounded-lg" />
        ))}
      </div>
    </PageContainer>
  );
}
