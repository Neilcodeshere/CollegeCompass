import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "prisma/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    // Pure logic and route handlers run in Node. Component tests opt into a DOM
    // with a `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
  },
});
