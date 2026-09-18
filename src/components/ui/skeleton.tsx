import { cx } from "@/lib/utils";

/**
 * Placeholder block for loading states. Skeletons mirror the shape of the real
 * content so the layout doesn't jump when data arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-sm bg-neutral-200", className)} />;
}
