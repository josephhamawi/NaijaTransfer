import { defineConfig } from "vitest/config";

/**
 * Separate config: these tests need the Firestore emulator (JDK 21+),
 * so they must not run as part of `npm test`.
 * Driven by `npm run test:rules`, which starts the emulator first.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["rules-tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
