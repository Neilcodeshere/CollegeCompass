"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/ui/error-state";

export default function CollegeDetailError({ retry }: { error: Error; retry: () => void }) {
  return (
    <PageContainer className="py-8">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <ErrorState
          title="Unable to load this college"
          description="We couldn't load the college details just now. Please try again in a moment."
          onRetry={retry}
        />
      </div>
    </PageContainer>
  );
}
