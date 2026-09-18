/** An ellipsis stands in for a run of skipped page numbers. */
export type PageItem = number | "gap";

/**
 * Page numbers to show: always the first and last page, the current page with
 * one neighbour on each side, and a gap marker where numbers were skipped.
 * Keeps the control a predictable width however many pages there are.
 */
export function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  const pages = new Set<number>([1, totalPages]);
  for (let candidate = page - 1; candidate <= page + 1; candidate++) {
    if (candidate >= 1 && candidate <= totalPages) pages.add(candidate);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let previous = 0;
  for (const current of sorted) {
    // An ellipsis standing in for a single page would take the same room as
    // the number itself, so show the number instead.
    if (previous && current - previous === 2) items.push(current - 1);
    else if (previous && current - previous > 2) items.push("gap");
    items.push(current);
    previous = current;
  }
  return items;
}
