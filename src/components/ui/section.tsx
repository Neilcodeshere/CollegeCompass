import type { ReactNode } from "react";

/**
 * A titled block of college information. Every section on the detail page uses
 * this, so heading levels, spacing and dividers stay consistent.
 */
export function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-neutral-200 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`${id}-heading`} className="text-lg font-semibold text-neutral-900">
          {title}
        </h2>
        {action}
      </div>
      {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
