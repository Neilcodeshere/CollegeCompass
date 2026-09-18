import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <PageContainer className="py-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    </PageContainer>
  );
}
