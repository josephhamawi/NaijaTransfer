"use client";

import { useEffect, useRef } from "react";

/**
 * Keep the screen awake while a Live Send transfer is running.
 *
 * Best-effort by design: the Screen Wake Lock API is Chromium-only, the
 * lock is released by the OS whenever the tab is hidden, and nothing it
 * does prevents the user locking the phone by hand. It reduces the most
 * common cause of a failed mobile transfer — the screen dimming out —
 * without being relied on, which is why the UI also warns the user.
 */
export function useWakeLock(active: boolean): void {
  const sentinel = useRef<{ release(): Promise<void>; released?: boolean } | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> };
    };
    if (!nav.wakeLock) return;

    const acquire = async () => {
      try {
        const lock = await nav.wakeLock!.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel.current = lock;
      } catch {
        // Denied, or the document isn't visible. Not worth surfacing.
      }
    };

    void acquire();

    // The OS drops the lock when the tab goes to the background. Retake
    // it on return so a user who switched apps mid-transfer is covered
    // again for the rest of it.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel.current) void acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      const lock = sentinel.current;
      sentinel.current = null;
      if (lock) void lock.release().catch(() => {});
    };
  }, [active]);
}

/**
 * Warn before leaving the page while a transfer is live.
 *
 * Live Send has no server-side state to resume from: closing the tab
 * ends the WebRTC connection and the transfer with it. The browser
 * shows its own generic wording — `returnValue` is required for the
 * prompt to appear at all, but its text is ignored.
 */
export function useUnloadWarning(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}

/**
 * Run `cleanup` when the page is being torn down for real.
 *
 * `pagehide` fires in cases `beforeunload` does not, notably iOS Safari
 * and page-cache navigations. Used to close the signalling room so an
 * abandoned session does not wait for the scheduled sweep.
 */
export function useTeardownOnLeave(cleanup: () => void): void {
  const ref = useRef(cleanup);
  ref.current = cleanup;

  useEffect(() => {
    const handler = () => ref.current();
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("pagehide", handler);
      ref.current();
    };
  }, []);
}
