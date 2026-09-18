// Adds DOM matchers (toBeDisabled, toHaveAccessibleName, …) to expect.
// Loaded only for tests that run in a DOM environment: registering them makes
// every expect() call slower, which matters in tests that assert thousands of
// times over generated data.
export {};

if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
}
