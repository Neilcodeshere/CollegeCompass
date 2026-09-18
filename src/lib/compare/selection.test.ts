import { describe, expect, it } from "vitest";

import {
  compareReducer,
  EMPTY_SELECTION,
  isFull,
  isSelected,
  parseStoredSelection,
  selectedSlugs,
  type CompareItem,
  type CompareState,
} from "./selection";

const college = (slug: string): CompareItem => ({
  slug,
  name: `College ${slug}`,
  shortName: slug.toUpperCase(),
  city: "Pune",
});

const withItems = (...slugs: string[]): CompareState =>
  compareReducer(EMPTY_SELECTION, { type: "replace", items: slugs.map(college) });

describe("compareReducer", () => {
  it("adds colleges in the order they were chosen", () => {
    let state = compareReducer(EMPTY_SELECTION, { type: "add", item: college("a") });
    state = compareReducer(state, { type: "add", item: college("b") });
    expect(selectedSlugs(state)).toEqual(["a", "b"]);
  });

  it("never adds the same college twice", () => {
    const state = withItems("a");
    const next = compareReducer(state, { type: "add", item: college("a") });
    expect(selectedSlugs(next)).toEqual(["a"]);
    expect(next).toBe(state); // unchanged, so no re-render
  });

  it("stops at three colleges", () => {
    const full = withItems("a", "b", "c");
    expect(isFull(full)).toBe(true);
    const next = compareReducer(full, { type: "add", item: college("d") });
    expect(selectedSlugs(next)).toEqual(["a", "b", "c"]);
  });

  it("toggles a college off when it is already selected", () => {
    const state = withItems("a", "b");
    const next = compareReducer(state, { type: "toggle", item: college("a") });
    expect(selectedSlugs(next)).toEqual(["b"]);
  });

  it("toggles a college on when there is room", () => {
    const next = compareReducer(withItems("a"), { type: "toggle", item: college("b") });
    expect(selectedSlugs(next)).toEqual(["a", "b"]);
  });

  it("toggling a fourth college changes nothing", () => {
    const full = withItems("a", "b", "c");
    expect(compareReducer(full, { type: "toggle", item: college("d") })).toBe(full);
  });

  it("removes a college and ignores unknown ones", () => {
    const state = withItems("a", "b");
    expect(selectedSlugs(compareReducer(state, { type: "remove", slug: "a" }))).toEqual(["b"]);
    expect(compareReducer(state, { type: "remove", slug: "zzz" })).toBe(state);
  });

  it("clears everything", () => {
    expect(compareReducer(withItems("a", "b"), { type: "clear" })).toEqual(EMPTY_SELECTION);
  });

  it("applies the limit and removes duplicates when replacing", () => {
    const next = compareReducer(EMPTY_SELECTION, {
      type: "replace",
      items: [college("a"), college("a"), college("b"), college("c"), college("d")],
    });
    expect(selectedSlugs(next)).toEqual(["a", "b", "c"]);
  });
});

describe("isSelected", () => {
  it("reports membership by slug", () => {
    const state = withItems("a");
    expect(isSelected(state, "a")).toBe(true);
    expect(isSelected(state, "b")).toBe(false);
  });
});

describe("parseStoredSelection", () => {
  it("restores a valid saved selection", () => {
    const stored = JSON.stringify([college("a"), college("b")]);
    expect(selectedSlugs(parseStoredSelection(stored))).toEqual(["a", "b"]);
  });

  it("ignores missing, malformed or tampered storage", () => {
    expect(parseStoredSelection(null)).toEqual(EMPTY_SELECTION);
    expect(parseStoredSelection("not json")).toEqual(EMPTY_SELECTION);
    expect(parseStoredSelection('{"items":[]}')).toEqual(EMPTY_SELECTION);
    expect(parseStoredSelection('[{"slug":"Bad Slug","name":"x"}]')).toEqual(EMPTY_SELECTION);
  });

  it("applies the three-college limit to stored data", () => {
    const stored = JSON.stringify(["a", "b", "c", "d"].map(college));
    expect(selectedSlugs(parseStoredSelection(stored))).toEqual(["a", "b", "c"]);
  });
});
