// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { dispatchCompare } from "@/lib/compare/store";

import { CompareButton } from "./compare-button";

const college = (slug: string) => ({
  slug,
  name: `College ${slug}`,
  shortName: slug.toUpperCase(),
  city: "Pune",
});

function renderButtons(...slugs: string[]) {
  return render(
    <>
      {slugs.map((slug) => (
        <CompareButton key={slug} college={college(slug)} />
      ))}
    </>,
  );
}

const buttonFor = (slug: string) =>
  screen.getByRole("button", { name: new RegExp(`College ${slug}$`) });

beforeEach(() => {
  window.localStorage.clear();
  dispatchCompare({ type: "clear" });
});

afterEach(cleanup);

describe("CompareButton", () => {
  it("toggles a college into and out of the comparison", async () => {
    const user = userEvent.setup();
    renderButtons("a");

    const button = buttonFor("a");
    expect(button).toHaveAccessibleName(/^Compare/);
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await user.click(button);
    expect(buttonFor("a").getAttribute("aria-pressed")).toBe("true");
    expect(buttonFor("a")).toHaveAccessibleName(/^Comparing/);

    await user.click(buttonFor("a"));
    expect(buttonFor("a").getAttribute("aria-pressed")).toBe("false");
  });

  it("stops at three colleges and explains why the rest are unavailable", async () => {
    const user = userEvent.setup();
    renderButtons("a", "b", "c", "d");

    await user.click(buttonFor("a"));
    await user.click(buttonFor("b"));
    await user.click(buttonFor("c"));

    const fourth = buttonFor("d");
    expect(fourth).toBeDisabled();
    expect(fourth.getAttribute("title")).toBe("You can compare up to 3 colleges");

    await user.click(fourth);
    expect(buttonFor("d").getAttribute("aria-pressed")).toBe("false");

    // Freeing a slot makes the fourth college selectable again.
    await user.click(buttonFor("a"));
    expect(buttonFor("d")).toBeEnabled();
  });

  it("remembers the selection for the next visit", async () => {
    const user = userEvent.setup();
    renderButtons("a");
    await user.click(buttonFor("a"));

    expect(JSON.parse(window.localStorage.getItem("collegecompass:compare") ?? "[]")).toEqual([
      college("a"),
    ]);
  });

  it("shows a college already in the selection as selected on first render", () => {
    dispatchCompare({ type: "add", item: college("a") });
    renderButtons("a");
    expect(buttonFor("a").getAttribute("aria-pressed")).toBe("true");
  });
});
