"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { ensureAppCheck, ensureSignedIn, liveAuthHeaders } from "@/lib/firebase";
import { openSenderSession, type LiveSession } from "@/lib/live/session";
import { LiveSender, type SenderPhase } from "@/lib/live/sender";
import { checkTransferSize, senderSideCapability } from "@/lib/live/limits";
import { useUnloadWarning, useWakeLock } from "@/hooks/useLiveGuards";

export interface LiveSendFile {
  id: string;
  file: File;
  name: string;
}

type Stage =
  | "creating"
  | "waiting"
  | "connected"
  | "sending"
  | "complete"
  | "cancelled"
  | "failed";

interface Props {
  files: LiveSendFile[];
  onExit(): void;
}

/**
 * Live Send — sender side.
 *
 * Owns the whole session: open a signalling room, show the invitation,
 * connect peer-to-peer, then push the files. Nothing here uploads
 * anything: the only network calls to our own servers are the room
 * create and the room close, both a few hundred bytes.
 */
export default function LiveSendPanel({ files, onExit }: Props) {
  const toast = useToast();
  const [stage, setStage] = useState<Stage>("creating");
  const [inviteUrl, setInviteUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [joinExpiresAt, setJoinExpiresAt] = useState<Date | null>(null);
  const [detail, setDetail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [progress, setProgress] = useState({ bytes: 0, percent: 0, speed: 0, eta: 0 });
  const progressRef = useRef({ bytes: 0, total: 0 });
  const speedRef = useRef({ time: 0, bytes: 0, smoothed: 0 });
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const roomIdRef = useRef<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const senderRef = useRef<LiveSender | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAt = useRef<number | null>(null);

  const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  const transferLive = stage === "sending" || stage === "connected";

  useWakeLock(transferLive);
  useUnloadWarning(transferLive);

  // ── Teardown ───────────────────────────────────────────────────────

  const stopFlush = useCallback(() => {
    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  /**
   * Close the room on the server.
   *
   * `keepalive` matters: this runs from `pagehide` too, where a normal
   * fetch is cancelled as the document goes away.
   */
  const closeRoom = useCallback(async () => {
    const roomId = roomIdRef.current;
    roomIdRef.current = null;
    if (!roomId) return;
    try {
      const headers = await liveAuthHeaders();
      await fetch(`/api/live/rooms/${encodeURIComponent(roomId)}`, {
        method: "DELETE",
        headers,
        keepalive: true,
      });
    } catch {
      // The scheduled sweep deletes abandoned rooms; nothing to do here.
    }
  }, []);

  const teardown = useCallback(() => {
    stopFlush();
    abortRef.current?.abort();
    abortRef.current = null;
    senderRef.current?.detach();
    senderRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
  }, [stopFlush]);

  useEffect(() => {
    const onPageHide = () => {
      teardown();
      void closeRoom();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      onPageHide();
    };
  }, [teardown, closeRoom]);

  // ── Session ────────────────────────────────────────────────────────

  const startFlush = useCallback(() => {
    progressRef.current = { bytes: 0, total: totalBytes };
    speedRef.current = { time: Date.now(), bytes: 0, smoothed: 0 };
    stopFlush();
    // Same pattern as the stored-upload widget: progress lands in a ref
    // on every chunk and React is updated on a timer, so a fast link
    // does not spend its throughput on re-renders.
    flushTimer.current = setInterval(() => {
      const { bytes, total } = progressRef.current;
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
  }, [stopFlush, totalBytes]);

  const run = useCallback(async () => {
    setErrorMsg("");
    setStage("creating");

    // Only the absolute ceiling is checked here — the receiving browser
    // is the one that knows its real limit, and it re-checks the
    // manifest on arrival. A rejection there lands in onRejected with a
    // message the user can act on.
    const localCheck = checkTransferSize(
      files.map((f) => ({ size: f.file.size })),
      senderSideCapability()
    );
    if (!localCheck.ok) {
      setErrorMsg(localCheck.message!);
      setStage("failed");
      return;
    }

    try {
      await ensureAppCheck();
      await ensureSignedIn();

      const headers = await liveAuthHeaders();
      const res = await fetch("/api/live/rooms", { method: "POST", headers });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error?.message || "Could not start a Live Send session.");
        setStage("failed");
        return;
      }

      const { roomId, inviteSecret, joinExpiresAt: expiry } = json.data;
      roomIdRef.current = roomId;
      setJoinExpiresAt(new Date(expiry));

      // The secret rides in the fragment so it never reaches a server
      // log, a Referer header or any proxy in between.
      const url = `${window.location.origin}/live/${roomId}#${inviteSecret}`;
      setInviteUrl(url);
      setStage("waiting");

      // QR uses the already-bundled `qrcode` dependency. Failure is
      // cosmetic — the link itself still works.
      void import("qrcode")
        .then((qr) => qr.toDataURL(url, { width: 220, margin: 1 }))
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));

      abortRef.current = new AbortController();
      const session = await openSenderSession({
        roomId,
        signal: abortRef.current.signal,
        callbacks: {
          onState: (state, stateDetail) => {
            if (state === "connecting") setDetail("Recipient found. Connecting…");
            else if (state === "connected") setDetail("Connected");
            else if (state === "failed") setDetail(stateDetail ?? "");
          },
        },
      });
      sessionRef.current = session;
      setStage("connected");
      setDetail("Waiting for the recipient to accept…");

      const sender = new LiveSender(
        session.channel,
        files.map((f) => ({ id: f.id, file: f.file, name: f.name })),
        {
          maxMessageSize: session.pc.sctp?.maxMessageSize,
          callbacks: {
            onPhase: (phase: SenderPhase, phaseDetail) => {
              if (phase === "sending") {
                if (startedAt.current === null) startedAt.current = Date.now();
                setStage("sending");
                setDetail("");
                startFlush();
              } else if (phase === "complete") {
                stopFlush();
                setStage("complete");
              } else if (phase === "cancelled") {
                stopFlush();
                setStage("cancelled");
                setDetail(phaseDetail ?? "");
              }
            },
            onProgress: (p) => {
              progressRef.current = { bytes: p.bytesSent, total: p.totalBytes };
            },
            onRejected: (_code, message) => {
              stopFlush();
              setErrorMsg(message);
              setStage("failed");
            },
            onError: (_code, message) => {
              stopFlush();
              setErrorMsg(message);
              setStage("failed");
            },
          },
        }
      );
      senderRef.current = sender;

      await sender.run();
      setProgress((p) => ({ ...p, bytes: totalBytes, percent: 100 }));
      toast.success("Files delivered", "The recipient has saved every file.");
    } catch (err) {
      stopFlush();
      if (stage !== "cancelled") {
        const message =
          err instanceof Error
            ? err.message
            : "The connection failed. Restart the transfer to try again.";
        setErrorMsg(message);
        setStage((prev) => (prev === "cancelled" ? prev : "failed"));
      }
    } finally {
      // Whatever happened, the room has served its purpose.
      await closeRoom();
    }
    // `stage` is read inside only to avoid clobbering a cancel; it must
    // not re-trigger the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, startFlush, stopFlush, toast, closeRoom, totalBytes]);

  useEffect(() => {
    void run();
    // Run once per mount: a new session means a new panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = useCallback(() => {
    senderRef.current?.cancel("Sender cancelled the transfer");
    teardown();
    void closeRoom();
    setStage("cancelled");
  }, [teardown, closeRoom]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.warning("Copy failed", "Select the link and copy it manually.");
    }
  }, [inviteUrl, toast]);

  // ── Render ─────────────────────────────────────────────────────────

  const minutesLeft = joinExpiresAt
    ? Math.max(0, Math.round((joinExpiresAt.getTime() - Date.now()) / 60000))
    : null;

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <h3 className="text-h3 font-bold">Live Send</h3>
        <span className="text-body-sm text-[var(--text-secondary)]">
          {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalBytes)}
        </span>
      </div>

      {stage === "creating" && (
        <p className="text-body-sm text-[var(--text-secondary)]">Creating your invitation…</p>
      )}

      {stage === "waiting" && (
        <>
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
            <p className="text-body-sm font-medium mb-1">Send this link to the recipient</p>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Keep this page open. Files move directly between the two browsers, so you both
              need to stay online until it finishes.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg">
            <input
              readOnly
              value={inviteUrl}
              aria-label="Live Send invitation link"
              className="flex-1 bg-transparent text-body-sm truncate outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="primary" size="sm" onClick={copyLink}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {qrDataUrl && (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code for the Live Send invitation link"
                width={220}
                height={220}
                className="rounded-lg bg-white p-2"
              />
              <span className="text-body-sm text-[var(--text-muted)]">
                Or scan with the other device
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-body-sm text-[var(--text-secondary)]">
            <span>Waiting for the recipient to open the link…</span>
            {minutesLeft !== null && <span>Link valid {minutesLeft} min</span>}
          </div>

          <Button variant="outline" fullWidth onClick={cancel}>
            Cancel
          </Button>
        </>
      )}

      {stage === "connected" && (
        <>
          <p className="text-body-sm">{detail || "Recipient connected."}</p>
          <p className="text-body-sm text-[var(--text-secondary)]">
            They are reviewing the file list. Sending starts when they accept.
          </p>
          <Button variant="outline" fullWidth onClick={cancel}>
            Cancel
          </Button>
        </>
      )}

      {stage === "sending" && (
        <>
          <div className="flex items-center justify-between text-body-sm mb-2">
            <span>
              {formatBytes(progress.bytes)} of {formatBytes(totalBytes)}
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
          <div className="flex items-center justify-between text-body-sm text-[var(--text-secondary)] mt-2">
            <span>{progress.speed > 0 ? formatSpeed(progress.speed) : "Starting…"}</span>
            <span>{progress.eta > 0 ? `${formatDuration(progress.eta)} left` : ""}</span>
          </div>
          <p className="text-body-sm text-[var(--text-muted)] mt-2">
            Keep both devices awake and on this page. Locking a phone or switching apps can
            interrupt the transfer.
          </p>
          <Button variant="outline" fullWidth onClick={cancel} className="mt-3">
            Cancel transfer
          </Button>
        </>
      )}

      {stage === "complete" && (
        <>
          <div className="p-3 rounded-lg bg-nigerian-green/10 text-body-sm">
            Delivered. {files.length} file{files.length !== 1 ? "s" : ""} ·{" "}
            {formatBytes(totalBytes)}
            {startedAt.current && (
              <> · {formatDuration((Date.now() - startedAt.current) / 1000)}</>
            )}
          </div>
          <p className="text-body-sm text-[var(--text-secondary)]">
            Nothing was stored. The files went straight from this browser to theirs, so there
            is no link to expire.
          </p>
          <Button variant="primary" fullWidth onClick={onExit}>
            Send something else
          </Button>
        </>
      )}

      {stage === "cancelled" && (
        <>
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-body-sm">
            Transfer cancelled.{detail ? ` ${detail}` : ""}
          </div>
          <Button variant="primary" fullWidth onClick={onExit}>
            Start over
          </Button>
        </>
      )}

      {stage === "failed" && (
        <>
          <div className="p-3 rounded-lg bg-[var(--error-bg)] text-error-red text-body-sm">
            {errorMsg || "Connection interrupted — restart the transfer."}
          </div>
          <p className="text-body-sm text-[var(--text-secondary)]">
            Live Send needs a direct path between the two networks. Some mobile and office
            networks block that. A stored transfer on a paid plan uploads once and works on any
            network.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" fullWidth onClick={onExit}>
              Start over
            </Button>
            <a href="/pricing" className="contents">
              <Button variant="primary" fullWidth>
                See paid plans
              </Button>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
