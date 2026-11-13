import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Service tests against the Firestore emulator (JDK 21+ required), so
 * they are excluded from `npm test` and driven by `npm run test:emulator`.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["emulator-tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "../src") },
  },
});
