import type { ReactNode } from "react";

/** Explains why there's nothing to show and what to do next. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-base font-semibold text-neutral-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center gap-3">{action}</div> : null}
    </div>
  );
}
