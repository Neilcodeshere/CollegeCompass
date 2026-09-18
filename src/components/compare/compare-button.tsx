"use client";

import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompareSelection } from "@/hooks/use-compare-selection";
import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";
import type { CompareItem } from "@/lib/compare/selection";

/**
 * Adds or removes a college from the comparison. Uses `aria-pressed` because
 * it is a toggle, not an action, and stays visible (disabled, with a reason)
 * once three colleges are selected rather than disappearing.
 */
export function CompareButton({
  college,
  size = "sm",
}: {
  college: CompareItem;
  size?: "sm" | "md";
}) {
  const { isSelected, isFull, toggle } = useCompareSelection();
  const selected = isSelected(college.slug);
  const blocked = !selected && isFull;

  return (
    <Button
      variant={selected ? "primary" : "secondary"}
      size={size}
      aria-pressed={selected}
      disabled={blocked}
      title={blocked ? `You can compare up to ${MAX_COMPARE_COLLEGES} colleges` : undefined}
      onClick={() => toggle(college)}
    >
      {selected ? (
        <Check aria-hidden="true" className="size-4" strokeWidth={2} />
      ) : (
        <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
      )}
      {selected ? "Comparing" : "Compare"}
      <span className="sr-only">{college.name}</span>
    </Button>
  );
}
