"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { pageItems } from "@/lib/colleges/pagination";
import { cx } from "@/lib/utils";

const iconButton = "inline-flex size-9 items-center justify-center rounded-md";

/**
 * Numbered pagination. Page numbers are shown from `sm` up; on phones the
 * same controls stay usable with a "Page 2 of 11" readout instead.
 */
export function CollegePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        aria-label="Previous page"
        className={buttonStyles({ variant: "secondary", className: iconButton })}
      >
        <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>

      <p className="text-sm text-neutral-600 tabular-nums sm:hidden">
        Page {page} of {totalPages}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-neutral-400">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={buttonStyles({
                  variant: item === page ? "primary" : "secondary",
                  className: cx(iconButton, "tabular-nums"),
                })}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        aria-label="Next page"
        className={buttonStyles({ variant: "secondary", className: iconButton })}
      >
        <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </nav>
  );
}
