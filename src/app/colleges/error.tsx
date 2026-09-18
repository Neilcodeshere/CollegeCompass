"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/ui/error-state";

/** Catches failures while the server renders the college list. */
export default function CollegesError({ retry }: { error: Error; retry: () => void }) {
  return (
    <PageContainer className="py-8">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <ErrorState
          title="Unable to load colleges"
          description="We couldn't reach the college data just now. Please try again in a moment."
          onRetry={retry}
        />
      </div>
    </PageContainer>
  );
}
