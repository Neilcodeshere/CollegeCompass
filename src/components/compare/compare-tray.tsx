"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button";
import { useCompareSelection } from "@/hooks/use-compare-selection";
import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";

/**
 * Shows the current selection above the page while the student browses.
 * Appears only when something is selected, and never on /compare, where the
 * comparison itself is already on screen.
 *
 * Sticky rather than fixed, and placed before the footer: it hugs the bottom
 * of the viewport while scrolling, then settles into the flow above the footer
 * at the end of the page, so it never covers content.
 */
export function CompareTray() {
  const pathname = usePathname();
  const { items, slugs, count, remove } = useCompareSelection();

  if (count === 0 || pathname === "/compare") return null;

  return (
    // A labelled section, so this bar is a landmark rather than loose content
    // between the page and the footer.
    <section
      aria-label="Comparison selection"
      className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white shadow-overlay"
    >
      <PageContainer className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <h2 className="text-sm font-medium text-neutral-900">
          {count} of {MAX_COMPARE_COLLEGES} selected
        </h2>

        <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {items.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => remove(item.slug)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-300 py-1 pr-2 pl-3 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <span className="truncate">{item.shortName}</span>
                <X aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2} />
                <span className="sr-only">Remove {item.name} from comparison</span>
              </button>
            </li>
          ))}
        </ul>

        <ButtonLink href={`/compare?slugs=${slugs.join(",")}`}>Compare</ButtonLink>
      </PageContainer>
    </section>
  );
}
