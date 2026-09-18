"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  isFull as isSelectionFull,
  isSelected as isSlugSelected,
  selectedSlugs,
  type CompareItem,
} from "@/lib/compare/selection";
import {
  dispatchCompare,
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeToCompareStore,
} from "@/lib/compare/store";

export function useCompareSelection() {
  const state = useSyncExternalStore(
    subscribeToCompareStore,
    getCompareSnapshot,
    getCompareServerSnapshot,
  );

  return {
    items: state.items,
    slugs: selectedSlugs(state),
    count: state.items.length,
    isFull: isSelectionFull(state),
    isSelected: useCallback((slug: string) => isSlugSelected(state, slug), [state]),
    toggle: useCallback((item: CompareItem) => dispatchCompare({ type: "toggle", item }), []),
    add: useCallback((item: CompareItem) => dispatchCompare({ type: "add", item }), []),
    remove: useCallback((slug: string) => dispatchCompare({ type: "remove", slug }), []),
    replace: useCallback((items: CompareItem[]) => dispatchCompare({ type: "replace", items }), []),
  };
}
