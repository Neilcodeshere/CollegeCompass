/**
 * Pure rules for the comparison selection. Kept free of React and storage so
 * the limits that matter — at most three colleges, never the same one twice —
 * can be tested directly.
 */
import * as z from "zod/mini";

import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";
import { collegeSlugSchema } from "@/lib/validation/shared";

/**
 * Just enough about a college to render the tray and the comparison columns
 * without another request.
 */
export const compareItemSchema = z.object({
  slug: collegeSlugSchema,
  name: z.string().check(z.minLength(1), z.maxLength(200)),
  shortName: z.string().check(z.minLength(1), z.maxLength(40)),
  city: z.string().check(z.minLength(1), z.maxLength(80)),
});

export type CompareItem = z.output<typeof compareItemSchema>;

export type CompareState = { items: CompareItem[] };

export const EMPTY_SELECTION: CompareState = { items: [] };

export type CompareAction =
  | { type: "toggle"; item: CompareItem }
  | { type: "add"; item: CompareItem }
  | { type: "remove"; slug: string }
  | { type: "replace"; items: CompareItem[] }
  | { type: "clear" };

export function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "toggle":
      return isSelected(state, action.item.slug)
        ? compareReducer(state, { type: "remove", slug: action.item.slug })
        : compareReducer(state, { type: "add", item: action.item });

    case "add":
      // Silently ignore duplicates and anything past the limit; the UI marks
      // full selections so this is never the student's only feedback.
      if (isSelected(state, action.item.slug) || isFull(state)) return state;
      return { items: [...state.items, action.item] };

    case "remove": {
      if (!isSelected(state, action.slug)) return state;
      return { items: state.items.filter((item) => item.slug !== action.slug) };
    }

    case "replace":
      return { items: dedupe(action.items).slice(0, MAX_COMPARE_COLLEGES) };

    case "clear":
      return state.items.length === 0 ? state : EMPTY_SELECTION;
  }
}

export function isSelected(state: CompareState, slug: string): boolean {
  return state.items.some((item) => item.slug === slug);
}

export function isFull(state: CompareState): boolean {
  return state.items.length >= MAX_COMPARE_COLLEGES;
}

export function selectedSlugs(state: CompareState): string[] {
  return state.items.map((item) => item.slug);
}

function dedupe(items: CompareItem[]): CompareItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

/** Parses stored selections, discarding anything that isn't a valid item. */
export function parseStoredSelection(raw: string | null): CompareState {
  if (!raw) return EMPTY_SELECTION;
  try {
    const parsed = z.array(compareItemSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_SELECTION;
    return compareReducer(EMPTY_SELECTION, { type: "replace", items: parsed.data });
  } catch {
    return EMPTY_SELECTION;
  }
}
