"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePredictionQuery } from "@/hooks/use-prediction-query";
import { predictorFormSchema, type PredictorFormValues } from "@/lib/validation/predictor";
import type { PredictionResult } from "@/types/api";

import { PredictorForm } from "./predictor-form";
import { PredictorResults } from "./predictor-results";

/**
 * The submitted exam and rank live in the URL, so a prediction can be shared,
 * reloaded and reached with the Back button — the same approach the discovery
 * page uses for filters.
 */
export function PredictorView({
  initial,
}: {
  initial?: { input: PredictorFormValues; data: PredictionResult };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const draft = {
    exam: searchParams.get("exam") ?? "",
    rank: searchParams.get("rank") ?? "",
    category: searchParams.get("category") ?? "GENERAL",
  };
  const parsed = predictorFormSchema.safeParse(draft);
  const input = parsed.success ? parsed.data : null;

  const { data, isFetching, isError, refetch } = usePredictionQuery(input, initial);

  const submit = (values: PredictorFormValues) => {
    const params = new URLSearchParams({
      exam: values.exam,
      rank: String(values.rank),
      ...(values.category !== "GENERAL" && { category: values.category }),
    });
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  };

  const results = () => {
    if (input === null) {
      return (
        <EmptyState
          title="Enter your exam and rank"
          description="Pick your entrance exam and enter your rank to see which colleges admitted students near that rank."
        />
      );
    }
    if (isError && !data) {
      return (
        <ErrorState
          title="Unable to load predictions"
          description="We couldn't work out your matches just now. Please try again."
          onRetry={() => void refetch()}
        />
      );
    }
    if (!data) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-52 w-full rounded-lg" />
            ))}
          </div>
        </div>
      );
    }
    return <PredictorResults result={data} />;
  };

  return (
    <PageContainer className="py-8">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">College predictor</h1>
        <p className="mt-1 max-w-prose text-sm text-neutral-600">
          Enter your entrance exam and rank to see colleges whose past cutoffs sit near it. These
          are estimates from historical closing ranks in our sample data, not an official prediction
          or an offer of admission.
        </p>
      </header>

      <div className="mt-6">
        <PredictorForm initialValues={draft} onSubmit={submit} />
      </div>

      <div className="mt-8" aria-busy={isFetching}>
        {results()}
      </div>
    </PageContainer>
  );
}
