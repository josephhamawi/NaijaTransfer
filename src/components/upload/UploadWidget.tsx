"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import {
  canCreateStoredTransfer,
  getTierLimits,
  STORED_TRANSFER_UPGRADE_MESSAGE,
} from "@/lib/tier-limits";
import {
  MAX_FILES_PER_SESSION,
  senderSideCapability,
  FALLBACK_MAX_TOTAL_BYTES,
} from "@/lib/live/limits";
import LiveSendPanel from "@/components/live/LiveSendPanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import UploadZone, {
  type SelectedFile,
  type FileWithPath,
} from "@/components/upload/UploadZone";
import TransferSettings, {
  type TransferSettingsValues,
} from "@/components/upload/TransferSettings";
import BandwidthEstimator from "@/components/upload/BandwidthEstimator";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { runUpload, type StoredSession } from "@/lib/upload-client";
import { authFetch } from "@/lib/api-client";

let fileIdCounter = 0;

type UploadState = "idle" | "uploading" | "success" | "error";

/**
 * Which kind of transfer the user is making.
 *
 * "live"   — WebRTC browser-to-browser. Free, nothing stored.
 * "stored" — upload to Firebase Storage, download later. Paid plans.
 */
type TransferMode = "live" | "stored";

/**
 * Interactive upload widget — the only client-rendered piece of the
 * homepage. Pulled out of page.tsx so the marketing chrome can be
 * server-rendered (smaller JS bundle, faster LCP).
 */
export default function UploadWidget() {
  const toast = useToast();
  const { user, tier } = useAuth();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [settings, setSettings] = useState<TransferSettingsValues>({
    expiryDays: 7,
    downloadLimit: 50,
    password: "",
    message: "",
  });
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [mode, setMode] = useState<TransferMode>("live");
  const [liveActive, setLiveActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [transferResult, setTransferResult] = useState<{ shortCode: string; downloadUrl: string; durationSeconds: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const activeXhrs = useRef<Set<XMLHttpRequest>>(new Set());
  const uploadAbortController = useRef<AbortController | null>(null);
  const cancelRequested = useRef(false);
  const transferStartTime = useRef<number | null>(null);
  /** Survives a failed attempt so "Try again" resumes instead of restarting. */
  const resumeSessions = useRef<Map<string, StoredSession>>(new Map());
  const activeTransfer = useRef<{
    transferId: string;
    shortCode: string;
  } | null>(null);

  // Progress lands in refs on every XHR event and is flushed to React
  // state on a timer. With eight parts in flight the browser emits
  // progress events far faster than the UI can usefully repaint, and a
  // setState per event was re-rendering the whole card dozens of times
  // a second — work that competes with the upload itself.
  const progressRef = useRef({ bytes: 0, total: 0 });
  const speedRef = useRef({ time: 0, bytes: 0, smoothed: 0 });
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgressFlush = useCallback(() => {
    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  const startProgressFlush = useCallback(
    (totalBytes: number) => {
      progressRef.current = { bytes: 0, total: totalBytes };
      speedRef.current = { time: Date.now(), bytes: 0, smoothed: 0 };
      stopProgressFlush();
      flushTimer.current = setInterval(() => {
        const { bytes, total } = progressRef.current;
        setBytesUploaded(bytes);
        setUploadProgress(total > 0 ? Math.min(100, (bytes / total) * 100) : 0);

        const now = Date.now();
        const dt = (now - speedRef.current.time) / 1000;
        if (dt >= 0.5) {
          const instant = (bytes - speedRef.current.bytes) / dt;
          const smoothed =
            speedRef.current.smoothed === 0
              ? instant
              : speedRef.current.smoothed * 0.7 + instant * 0.3;
          speedRef.current = { time: now, bytes, smoothed };
          setUploadSpeed(smoothed);
          setEtaSeconds(
            smoothed > 0 ? Math.max(0, (total - bytes) / smoothed) : null
          );
        }
      }, 250);
    },
    [stopProgressFlush]
  );

  useEffect(() => stopProgressFlush, [stopProgressFlush]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleTransfer = useCallback(async () => {
    if (files.length === 0) return;
    setUploadState("uploading");
    setUploadProgress(0);
    setBytesUploaded(0);
    setUploadSpeed(0);
    setEtaSeconds(null);
    setIsFinalizing(false);
    setErrorMsg("");

    cancelRequested.current = false;
    activeXhrs.current.clear();
    uploadAbortController.current = new AbortController();
    const abortSignal = uploadAbortController.current.signal;

    if (transferStartTime.current === null) {
      transferStartTime.current = Date.now();
    }

    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    startProgressFlush(totalBytes);

    try {
      const recipientEmails = emailTo
        ? emailTo.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined;

      // Reuse the transfer only when there are live sessions to resume
      // against it; re-initialising files on a transfer that already
      // reserved quota for them would double-count against the cap.
      let transfer = activeTransfer.current;
      if (!transfer || resumeSessions.current.size === 0) {
        resumeSessions.current.clear();
        // authFetch attaches the Firebase ID token. The server reads
        // identity and plan from that token only — it used to trust a
        // `uid` in this body, which would now be a way to borrow
        // someone else's storage entitlement.
        const res = await authFetch("/api/upload/create", {
          method: "POST",
          body: JSON.stringify({
            senderEmail: emailFrom || undefined,
            recipientEmails,
            message: settings.message || undefined,
            password: settings.password || undefined,
            expiryDays: settings.expiryDays,
            downloadLimit: settings.downloadLimit,
          }),
          signal: abortSignal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || "Failed to create transfer");
        }

        const { data } = await res.json();
        transfer = {
          transferId: data.transferId as string,
          shortCode: data.shortCode as string,
        };
        activeTransfer.current = transfer;
      }

      await runUpload({
        transferId: transfer.transferId,
        targets: files.map((f) => ({
          key: `${f.relativePath}:${f.file.size}:${f.file.lastModified}`,
          file: f.file,
          relativePath: f.relativePath,
        })),
        signal: abortSignal,
        isCancelled: () => cancelRequested.current,
        trackXhr: (xhr) => activeXhrs.current.add(xhr),
        untrackXhr: (xhr) => activeXhrs.current.delete(xhr),
        onProgress: (bytes) => {
          progressRef.current.bytes = bytes;
        },
        onFinalizing: setIsFinalizing,
        sessions: resumeSessions.current,
      });

      stopProgressFlush();
      setBytesUploaded(totalBytes);
      setUploadProgress(100);

      if (recipientEmails && recipientEmails.length > 0) {
        try {
          const notifyRes = await fetch(
            `/api/transfer/${transfer.shortCode}/notify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipientEmails,
                senderName: emailFrom || undefined,
              }),
            }
          );
          if (notifyRes.ok) {
            toast.success(
              "Email sent!",
              `Download link sent to ${recipientEmails.join(", ")}`
            );
          } else {
            toast.warning(
              "Transfer ready",
              "Files uploaded but email delivery failed. Share the link manually."
            );
          }
        } catch {
          toast.warning(
            "Transfer ready",
            "Files uploaded but email could not be sent. Share the link manually."
          );
        }
      } else {
        toast.success("Transfer complete!", "Your files are ready to share.");
      }

      const durationSeconds = transferStartTime.current
        ? (Date.now() - transferStartTime.current) / 1000
        : 0;
      transferStartTime.current = null;
      activeTransfer.current = null;
      setTransferResult({
        shortCode: transfer.shortCode,
        downloadUrl: `${window.location.origin}/d/${transfer.shortCode}`,
        durationSeconds,
      });
      setUploadState("success");
    } catch (err) {
      stopProgressFlush();
      if (cancelRequested.current) {
        return;
      }

      const raw = err instanceof Error ? err.message : "Unknown error";
      const hasResume = resumeSessions.current.size > 0;
      const resumeHint = hasResume
        ? " Click Try again to resume from where you left off."
        : "";
      let friendly = "Something went wrong. Please try again." + resumeHint;
      if (raw.includes("DAILY_LIMIT"))
        friendly =
          "You've reached your daily transfer limit. Try again tomorrow or upgrade to Pro.";
      else if (raw.includes("too large") || raw.includes("size"))
        friendly = "File is too large for your plan. Upgrade for bigger transfers.";
      else if (raw.includes("network") || raw.includes("fetch"))
        friendly = "Connection lost. Check your internet and try again." + resumeHint;

      toast.error("Upload failed", friendly);
      setErrorMsg(friendly);
      setUploadState("error");
    }
  }, [
    files,
    emailTo,
    emailFrom,
    settings,
    toast,
    user,
    startProgressFlush,
    stopProgressFlush,
  ]);

  const handleCancel = useCallback(() => {
    cancelRequested.current = true;
    stopProgressFlush();

    for (const xhr of activeXhrs.current) {
      try {
        xhr.abort();
      } catch {
        // ignore — abort() throws if the XHR is already in DONE state
      }
    }
    activeXhrs.current.clear();

    uploadAbortController.current?.abort();
    uploadAbortController.current = null;

    resumeSessions.current.clear();
    activeTransfer.current = null;
    transferStartTime.current = null;

    setUploadState("idle");
    setUploadProgress(0);
    setBytesUploaded(0);
    setUploadSpeed(0);
    setEtaSeconds(null);
    setIsFinalizing(false);
    setErrorMsg("");
  }, [stopProgressFlush]);

  const handleFilesAdded = useCallback(
    (newFiles: FileWithPath[]) => {
      // Live Send and stored transfers have different ceilings. Live is
      // bounded by what a browser can stream, stored by the paid plan.
      const tierLimits = getTierLimits(tier);
      const liveCap = senderSideCapability();
      const limits =
        mode === "live"
          ? {
              maxFileSizeBytes: liveCap.maxFileBytes,
              maxTransferSizeBytes: liveCap.maxTotalBytes,
              maxFilesPerTransfer: MAX_FILES_PER_SESSION,
            }
          : tierLimits;
      const planLabel =
        mode === "live" ? "Live Send" : tier === "FREE" ? "the free plan" : `the ${tier} plan`;

      setFiles((prev) => {
        const currentCount = prev.length;
        const currentSize = prev.reduce((s, f) => s + f.size, 0);

        const accepted: SelectedFile[] = [];
        let rejectedTooMany = 0;
        let rejectedTooLarge = 0;
        let rejectedPerFile = 0;

        let runningCount = currentCount;
        let runningSize = currentSize;

        // De-dup by relativePath against what's already selected — re-dropping
        // the same folder shouldn't queue duplicate uploads.
        const existingPaths = new Set(prev.map((f) => f.relativePath));

        for (const { file, relativePath } of newFiles) {
          if (existingPaths.has(relativePath)) continue;
          if (file.size > limits.maxFileSizeBytes) {
            rejectedPerFile++;
            continue;
          }
          if (runningCount + 1 > limits.maxFilesPerTransfer) {
            rejectedTooMany++;
            continue;
          }
          if (runningSize + file.size > limits.maxTransferSizeBytes) {
            rejectedTooLarge++;
            continue;
          }

          const id = `file-${++fileIdCounter}`;
          let previewUrl: string | undefined;
          if (file.type.startsWith("image/")) {
            previewUrl = URL.createObjectURL(file);
          }
          accepted.push({
            id,
            file,
            name: file.name,
            relativePath,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            previewUrl,
          });
          existingPaths.add(relativePath);
          runningCount++;
          runningSize += file.size;
        }

        if (rejectedPerFile > 0) {
          const maxGB = (limits.maxFileSizeBytes / 1024 ** 3).toFixed(0);
          toast.warning(
            "Some files too large",
            `${rejectedPerFile} file(s) exceeded the ${maxGB}GB per-file limit. Upgrade for larger files.`
          );
        }
        if (rejectedTooMany > 0) {
          toast.warning(
            "Too many files",
            `Transfers are capped at ${limits.maxFilesPerTransfer} files on ${planLabel}. ${rejectedTooMany} not added.`
          );
        }
        if (rejectedTooLarge > 0) {
          const maxGB = (limits.maxTransferSizeBytes / 1024 ** 3).toFixed(0);
          toast.warning(
            "Transfer too big",
            `Transfers on ${planLabel} are capped at ${maxGB}GB total. ${rejectedTooLarge} file(s) not added.`
          );
        }

        return [...prev, ...accepted];
      });
    },
    [toast, tier, mode]
  );

  const handleFileRemoved = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const storedAllowed = canCreateStoredTransfer(tier);

  // Live Send owns the whole card once a session starts: its stages
  // (invitation, connecting, sending) replace the upload chrome.
  if (liveActive) {
    return (
      <Card frosted elevation="xl" padding="lg" className="w-full max-w-full sm:max-w-[480px]">
        <LiveSendPanel
          files={files.map((f) => ({ id: f.id, file: f.file, name: f.relativePath }))}
          onExit={() => {
            setLiveActive(false);
            setFiles([]);
          }}
        />
      </Card>
    );
  }

  if (uploadState === "success" && transferResult) {
    return (
      <Card frosted elevation="xl" padding="lg" className="w-full max-w-full sm:max-w-[480px]">
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-nigerian-green/15 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-nigerian-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-h3 font-bold">Transfer complete!</h2>
          <p className="text-body-sm text-[var(--text-secondary)]">
            {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
            {transferResult.durationSeconds > 0 && (
              <> · {formatDuration(transferResult.durationSeconds)}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg mb-4">
          <input
            readOnly
            value={transferResult.downloadUrl}
            className="flex-1 bg-transparent text-body-sm truncate outline-none"
          />
          <Button variant="primary" size="sm" onClick={() => { navigator.clipboard.writeText(transferResult.downloadUrl); toast.success("Copied!", "Link copied to clipboard"); }}>
            Copy
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Here are your files: ${transferResult.downloadUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" fullWidth>WhatsApp</Button>
          </a>
          <a href={`sms:?body=${encodeURIComponent(`Here are your files: ${transferResult.downloadUrl}`)}`}>
            <Button variant="outline" size="sm" fullWidth>SMS</Button>
          </a>
          <a href={`mailto:?subject=Files via NaijaTransfer&body=${encodeURIComponent(`Here are your files: ${transferResult.downloadUrl}`)}`}>
            <Button variant="outline" size="sm" fullWidth>Email</Button>
          </a>
        </div>

        <Button variant="outline" fullWidth onClick={() => {
          setUploadState("idle");
          setFiles([]);
          setTransferResult(null);
          setUploadProgress(0);
          setBytesUploaded(0);
          setUploadSpeed(0);
          setEtaSeconds(null);
          setIsFinalizing(false);
        }}>
          Send another transfer
        </Button>
      </Card>
    );
  }

  return (
    <Card
      frosted
      elevation="xl"
      padding="lg"
      className={cn(
        "w-full max-w-full sm:max-w-[480px]",
        "rounded-[var(--radius-xl)]"
      )}
    >
      <div className="flex items-center gap-2 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-40.png" alt="" width={28} height={28} className="w-7 h-7" />
        <span className="text-h3 font-bold text-nigerian-green">
          NaijaTransfer
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-2 mb-4"
        role="radiogroup"
        aria-label="How to send your files"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "live"}
          onClick={() => setMode("live")}
          className={cn(
            "text-left p-3 rounded-lg border transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nigerian-green",
            mode === "live"
              ? "border-nigerian-green bg-nigerian-green/10"
              : "border-[var(--border)] hover:border-nigerian-green/50"
          )}
        >
          <span className="block text-body-sm font-semibold">Live Send</span>
          <span className="block text-body-sm text-[var(--text-secondary)]">
            Free. Send directly while you&apos;re both online.
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "stored"}
          onClick={() => setMode("stored")}
          className={cn(
            "text-left p-3 rounded-lg border transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nigerian-green",
            mode === "stored"
              ? "border-nigerian-green bg-nigerian-green/10"
              : "border-[var(--border)] hover:border-nigerian-green/50"
          )}
        >
          <span className="block text-body-sm font-semibold">
            Stored Transfer
            <span className="ml-1 text-body-sm font-normal text-[var(--text-muted)]">
              {storedAllowed ? "" : "· Pro"}
            </span>
          </span>
          <span className="block text-body-sm text-[var(--text-secondary)]">
            Upload now. Let them download later.
          </span>
        </button>
      </div>

      <UploadZone
        files={files}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={handleFileRemoved}
        maxFileSize={
          mode === "live"
            ? senderSideCapability().maxFileBytes
            : getTierLimits(tier).maxFileSizeBytes
        }
      />

      {mode === "live" && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] space-y-1">
          <p className="text-body-sm">
            Both of you stay on the page until it finishes. Nothing is uploaded, so there is no
            link to expire and no storage used.
          </p>
          <p className="text-body-sm text-[var(--text-muted)]">
            Works best in Chrome or Edge on desktop. If the recipient&apos;s browser cannot save
            files as they arrive, the transfer is capped at{" "}
            {formatBytes(FALLBACK_MAX_TOTAL_BYTES)}. Some mobile and office networks block
            direct connections entirely.
          </p>
        </div>
      )}

      {mode === "stored" && !storedAllowed && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--bg-secondary)] space-y-2">
          <p className="text-body-sm">{STORED_TRANSFER_UPGRADE_MESSAGE}</p>
          <a href="/pricing" className="contents">
            <Button variant="primary" size="sm" fullWidth>
              See Pro and Business
            </Button>
          </a>
        </div>
      )}

      {mode === "stored" && storedAllowed && (
      <div className="mt-4">
        <Tabs defaultTab="link">
          <TabList>
            <Tab id="email">Email Transfer</Tab>
            <Tab id="link">Get a Link</Tab>
          </TabList>

          <TabPanel id="email">
            <div className="space-y-3">
              <Input
                label="Email to"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                helperText="Separate multiple emails with commas (max 10)"
              />
              <Input
                label="Your email"
                type="email"
                placeholder="you@example.com"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
              />
            </div>
          </TabPanel>

          <TabPanel id="link">
            <p className="text-body-sm text-[var(--text-secondary)]">
              Upload your files and get a shareable link. No email required.
            </p>
          </TabPanel>
        </Tabs>
      </div>
      )}

      {mode === "stored" && storedAllowed && (
        <div className="mt-4">
          <TransferSettings
            values={settings}
            onChange={setSettings}
            maxExpiryDays={Math.min(getTierLimits(tier).maxExpiryDays, 60)}
            maxDownloadLimit={getTierLimits(tier).maxDownloadLimit}
            tier={tier === "FREE" ? "free" : tier === "PRO" ? "pro" : "business"}
          />
        </div>
      )}

      {uploadState === "uploading" && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-body-sm mb-2">
            <span>
              {isFinalizing
                ? "Finalizing…"
                : `${formatBytes(bytesUploaded)} of ${formatBytes(totalSize)}`}
            </span>
            <span>{uploadProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-nigerian-green rounded-full transition-[width] duration-200 ease-linear"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-body-sm text-[var(--text-secondary)] mt-2">
            <span>{uploadSpeed > 0 ? formatSpeed(uploadSpeed) : "Starting…"}</span>
            <span>
              {isFinalizing
                ? "Almost done"
                : etaSeconds != null && etaSeconds > 0
                ? `${formatDuration(etaSeconds)} left`
                : ""}
            </span>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isFinalizing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {uploadState === "error" && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--error-bg)] text-error-red text-body-sm">
          {errorMsg || "Something went wrong. Please try again."}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setUploadState("idle")}>
            Try again
          </Button>
        </div>
      )}

      {uploadState === "idle" && (
        <div className="mt-6">
          {mode === "live" ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={files.length === 0}
              onClick={() => setLiveActive(true)}
            >
              Create Live Send link
              {files.length > 0 ? ` · ${formatBytes(totalSize)}` : ""}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={files.length === 0 || !storedAllowed}
              onClick={handleTransfer}
              loading={false}
            >
              {storedAllowed
                ? `Transfer${files.length > 0 ? ` · ${formatBytes(totalSize)}` : ""}`
                : "Stored transfers need Pro"}
            </Button>
          )}
        </div>
      )}

      {files.length > 0 && uploadState === "idle" && (
        <div className="mt-3">
          <BandwidthEstimator totalBytes={totalSize} />
        </div>
      )}
    </Card>
  );
}
