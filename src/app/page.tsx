"use client";

import { useCallback, useRef, useState } from "react";
import { cn, formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import { TIER_LIMITS } from "@/lib/tier-limits";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import UploadZone, { type SelectedFile } from "@/components/upload/UploadZone";
import TransferSettings, {
  type TransferSettingsValues,
} from "@/components/upload/TransferSettings";
import BandwidthEstimator from "@/components/upload/BandwidthEstimator";
import ShareCard from "@/components/upload/ShareCard";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

// Force dynamic rendering. Without this Next.js generates the page
// at build time and emits Cache-Control: s-maxage=31536000, which
// pins the HTML (and its script-chunk references) in the browser
// cache for a year — so users keep loading stale JS after deploys.
export const dynamic = "force-dynamic";

let fileIdCounter = 0;

type UploadState = "idle" | "uploading" | "success" | "error";

/**
 * Homepage / Upload Page
 *
 * The homepage IS the upload page. One screen. Drag, drop, share.
 * Full-bleed wallpaper background with floating upload card.
 * Mobile: card is full-width minus padding. Desktop: 480px, offset left.
 */
export default function HomePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [settings, setSettings] = useState<TransferSettingsValues>({
    expiryDays: 7,
    downloadLimit: 50,
    password: "",
    message: "",
  });
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [transferResult, setTransferResult] = useState<{ shortCode: string; downloadUrl: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Refs to track in-flight work so Cancel can abort everything fast.
  // Each active XHR registers itself here; the AbortController is used
  // for the init and complete fetches. cancelRequested signals the
  // catch block to skip the error toast when the abort was user-initiated.
  const activeXhrs = useRef<Set<XMLHttpRequest>>(new Set());
  const uploadAbortController = useRef<AbortController | null>(null);
  const cancelRequested = useRef(false);

  // Resume state: remember each in-progress file's (transferId,
  // uploadId) across attempts so a Try-again skips re-uploading
  // chunks that already landed on GCS. Keyed by file identity
  // (name+size+lastModified). Cleared per-file on successful
  // completion or user cancellation.
  const resumeSessions = useRef<
    Map<
      string,
      {
        transferId: string;
        shortCode: string;
        uploadId: string;
        partCount: number;
        partSize: number;
      }
    >
  >(new Map());

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

    // Reset cancellation state for this run and prepare the abort
    // controller. Any in-flight work from a previous attempt should
    // have been cleared by handleCancel or the success path.
    cancelRequested.current = false;
    activeXhrs.current.clear();
    uploadAbortController.current = new AbortController();
    const abortSignal = uploadAbortController.current.signal;

    // Stable identity for a File — used to key the resume map.
    // lastModified differs between two files with the same name/size,
    // which is usually enough to tell "same file chosen after reload"
    // from "a different file the user picked that happens to share a
    // name."
    const fileKey = (f: SelectedFile) =>
      `${f.file.name}:${f.file.size}:${f.file.lastModified}`;

    // Wait for the browser to come back online before a retry. Flaky
    // residential ISPs drop the whole connection for tens of seconds
    // at a time; burning retries into a dead network is wasted effort.
    const waitForOnline = (maxWaitMs = 60_000) =>
      new Promise<void>((resolve) => {
        if (
          typeof navigator === "undefined" ||
          navigator.onLine !== false
        ) {
          resolve();
          return;
        }
        const cleanup = () => {
          clearTimeout(timer);
          window.removeEventListener("online", onOnline);
          abortSignal.removeEventListener("abort", onAbort);
        };
        const onOnline = () => {
          cleanup();
          resolve();
        };
        const onAbort = () => {
          cleanup();
          resolve();
        };
        const timer = setTimeout(() => {
          cleanup();
          resolve();
        }, maxWaitMs);
        window.addEventListener("online", onOnline);
        abortSignal.addEventListener("abort", onAbort, { once: true });
      });

    const totalBytes = files.reduce((s, f) => s + f.size, 0);

    // Rolling speed: EMA over XHR progress samples, ≥250ms apart so a
    // burst of small events doesn't collapse the window to ~0ms and
    // produce huge instantaneous speeds. ETA = (remaining / speed).
    let lastSampleTime = Date.now();
    let lastSampleBytes = 0;
    let smoothedSpeed = 0;

    const reportProgress = (absBytes: number) => {
      setBytesUploaded(absBytes);
      setUploadProgress(
        totalBytes > 0 ? Math.min(100, (absBytes / totalBytes) * 100) : 0
      );

      const now = Date.now();
      const dt = (now - lastSampleTime) / 1000;
      if (dt >= 0.25) {
        const instant = (absBytes - lastSampleBytes) / dt;
        smoothedSpeed =
          smoothedSpeed === 0 ? instant : smoothedSpeed * 0.7 + instant * 0.3;
        setUploadSpeed(smoothedSpeed);
        setEtaSeconds(
          smoothedSpeed > 0
            ? Math.max(0, (totalBytes - absBytes) / smoothedSpeed)
            : null
        );
        lastSampleTime = now;
        lastSampleBytes = absBytes;
      }
    };

    try {
      const recipientEmails = emailTo ? emailTo.split(",").map(e => e.trim()).filter(Boolean) : undefined;

      // If the first file has a live resume session, reuse its
      // transferId and shortCode — we want the retry to continue
      // into the *same* transfer the previous attempt started, not
      // spawn a new one (which would strand the parts already on GCS).
      let data: { transferId: string; shortCode: string } | null = null;

      const uploadHost =
        window.location.hostname.endsWith("naijatransfer.com")
          ? "https://upload.naijatransfer.com"
          : "";

      if (files.length > 0) {
        const firstSaved = resumeSessions.current.get(fileKey(files[0]));
        if (firstSaved) {
          try {
            const probe = await fetch(
              `${uploadHost}/api/upload/file/status?uploadId=${encodeURIComponent(firstSaved.uploadId)}`,
              { signal: abortSignal }
            );
            if (probe.ok) {
              data = {
                transferId: firstSaved.transferId,
                shortCode: firstSaved.shortCode,
              };
            } else {
              // Stale session on the server — scrap everything saved
              // so the next branch creates a fresh transfer.
              resumeSessions.current.clear();
            }
          } catch {
            // Ignore; fall through to fresh create
          }
        }
      }

      if (!data) {
        // No resume — create a fresh transfer and discard any stale
        // per-file sessions pointing at a transfer we're not using.
        resumeSessions.current.clear();
        const res = await fetch("/api/upload/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user?.uid || undefined,
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

        data = (await res.json()).data;
      }

      if (!data) {
        // Defensive: neither branch set data. Shouldn't happen; guards
        // the downstream non-null usages from TS flow analysis.
        throw new Error("Failed to initialise transfer");
      }
      const transfer = data;

      // 2. Upload each file as parallel chunks. Resume-aware: if a
      //    prior attempt left a live session for this file on the
      //    server, re-use it and skip chunks that already landed on
      //    GCS. Cloudflare's 100 MB cap means real transfers go to
      //    upload.naijatransfer.com (DNS-only, bypasses CF).
      let priorFilesBytes = 0;
      for (const selectedFile of files) {
        const key = fileKey(selectedFile);
        const saved = resumeSessions.current.get(key);

        let uploadId: string | undefined;
        let partCount = 0;
        let partSize = 0;
        let completedChunks: number[] = [];

        // 2a. Try to resume if we have a saved session pointing at the
        //     current transfer. Mismatched transferIds mean the saved
        //     session belongs to a different transfer (shouldn't happen
        //     normally, but be defensive).
        if (saved && saved.transferId === transfer.transferId) {
          try {
            const statusRes = await fetch(
              `${uploadHost}/api/upload/file/status?uploadId=${encodeURIComponent(saved.uploadId)}`,
              { signal: abortSignal }
            );
            if (statusRes.ok) {
              const { data: status } = await statusRes.json();
              uploadId = saved.uploadId;
              partCount = saved.partCount;
              partSize = saved.partSize;
              completedChunks = Array.isArray(status.completedChunks)
                ? (status.completedChunks as number[])
                : [];
            } else {
              resumeSessions.current.delete(key);
            }
          } catch {
            resumeSessions.current.delete(key);
          }
        }

        // 2b. Fresh /init when there's no usable saved session. Reserves
        //     quota atomically; server decides chunk layout.
        if (!uploadId) {
          const initRes = await fetch(
            `${uploadHost}/api/upload/file/init?transferId=${encodeURIComponent(transfer.transferId)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: selectedFile.file.name,
                fileSize: selectedFile.file.size,
                contentType:
                  selectedFile.file.type || "application/octet-stream",
              }),
              signal: abortSignal,
            }
          );
          if (!initRes.ok) {
            const err = await initRes.json().catch(() => ({}));
            throw new Error(
              err.error?.message || `Failed to start ${selectedFile.name}`
            );
          }
          const { data: initData } = await initRes.json();
          uploadId = initData.uploadId as string;
          partCount = initData.partCount as number;
          partSize = initData.partSize as number;

          // Stash the session so a later Try-again can resume this file
          // without re-uploading what already made it to GCS.
          resumeSessions.current.set(key, {
            transferId: transfer.transferId,
            shortCode: transfer.shortCode,
            uploadId,
            partCount,
            partSize,
          });
        }

        // 2c. Seed progress with bytes that are already on the server.
        const fileStartBytes = priorFilesBytes;
        const partLoaded = new Array(partCount).fill(0);
        for (const n of completedChunks) {
          if (n >= 1 && n <= partCount) {
            const start = (n - 1) * partSize;
            const end = Math.min(start + partSize, selectedFile.file.size);
            partLoaded[n - 1] = end - start;
          }
        }
        const sumLoaded = () =>
          partLoaded.reduce((a: number, b: number) => a + b, 0);
        reportProgress(fileStartBytes + sumLoaded());

        // Captured once per iteration so the inner XHR callbacks don't
        // re-read the possibly-mutating loop variable.
        const currentUploadId = uploadId;

        const uploadPart = (partNumber: number) =>
          new Promise<void>((resolve, reject) => {
            const start = (partNumber - 1) * partSize;
            const end = Math.min(
              start + partSize,
              selectedFile.file.size
            );
            const blob = selectedFile.file.slice(start, end);

            const xhr = new XMLHttpRequest();
            activeXhrs.current.add(xhr);
            const cleanup = () => activeXhrs.current.delete(xhr);
            xhr.open(
              "POST",
              `${uploadHost}/api/upload/file/chunk?uploadId=${encodeURIComponent(
                currentUploadId
              )}&chunkNumber=${partNumber}`
            );
            xhr.setRequestHeader(
              "Content-Type",
              selectedFile.file.type || "application/octet-stream"
            );

            xhr.upload.onprogress = (e) => {
              if (!e.lengthComputable) return;
              partLoaded[partNumber - 1] = e.loaded;
              reportProgress(fileStartBytes + sumLoaded());
            };
            xhr.onload = () => {
              cleanup();
              if (xhr.status >= 200 && xhr.status < 300) {
                partLoaded[partNumber - 1] = end - start;
                reportProgress(fileStartBytes + sumLoaded());
                resolve();
                return;
              }
              // 5xx / 0 means network or proxy-layer failure — mark the
              // error as retryable via the "network" keyword the outer
              // catch block maps to "Connection lost."
              if (xhr.status >= 500 || xhr.status === 0) {
                reject(new Error(`network: HTTP ${xhr.status}`));
                return;
              }
              let message = `Failed to upload part ${partNumber}`;
              try {
                const body = JSON.parse(xhr.responseText || "{}");
                if (body?.error?.message) message = body.error.message;
              } catch {}
              reject(new Error(message));
            };
            xhr.onerror = () => {
              cleanup();
              reject(new Error("network error"));
            };
            xhr.onabort = () => {
              cleanup();
              reject(new Error("Upload cancelled"));
            };
            xhr.send(blob);
          });

        // Retry wrapper: ISPs drop TCP flows on long uploads. On each
        // failure, reset progress for that chunk, wait for the browser
        // to report itself back online (up to 60s), then back off
        // exponentially. Permanent server errors bypass retries.
        const uploadPartWithRetry = async (partNumber: number) => {
          const MAX_ATTEMPTS = 6;
          let lastError: unknown;
          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (cancelRequested.current) {
              throw new Error("Upload cancelled");
            }
            try {
              await uploadPart(partNumber);
              return;
            } catch (err) {
              lastError = err;
              const msg = err instanceof Error ? err.message : "";
              if (
                cancelRequested.current ||
                msg.includes("cancelled") ||
                msg.includes("FILE_TOO_LARGE") ||
                msg.includes("TRANSFER_TOO_LARGE") ||
                msg.includes("TOO_MANY_FILES") ||
                msg.includes("UPLOAD_NOT_FOUND")
              ) {
                throw err;
              }
              if (attempt === MAX_ATTEMPTS) throw err;
              // Reset the failed chunk's progress so the bar doesn't
              // lie while the retry re-climbs.
              partLoaded[partNumber - 1] = 0;
              reportProgress(fileStartBytes + sumLoaded());
              await waitForOnline(60_000);
              if (cancelRequested.current) {
                throw new Error("Upload cancelled");
              }
              // Backoff: 1s, 2s, 4s, 8s, 16s. Capped so a total retry
              // cycle takes <1 min per chunk in the worst case.
              await new Promise((r) =>
                setTimeout(
                  r,
                  1000 * Math.min(16, Math.pow(2, attempt - 1))
                )
              );
            }
          }
          throw lastError;
        };

        // Only upload chunks the server doesn't already have.
        const chunksToUpload: number[] = [];
        for (let i = 1; i <= partCount; i++) {
          if (!completedChunks.includes(i)) chunksToUpload.push(i);
        }
        await Promise.all(chunksToUpload.map(uploadPartWithRetry));

        // 2d. Complete — server composes parts into final object and
        //     writes the file record. "Finalizing" phase UI-wise.
        setIsFinalizing(true);
        const completeRes = await fetch(
          `${uploadHost}/api/upload/file/complete?uploadId=${encodeURIComponent(currentUploadId)}`,
          { method: "POST", signal: abortSignal }
        );
        setIsFinalizing(false);
        if (!completeRes.ok) {
          const err = await completeRes.json().catch(() => ({}));
          throw new Error(
            err.error?.message || `Failed to finalize ${selectedFile.name}`
          );
        }

        // File is done — purge its resume session.
        resumeSessions.current.delete(key);

        priorFilesBytes += selectedFile.size;
        reportProgress(priorFilesBytes);
      }

      // 3. Send email notification if recipients provided
      if (recipientEmails && recipientEmails.length > 0) {
        try {
          const notifyRes = await fetch(`/api/transfer/${transfer.shortCode}/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientEmails,
              senderName: emailFrom || undefined,
            }),
          });
          if (notifyRes.ok) {
            toast.success("Email sent!", `Download link sent to ${recipientEmails.join(", ")}`);
          } else {
            toast.warning("Transfer ready", "Files uploaded but email delivery failed. Share the link manually.");
          }
        } catch {
          toast.warning("Transfer ready", "Files uploaded but email could not be sent. Share the link manually.");
        }
      } else {
        toast.success("Transfer complete!", "Your files are ready to share.");
      }

      // 4. Success
      setTransferResult({
        shortCode: transfer.shortCode,
        downloadUrl: `${window.location.origin}/d/${transfer.shortCode}`,
      });
      setUploadState("success");
    } catch (err) {
      // User-initiated cancel: go back to idle without a scary toast.
      // handleCancel already reset the UI state, so just exit.
      if (cancelRequested.current) {
        return;
      }

      const raw = err instanceof Error ? err.message : "Unknown error";
      // User-friendly error messages. When we reach this catch block
      // after a partial upload, the per-file resume sessions are still
      // in place — clicking "Try again" will pick up from the last
      // chunk that made it to GCS instead of starting from zero.
      const hasResume = resumeSessions.current.size > 0;
      const resumeHint = hasResume
        ? " Click Try again to resume from where you left off."
        : "";
      let friendly =
        "Something went wrong. Please try again." + resumeHint;
      if (raw.includes("DAILY_LIMIT")) friendly = "You've reached your daily transfer limit. Try again tomorrow or upgrade to Pro.";
      else if (raw.includes("too large") || raw.includes("size")) friendly = "File is too large for your plan. Upgrade for bigger transfers.";
      else if (raw.includes("network") || raw.includes("fetch")) friendly = "Connection lost. Check your internet and try again." + resumeHint;

      toast.error("Upload failed", friendly);
      setErrorMsg(friendly);
      setUploadState("error");
    }
  }, [files, emailTo, emailFrom, settings]);

  const handleCancel = useCallback(() => {
    // Signal the in-flight handleTransfer to bail out quietly.
    cancelRequested.current = true;

    // Abort every open XHR upload.
    for (const xhr of activeXhrs.current) {
      try {
        xhr.abort();
      } catch {
        // ignore — abort() throws if the XHR is already in DONE state
      }
    }
    activeXhrs.current.clear();

    // Cancel any in-flight fetch (init/create/complete).
    uploadAbortController.current?.abort();
    uploadAbortController.current = null;

    // User explicitly cancelled — don't let a later "Transfer" click
    // try to resume this abandoned session.
    resumeSessions.current.clear();

    setUploadState("idle");
    setUploadProgress(0);
    setBytesUploaded(0);
    setUploadSpeed(0);
    setEtaSeconds(null);
    setIsFinalizing(false);
    setErrorMsg("");
  }, []);

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      // Gate on the Free-tier caps (the server is authoritative and will
      // raise the ceiling for paid users; rejecting here gives immediate
      // feedback instead of a fetch-that-fails halfway through the batch).
      const limits = TIER_LIMITS.FREE;

      setFiles((prev) => {
        const currentCount = prev.length;
        const currentSize = prev.reduce((s, f) => s + f.size, 0);

        const accepted: SelectedFile[] = [];
        let rejectedTooMany = 0;
        let rejectedTooLarge = 0;
        let rejectedPerFile = 0;

        let runningCount = currentCount;
        let runningSize = currentSize;

        for (const file of newFiles) {
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
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            previewUrl,
          });
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
            `Transfers are capped at ${limits.maxFilesPerTransfer} files on the free plan. ${rejectedTooMany} not added.`
          );
        }
        if (rejectedTooLarge > 0) {
          const maxGB = (limits.maxTransferSizeBytes / 1024 ** 3).toFixed(0);
          toast.warning(
            "Transfer too big",
            `Free-tier transfers are capped at ${maxGB}GB total. ${rejectedTooLarge} file(s) not added.`
          );
        }

        return [...prev, ...accepted];
      });
    },
    [toast]
  );

  const handleFileRemoved = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  return (
    <PageLayout showWallpaper>
      <div
        className={cn(
          "flex items-start justify-center min-h-screen",
          "px-4 pt-24 pb-12",
          "lg:justify-start lg:pl-[10%]"
        )}
      >
        {/* Upload widget card -- frosted glass overlay */}
        <Card
          frosted
          elevation="xl"
          padding="lg"
          className={cn(
            "w-full max-w-full sm:max-w-[480px]",
            "rounded-[var(--radius-xl)]"
          )}
        >
          {/* Logo / branding in card */}
          <div className="flex items-center gap-2 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-40.png" alt="" width={28} height={28} className="w-7 h-7" />
            <span className="text-h3 font-bold text-nigerian-green">
              NaijaTransfer
            </span>
          </div>

          {/* Upload zone */}
          <UploadZone
            files={files}
            onFilesAdded={handleFilesAdded}
            onFileRemoved={handleFileRemoved}
            maxFileSize={4 * 1024 * 1024 * 1024}
          />

          {/* Email / Link tabs */}
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

          {/* Transfer settings (expandable accordion) */}
          <div className="mt-4">
            <TransferSettings
              values={settings}
              onChange={setSettings}
              maxExpiryDays={7}
              maxDownloadLimit={50}
              tier="free"
            />
          </div>

          {/* Upload progress */}
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

          {/* Error state */}
          {uploadState === "error" && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--error-bg)] text-error-red text-body-sm">
              {errorMsg || "Something went wrong. Please try again."}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setUploadState("idle")}>
                Try again
              </Button>
            </div>
          )}

          {/* Transfer button */}
          {uploadState === "idle" && (
            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={files.length === 0}
                onClick={handleTransfer}
                loading={false}
              >
                Transfer{files.length > 0 ? ` · ${formatBytes(totalSize)}` : ""}
              </Button>
            </div>
          )}

          {/* Bandwidth estimate */}
          {files.length > 0 && uploadState === "idle" && (
            <div className="mt-3">
              <BandwidthEstimator totalBytes={totalSize} />
            </div>
          )}
        </Card>

        {/* Success: Share Card (replaces upload widget) */}
        {uploadState === "success" && transferResult && (
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-full sm:max-w-[480px] mt-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-nigerian-green/15 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-nigerian-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-h3 font-bold">Transfer complete!</h2>
              <p className="text-body-sm text-[var(--text-secondary)]">
                {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
              </p>
            </div>

            {/* Link */}
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

            {/* Share buttons */}
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
        )}
      </div>

      {/* Below-fold content */}
      <div className="relative z-10 bg-charcoal-800 text-white border-t border-white/10">
        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-h2 sm:text-h1 text-center mb-10 text-white">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M16 4v16M8 12l8-8 8 8" />
                  <path d="M4 24h24" />
                </svg>
              }
              title="Add your files"
              description="Drag and drop or tap to select. Up to 4 GB free."
            />
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M10 16h12" />
                  <circle cx="16" cy="16" r="12" />
                </svg>
              }
              title="Get a link"
              description="Instant shareable link and QR code for your transfer."
            />
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M22 2L26 6 22 10" />
                  <path d="M4 14V10a4 4 0 014-4h18" />
                  <path d="M10 30L6 26 10 22" />
                  <path d="M28 18v4a4 4 0 01-4 4H6" />
                </svg>
              }
              title="Share anywhere"
              description="WhatsApp, SMS, email, or just copy the link."
            />
          </div>
        </section>

        {/* Why NaijaTransfer */}
        <section className="bg-charcoal-600/50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-h2 sm:text-h1 text-center mb-10 text-white">
              Why NaijaTransfer?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TrustSignal
                title="4 GB free"
                description="2x WeTransfer's free limit. No tricks."
              />
              <TrustSignal
                title="No account needed"
                description="Upload and share in seconds. Zero sign-up."
              />
              <TrustSignal
                title="Resumes when connection drops"
                description="Built for Nigerian internet. Your upload survives dropped connections."
              />
              <TrustSignal
                title="Original quality, always"
                description="We never compress or modify your files. Unlike WhatsApp."
              />
              <TrustSignal
                title="Nigerian-owned. Naira pricing."
                description="Built here. Priced here. Works here."
              />
              <TrustSignal
                title="Password protection"
                description="Free for everyone. Secure your transfers."
              />
            </div>
          </div>
        </section>

        {/* For Business CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="max-w-lg mx-auto p-6 md:p-8 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg">
            <h2 className="text-h2 mb-2 text-white">For Businesses</h2>
            <p className="text-body-sm text-white/60 mb-6">
              Custom branding, 50 GB transfers, API access, and priority
              support. From NGN 10,000/month.
            </p>
            <a href="/business">
              <Button variant="gold" size="lg">Learn more</Button>
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

function HowItWorksStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nigerian-green/15 mb-4">
        {icon}
      </div>
      <h3 className="text-h3 mb-2 text-white">{title}</h3>
      <p className="text-body-sm text-white/60">{description}</p>
    </div>
  );
}

function TrustSignal({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-1">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-nigerian-green"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
          <path
            d="M6.5 10.5L8.5 12.5L13.5 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-body font-semibold text-white">
          {title}
        </h3>
        <p className="text-body-sm text-white/60">
          {description}
        </p>
      </div>
    </div>
  );
}
