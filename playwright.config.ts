import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright is used for one thing: the Live Send end-to-end test,
 * which needs two real browser contexts and a real WebRTC stack.
 *
 * Chromium only, deliberately. The test asserts behaviour of the
 * streaming save path (File System Access API) and reads
 * `RTCPeerConnection.sctp.maxMessageSize`; Firefox and WebKit differ on
 * both, and the fallback paths they use are covered by unit tests.
 * Cross-browser behaviour is documented rather than asserted here.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "list" : [["list"]],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
