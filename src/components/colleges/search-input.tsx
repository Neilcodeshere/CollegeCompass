"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const DEBOUNCE_MS = 300;

/**
 * Typing updates local state immediately and the URL after a short pause, so
 * the field never feels laggy and one request is sent per phrase rather than
 * per keystroke.
 */
export function SearchInput({
  value,
  onSearchChange,
}: {
  value: string;
  onSearchChange: (search: string | undefined) => void;
}) {
  const [text, setText] = useState(value);
  const debouncedText = useDebouncedValue(text, DEBOUNCE_MS);
  // True only while the student's own keystrokes are waiting to be committed.
  // Without this, pressing Back would write the previous search term straight
  // back into the URL from the still-pending debounced value.
  const hasPendingInput = useRef(false);

  const changeText = (next: string) => {
    hasPendingInput.current = true;
    setText(next);
  };

  // Commit the settled text to the URL.
  useEffect(() => {
    if (!hasPendingInput.current) return;
    const trimmed = debouncedText.trim();
    if (trimmed === value) return;
    hasPendingInput.current = false;
    onSearchChange(trimmed || undefined);
  }, [debouncedText, value, onSearchChange]);

  // Follow changes that came from elsewhere: Back/Forward, or clearing filters.
  useEffect(() => {
    setText((current) => {
      if (current === value) return current;
      hasPendingInput.current = false;
      return value;
    });
  }, [value]);

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3 size-4 text-neutral-500"
        strokeWidth={1.75}
      />
      <Input
        type="text"
        value={text}
        onChange={(event) => changeText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") changeText("");
        }}
        aria-label="Search colleges"
        placeholder="Search by college, city or state"
        className="pr-10 pl-9"
        autoComplete="off"
      />
      {text ? (
        <button
          type="button"
          onClick={() => changeText("")}
          aria-label="Clear search"
          className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}
