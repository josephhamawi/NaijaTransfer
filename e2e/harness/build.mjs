/**
 * Bundle the live-transfer modules for the browser harness.
 *
 * The harness cannot import TypeScript or the "@/..." alias directly,
 * so esbuild (already present via vitest) produces one IIFE with the
 * real sender, receiver, protocol and ICE code in it. No React, no
 * Firebase, no Next.js — those modules are deliberately independent of
 * all three, which is what makes this possible.
 */
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

await build({
  entryPoints: [path.join(here, "entry.ts")],
  bundle: true,
  format: "iife",
  target: "chrome120",
  outfile: path.join(here, "bundle.js"),
  sourcemap: false,
  logLevel: "info",
  alias: { "@": path.join(root, "src") },
  // Mirrors what Next.js does for NEXT_PUBLIC_* so the harness uses the
  // same STUN configuration the app would.
  define: {
    "process.env.NEXT_PUBLIC_LIVE_STUN_URLS": JSON.stringify(
      process.env.NEXT_PUBLIC_LIVE_STUN_URLS ?? ""
    ),
  },
});
