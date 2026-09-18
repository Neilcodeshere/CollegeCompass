import type { ComponentProps } from "react";

import { cx } from "@/lib/utils";

/** `text-base` (16px) keeps mobile browsers from zooming in on focus. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-900",
        "placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}

/** Native select: it gets the platform's own picker on phones for free. */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx(
        "h-10 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900",
        "disabled:bg-neutral-100 disabled:text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}
