/**
 * Live Send limits and receiving-browser capability detection.
 *
 * Centralised because the sender, the receiver and the UI must agree on
 * them: the sender refuses oversized transfers before a byte moves, the
 * receiver refuses them again on arrival, and the UI explains the cap
 * before the user picks files.
 */

import type { SaveMethod } from "./protocol";

/**
 * Per-file and per-transfer caps for the streaming path.
 *
 * With the File System Access API the receiver writes straight to disk,
 * so memory is not the constraint — patience is. These caps exist to
 * keep the "both of you stay on this page" promise realistic rather
 * than to protect the browser.
 */
export const STREAM_MAX_FILE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB
export const STREAM_MAX_TOTAL_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB

/**
 * Caps for the Blob fallback — the real constraint in this feature.
 *
 * Browsers without the File System Access API (Firefox and Safari as of
 * this writing) cannot stream to disk, so received chunks have to be
 * held as Blob parts until the file is complete. Blob parts are backed
 * by the browser's own storage and may spill to disk, but that is an
 * implementation detail no spec guarantees, and a mobile Safari tab
 * holding 2 GB of Blob will be killed.
 *
 * 512 MB per file and 1 GB per transfer is conservative on purpose. The
 * sender enforces it BEFORE sending, so a user never watches 900 MB
 * arrive and then fail.
 */
export const FALLBACK_MAX_FILE_BYTES = 512 * 1024 * 1024; // 512 MB
export const FALLBACK_MAX_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GB

/** Files per Live Send session. */
export const MAX_FILES_PER_SESSION = 100;

export interface ReceiveCapability {
  saveMethod: SaveMethod;
  maxFileBytes: number;
  maxTotalBytes: number;
  /** Shown to the user when the fallback is in play. */
  limitation: string | null;
}

interface CapabilityWindow {
  showDirectoryPicker?: unknown;
  isSecureContext?: boolean;
}

/**
 * What the *receiving* browser can actually do.
 *
 * `showDirectoryPicker` is the gate: it is the only widely-shipped way
 * to obtain a writable handle and stream chunks to disk without holding
 * the file in memory. It needs a secure context and a user gesture, so
 * availability is checked here and the gesture is taken in the UI.
 */
export function detectReceiveCapability(win: unknown = globalThis): ReceiveCapability {
  const w = (win ?? {}) as CapabilityWindow;
  const canStream =
    typeof w.showDirectoryPicker === "function" && w.isSecureContext !== false;

  if (canStream) {
    return {
      saveMethod: "stream",
      maxFileBytes: STREAM_MAX_FILE_BYTES,
      maxTotalBytes: STREAM_MAX_TOTAL_BYTES,
      limitation: null,
    };
  }

  return {
    saveMethod: "blob",
    maxFileBytes: FALLBACK_MAX_FILE_BYTES,
    maxTotalBytes: FALLBACK_MAX_TOTAL_BYTES,
    limitation:
      "This browser cannot save files to disk as they arrive, so Live Send holds them in memory until each file finishes. That caps a transfer at 1 GB (512 MB per file). Chrome or Edge on desktop removes the cap, or use a paid Stored Transfer.",
  };
}

/**
 * The ceiling the SENDER checks against.
 *
 * The sender cannot know the receiving browser's limits until that
 * browser connects, and guessing from its own would be wrong in both
 * directions: a Firefox sender would refuse a 5 GB transfer that a
 * Chrome recipient could take, and a Chrome sender would happily start
 * one a Safari recipient cannot finish.
 *
 * So the sender checks only the absolute ceiling, and the receiver does
 * the authoritative check when the manifest arrives — it is the one
 * that knows. A rejection there surfaces as a clear message rather than
 * a failed transfer, which is why the UI warns about the 1 GB fallback
 * before the user picks files.
 */
export function senderSideCapability(): ReceiveCapability {
  return {
    saveMethod: "stream",
    maxFileBytes: STREAM_MAX_FILE_BYTES,
    maxTotalBytes: STREAM_MAX_TOTAL_BYTES,
    limitation: null,
  };
}

export interface SizeCheck {
  ok: boolean
  code?: "FILE_TOO_LARGE" | "TRANSFER_TOO_LARGE" | "TOO_MANY_FILES";
  message?: string;
}

function gb(bytes: number): string {
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(bytes % 1024 ** 3 === 0 ? 0 : 1)} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`;
}

/**
 * Check a selection against a capability. Used by the sender before
 * sending and by the receiver on manifest arrival — same rules, both
 * sides, so a mismatch is impossible.
 */
export function checkTransferSize(
  files: Array<{ size: number }>,
  capability: ReceiveCapability
): SizeCheck {
  if (files.length === 0) return { ok: true };
  if (files.length > MAX_FILES_PER_SESSION) {
    return {
      ok: false,
      code: "TOO_MANY_FILES",
      message: `Live Send carries up to ${MAX_FILES_PER_SESSION} files per session.`,
    };
  }

  const oversize = files.find((f) => f.size > capability.maxFileBytes);
  if (oversize) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `One file is over the ${gb(capability.maxFileBytes)} per-file limit for the receiving browser.`,
    };
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > capability.maxTotalBytes) {
    return {
      ok: false,
      code: "TRANSFER_TOO_LARGE",
      message: `This selection is ${gb(total)}, over the ${gb(capability.maxTotalBytes)} limit for the receiving browser.`,
    };
  }

  return { ok: true };
}
