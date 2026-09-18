"use client";

import { useEffect, useState } from "react";

/**
 * Delays a rapidly changing value. Used so typing in the search box updates
 * the URL and fires a request only after a short pause, not on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
