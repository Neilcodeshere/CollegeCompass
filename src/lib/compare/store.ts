/**
 * The comparison selection lives in a small module store rather than React
 * context, for three reasons:
 *
 * - it has to survive navigation between the listing, a college page and
 *   /compare, which a page-level provider wouldn't;
 * - components read it through `useSyncExternalStore`, so there is no provider
 *   to thread through the tree and no effect to copy storage into state;
 * - it starts empty on the server and fills in after mount, which keeps
 *   server and client markup identical (no hydration mismatch).
 *
 * It's also persisted to localStorage and kept in step across browser tabs.
 */
import {
  compareReducer,
  EMPTY_SELECTION,
  parseStoredSelection,
  type CompareAction,
  type CompareState,
} from "./selection";

const STORAGE_KEY = "collegecompass:compare";

let state: CompareState = EMPTY_SELECTION;
let hasLoaded = false;
const listeners = new Set<() => void>();

function readStorage(): CompareState {
  try {
    return parseStoredSelection(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing and blocked site data both throw here.
    return EMPTY_SELECTION;
  }
}

function writeStorage(next: CompareState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.items));
  } catch {
    // Selection still works for this page view; it just won't be remembered.
  }
}

function setState(next: CompareState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  setState(readStorage());
}

export function subscribeToCompareStore(listener: () => void): () => void {
  if (!hasLoaded) {
    hasLoaded = true;
    setState(readStorage());
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCompareSnapshot(): CompareState {
  return state;
}

/** Server rendering and the first client render both start from empty. */
export function getCompareServerSnapshot(): CompareState {
  return EMPTY_SELECTION;
}

export function dispatchCompare(action: CompareAction): void {
  const next = compareReducer(state, action);
  if (next === state) return;
  setState(next);
  writeStorage(next);
}
