import type { ComponentProps } from "react";

import { cx } from "@/lib/utils";

/**
 * Plain data tables with shared styling. Wrapped in a horizontally scrollable
 * container so a wide table stays readable on a phone instead of being
 * squeezed into unreadable columns.
 */
export function TableWrapper({
  className,
  children,
}: {
  className?: string;
  children: ComponentProps<"table">["children"];
}) {
  return (
    <div className={cx("overflow-x-auto rounded-lg border border-neutral-200 bg-white", className)}>
      {children}
    </div>
  );
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cx("w-full min-w-xl border-collapse text-sm", className)} {...props} />;
}

export function Th({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cx(
        "border-b border-neutral-200 px-4 py-2.5 text-left text-xs font-semibold text-neutral-600",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cx("border-b border-neutral-200 px-4 py-3 text-neutral-900", className)}
      {...props}
    />
  );
}

/** Right-aligned numeric cell with figures that line up vertically. */
export function TdNumber({ className, ...props }: ComponentProps<"td">) {
  return <Td className={cx("text-right tabular-nums", className)} {...props} />;
}

export function ThNumber({ className, ...props }: ComponentProps<"th">) {
  return <Th className={cx("text-right", className)} {...props} />;
}
