import { AlertCircle } from "lucide-react";

import { Button } from "./button";

/** Full replacement for content that failed to load. */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-6 py-12 text-center" role="alert">
      <AlertCircle
        aria-hidden="true"
        className="mx-auto size-5 text-danger-600"
        strokeWidth={1.75}
      />
      <p className="mt-3 text-base font-semibold text-neutral-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">{description}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Inline version used when a refresh fails but previous results are still on
 * screen: the student keeps the stale list instead of losing it.
 */
export function ErrorBanner({
  description,
  onRetry,
}: {
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-danger-600/30 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      <AlertCircle aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      <p className="min-w-0 flex-1">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="font-medium text-danger-700 underline underline-offset-2"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
