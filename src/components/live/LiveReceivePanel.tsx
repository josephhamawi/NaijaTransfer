"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import { ensureAppCheck, ensureSignedIn, liveAuthHeaders } from "@/lib/firebase";
import { openRecipientSession, type LiveSession } from "@/lib/live/session";
import { LiveReceiver } from "@/lib/live/receiver";
import type { Manifest } from "@/lib/live/protocol";
import type { ReceiveCapability } from "@/lib/live/limits";
import {
  BlobSaveTarget,
  DirectorySaveTarget,
  pickDirectory,
  triggerBlobDownload,
  type SavedBlob,
} from "@/lib/live/saver";
import { useUnloadWarning, useWakeLock } from "@/hooks/useLiveGuards";

type Stage =
  | "joining"
  | "connecting"
  | "review"
  | "receiving"
  | "complete"
  | "failed"
  | "invalid";

interface Props {
  roomId: string;
}

/**
 * Live Send — recipient side.
 *
 * Joins with the secret from the URL fragment, connects peer-to-peer,
 * shows what is being offered, and only then writes anything to disk.
 * The user is asked twice before bytes move: once to accept the file
 * list, once (implicitly) by choosing where to save.
 */
export default function LiveReceivePanel({ roomId }: Props) {
  const [stage, setStage] = useState<Stage>("joining");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [capability, setCapability] = useState<ReceiveCapability | null>(null);
  const [savedFiles, setSavedFiles] = useState<SavedBlob[]>([]);
  const [progress, setProgress] = useState({ bytes: 0, percent: 0, speed: 0, eta: 0 });

  const progressRef = useRef({ bytes: 0, total: 0 });
  const speedRef = useRef({ time: 0, bytes: 0, smoothed: 0 });
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const receiverRef = useRef<LiveReceiver | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAt = useRef<number | null>(null);

  const transferLive = stage === "receiving";
  useWakeLock(transferLive);
  useUnloadWarning(transferLive);

  const stopFlush = useCallback(() => {
    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  const startFlush = useCallback(
    (total: number) => {
      progressRef.current = { bytes: 0, total };
      speedRef.current = { time: Date.now(), bytes: 0, smoothed: 0 };
      stopFlush();
      flushTimer.current = setInterval(() => {
        const { bytes } = progressRef.current;
        const now = Date.now();
        const dt = (now - speedRef.current.time) / 1000;
        let smoothed = speedRef.current.smoothed;
        if (dt >= 0.5) {
          const instant = (bytes - speedRef.current.bytes) / dt;
          smoothed = smoothed === 0 ? instant : smoothed * 0.7 + instant * 0.3;
          speedRef.current = { time: now, bytes, smoothed };
        }
        setProgress({
          bytes,
          percent: total > 0 ? Math.min(100, (bytes / total) * 100) : 0,
          speed: smoothed,
          eta: smoothed > 0 ? Math.max(0, (total - bytes) / smoothed) : 0,
        });
      }, 250);
    },
    [stopFlush]
  );

  const teardown = useCallback(() => {
    stopFlush();
    abortRef.current?.abort();
    abortRef.current = null;
    receiverRef.current?.detach();
    receiverRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
  }, [stopFlush]);

  useEffect(() => {
    const onPageHide = () => teardown();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      teardown();
    };
  }, [teardown]);

  // ── Join + connect ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const join = async () => {
      // The secret lives in the fragment, which the browser never sends
      // to a server. Read it, then strip it from the address bar so a
      // screenshot or a shared tab does not leak a live invitation.
      const secret = window.location.hash.replace(/^#/, "");
      if (!secret) {
        setErrorCode("INVALID_INVITE");
        setErrorMsg("This link is missing its invitation code. Ask the sender to resend it.");
        setStage("invalid");
        return;
      }
      history.replaceState(null, "", window.location.pathname);

      try {
        await ensureAppCheck();
        await ensureSignedIn();

        const headers = await liveAuthHeaders();
        const res = await fetch(`/api/live/rooms/${encodeURIComponent(roomId)}/claim`, {
          method: "POST",
          headers,
          body: JSON.stringify({ secret }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorCode(json?.error?.code ?? "INVALID_INVITE");
          setErrorMsg(json?.error?.message ?? "This invitation link is not valid.");
          setStage("invalid");
          return;
        }
        if (cancelled) return;

        setStage("connecting");
        abortRef.current = new AbortController();
        const session = await openRecipientSession({
          roomId,
          signal: abortRef.current.signal,
          callbacks: { onState: () => {} },
        });
        if (cancelled) {
          session.close();
          return;
        }
        sessionRef.current = session;

        const receiver = new LiveReceiver(session.channel, {
          maxMessageSize: session.pc.sctp?.maxMessageSize,
          callbacks: {
            onManifest: (m, cap) => {
              setManifest(m);
              setCapability(cap);
              setStage("review");
            },
            onProgress: (p) => {
              progressRef.current = { bytes: p.bytesReceived, total: p.totalBytes };
            },
            onPhase: (phase, detail) => {
              if (phase === "complete") {
                stopFlush();
                setProgress((prev) => ({ ...prev, percent: 100 }));
                setStage("complete");
              } else if (phase === "cancelled") {
                stopFlush();
                setErrorCode("CANCELLED");
                setErrorMsg(detail || "The sender cancelled the transfer.");
                setStage("failed");
              }
            },
            onError: (code, message) => {
              stopFlush();
              setErrorCode(code);
              setErrorMsg(message);
              setStage("failed");
            },
            onCancelledByPeer: (reason) => {
              stopFlush();
              setErrorCode("CANCELLED");
              setErrorMsg(reason || "The sender cancelled the transfer.");
              setStage("failed");
            },
          },
        });
        receiverRef.current = receiver;
      } catch (err) {
        if (cancelled) return;
        setErrorCode("CONNECT_FAILED");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Could not connect to the sender. Ask them to restart the transfer."
        );
        setStage("failed");
      }
    };

    void join();
    return () => {
      cancelled = true;
    };
  }, [roomId, stopFlush]);

  // ── Accept ─────────────────────────────────────────────────────────

  /**
   * Accept and start receiving.
   *
   * Runs inside the click handler on purpose: `showDirectoryPicker()`
   * only resolves when called from a user gesture, so the folder prompt
   * cannot be moved into an effect or behind an await of our own.
   */
  const accept = useCallback(async () => {
    const receiver = receiverRef.current;
    if (!receiver || !manifest || !capability) return;

    if (capability.saveMethod === "stream") {
      const dir = await pickDirectory();
      if (!dir) return; // dismissed — stay on the review screen
      const target = new DirectorySaveTarget(dir);
      if (!(await target.ensurePermission())) {
        setErrorCode("PERMISSION_DENIED");
        setErrorMsg("Write permission for that folder was declined. Pick another folder.");
        return;
      }
      startedAt.current = Date.now();
      startFlush(manifest.totalBytes);
      setStage("receiving");
      receiver.accept(target);
      return;
    }

    const target = new BlobSaveTarget(capability.maxFileBytes, (file) => {
      setSavedFiles((prev) => [...prev, file]);
    });
    startedAt.current = Date.now();
    startFlush(manifest.totalBytes);
    setStage("receiving");
    receiver.accept(target);
  }, [manifest, capability, startFlush]);

  const decline = useCallback(() => {
    receiverRef.current?.reject("DECLINED", "The recipient declined the transfer.");
    teardown();
    setErrorCode("DECLINED");
    setErrorMsg("You declined this transfer.");
    setStage("failed");
  }, [teardown]);

  const cancel = useCallback(() => {
    receiverRef.current?.cancel("Recipient cancelled");
    teardown();
    setErrorCode("CANCELLED");
    setErrorMsg("You cancelled this transfer.");
    setStage("failed");
  }, [teardown]);

  // ── Render ─────────────────────────────────────────────────────────

  const invalidHeadline =
    errorCode === "ALREADY_CLAIMED"
      ? "This invitation was already used"
      : errorCode === "EXPIRED"
        ? "This invitation has expired"
        : errorCode === "CLOSED"
          ? "This transfer has ended"
          : "This invitation is not valid";

  return (
    <Card elevation="lg" padding="lg" className="w-full max-w-[520px] mx-auto" aria-live="polite">
      <div className="flex items-center gap-2 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-40.png" alt="" width={28} height={28} className="w-7 h-7" />
        <span className="text-h3 font-bold text-nigerian-green">NaijaTransfer</span>
      </div>

      {(stage === "joining" || stage === "connecting") && (
        <div className="space-y-3">
          <h1 className="text-h3 font-bold">
            {stage === "joining" ? "Opening invitation…" : "Connecting to the sender…"}
          </h1>
          <p className="text-body-sm text-[var(--text-secondary)]">
            Live Send moves files straight from the sender&apos;s browser to yours. You both
            need to stay on this page with the devices awake until it finishes.
          </p>
        </div>
      )}

      {stage === "invalid" && (
        <div className="space-y-3">
          <h1 className="text-h3 font-bold">{invalidHeadline}</h1>
          <p className="text-body-sm text-[var(--text-secondary)]">{errorMsg}</p>
          <p className="text-body-sm text-[var(--text-muted)]">
            Live Send invitations are single-use and valid for 15 minutes. Ask the sender for a
            fresh link.
          </p>
          <a href="/" className="contents">
            <Button variant="outline" fullWidth>
              Go to NaijaTransfer
            </Button>
          </a>
        </div>
      )}

      {stage === "review" && manifest && capability && (
        <div className="space-y-4">
          <div>
            <h1 className="text-h3 font-bold">Someone wants to send you files</h1>
            <p className="text-body-sm text-[var(--text-secondary)]">
              {manifest.files.length} file{manifest.files.length !== 1 ? "s" : ""} ·{" "}
              {formatBytes(manifest.totalBytes)}
            </p>
          </div>

          <ul className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto rounded-lg bg-[var(--bg-secondary)]">
            {manifest.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-body-sm truncate" title={f.name}>
                  {f.name}
                </span>
                <span className="text-body-sm text-[var(--text-muted)] shrink-0">
                  {formatBytes(f.size)}
                </span>
              </li>
            ))}
          </ul>

          {capability.limitation && (
            <p className="text-body-sm text-[var(--text-secondary)] p-3 rounded-lg bg-[var(--bg-secondary)]">
              {capability.limitation}
            </p>
          )}

          <p className="text-body-sm text-[var(--text-muted)]">
            {capability.saveMethod === "stream"
              ? "You will be asked to choose a folder. Files are written there as they arrive."
              : "Files are held in this tab until each one finishes, then you can save them."}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" fullWidth onClick={decline}>
              Decline
            </Button>
            <Button variant="primary" fullWidth onClick={accept}>
              {capability.saveMethod === "stream" ? "Choose folder & accept" : "Accept"}
            </Button>
          </div>
        </div>
      )}

      {stage === "receiving" && manifest && (
        <div className="space-y-3">
          <h1 className="text-h3 font-bold">Receiving…</h1>
          <div className="flex items-center justify-between text-body-sm">
            <span>
              {formatBytes(progress.bytes)} of {formatBytes(manifest.totalBytes)}
            </span>
            <span>{progress.percent.toFixed(1)}%</span>
          </div>
          <div
            className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress.percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-nigerian-green rounded-full transition-[width] duration-200 ease-linear"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-body-sm text-[var(--text-secondary)]">
            <span>{progress.speed > 0 ? formatSpeed(progress.speed) : "Starting…"}</span>
            <span>{progress.eta > 0 ? `${formatDuration(progress.eta)} left` : ""}</span>
          </div>
          <p className="text-body-sm text-[var(--text-muted)]">
            Keep this page open and the screen on. Locking the phone or switching apps can
            interrupt the transfer.
          </p>
          <Button variant="outline" fullWidth onClick={cancel}>
            Cancel
          </Button>
        </div>
      )}

      {stage === "complete" && manifest && (
        <div className="space-y-3">
          <h1 className="text-h3 font-bold">All files received</h1>
          <p className="text-body-sm text-[var(--text-secondary)]">
            {manifest.files.length} file{manifest.files.length !== 1 ? "s" : ""} ·{" "}
            {formatBytes(manifest.totalBytes)}
            {startedAt.current && (
              <> · {formatDuration((Date.now() - startedAt.current) / 1000)}</>
            )}
          </p>

          {savedFiles.length > 0 ? (
            <>
              <p className="text-body-sm">
                Save each file to your device. They are held in this tab only — closing it
                loses them.
              </p>
              <ul className="space-y-2">
                {savedFiles.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-3">
                    <span className="text-body-sm truncate" title={f.name}>
                      {f.name}
                    </span>
                    <Button size="sm" variant="primary" onClick={() => triggerBlobDownload(f)}>
                      Save
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-body-sm">
              The files were written to the folder you picked.
            </p>
          )}

          <a href="/" className="contents">
            <Button variant="outline" fullWidth>
              Send files yourself
            </Button>
          </a>
        </div>
      )}

      {stage === "failed" && (
        <div className="space-y-3">
          <h1 className="text-h3 font-bold">
            {errorCode === "CANCELLED" || errorCode === "DECLINED"
              ? "Transfer stopped"
              : "Connection interrupted"}
          </h1>
          <div className="p-3 rounded-lg bg-[var(--error-bg)] text-error-red text-body-sm">
            {errorMsg || "The connection dropped. Ask the sender to restart the transfer."}
          </div>
          <p className="text-body-sm text-[var(--text-secondary)]">
            Live Send has no resume — ask the sender for a new link and start again. If it keeps
            failing, your two networks may not allow a direct connection; a stored transfer on a
            paid plan works on any network.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a href="/" className="contents">
              <Button variant="outline" fullWidth>
                Home
              </Button>
            </a>
            <a href="/pricing" className="contents">
              <Button variant="primary" fullWidth>
                See paid plans
              </Button>
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
