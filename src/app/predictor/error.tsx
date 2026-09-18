"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/ui/error-state";

export default function PredictorError({ retry }: { error: Error; retry: () => void }) {
  return (
    <PageContainer className="py-8">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <ErrorState
          title="Unable to load the predictor"
          description="We couldn't load cutoff data just now. Please try again in a moment."
          onRetry={retry}
        />
      </div>
    </PageContainer>
  );
}
