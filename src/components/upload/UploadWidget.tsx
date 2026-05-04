"use client";

import { useCallback, useRef, useState } from "react";
import { cn, formatBytes, formatDuration, formatSpeed } from "@/lib/utils";
import { TIER_LIMITS } from "@/lib/tier-limits";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import UploadZone, { type SelectedFile } from "@/components/upload/UploadZone";
import TransferSettings, {
  type TransferSettingsValues,
} from "@/components/upload/TransferSettings";
import BandwidthEstimator from "@/components/upload/BandwidthEstimator";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

let fileIdCounter = 0;

type UploadState = "idle" | "uploading" | "success" | "error";

/**
 * Interactive upload widget — the only client-rendered piece of the
 * homepage. Pulled out of page.tsx so the marketing chrome can be
 * server-rendered (smaller JS bundle, faster LCP).
 */
export default function UploadWidget() {
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
  const [transferResult, setTransferResult] = useState<{ shortCode: string; downloadUrl: string; durationSeconds: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const activeXhrs = useRef<Set<XMLHttpRequest>>(new Set());
  const uploadAbortController = useRef<AbortController | null>(null);
  const cancelRequested = useRef(false);
  const transferStartTime = useRef<number | null>(null);
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

    cancelRequested.current = false;
    activeXhrs.current.clear();
    uploadAbortController.current = new AbortController();
    const abortSignal = uploadAbortController.current.signal;

    if (transferStartTime.current === null) {
      transferStartTime.current = Date.now();
    }

    const fileKey = (f: SelectedFile) =>
      `${f.file.name}:${f.file.size}:${f.file.lastModified}`;

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
              resumeSessions.current.clear();
            }
          } catch {
            // Ignore; fall through to fresh create
          }
        }
      }

      if (!data) {
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
        throw new Error("Failed to initialise transfer");
      }
      const transfer = data;

      let priorFilesBytes = 0;
      for (const selectedFile of files) {
        const key = fileKey(selectedFile);
        const saved = resumeSessions.current.get(key);

        let uploadId: string | undefined;
        let partCount = 0;
        let partSize = 0;
        let completedChunks: number[] = [];

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

          resumeSessions.current.set(key, {
            transferId: transfer.transferId,
            shortCode: transfer.shortCode,
            uploadId,
            partCount,
            partSize,
          });
        }

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
              partLoaded[partNumber - 1] = 0;
              reportProgress(fileStartBytes + sumLoaded());
              await waitForOnline(60_000);
              if (cancelRequested.current) {
                throw new Error("Upload cancelled");
              }
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

        const chunksToUpload: number[] = [];
        for (let i = 1; i <= partCount; i++) {
          if (!completedChunks.includes(i)) chunksToUpload.push(i);
        }
        await Promise.all(chunksToUpload.map(uploadPartWithRetry));

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

        resumeSessions.current.delete(key);

        priorFilesBytes += selectedFile.size;
        reportProgress(priorFilesBytes);
      }

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

      const durationSeconds = transferStartTime.current
        ? (Date.now() - transferStartTime.current) / 1000
        : 0;
      transferStartTime.current = null;
      setTransferResult({
        shortCode: transfer.shortCode,
        downloadUrl: `${window.location.origin}/d/${transfer.shortCode}`,
        durationSeconds,
      });
      setUploadState("success");
    } catch (err) {
      if (cancelRequested.current) {
        return;
      }

      const raw = err instanceof Error ? err.message : "Unknown error";
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
  }, [files, emailTo, emailFrom, settings, toast, user]);

  const handleCancel = useCallback(() => {
    cancelRequested.current = true;

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
    transferStartTime.current = null;

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

      <UploadZone
        files={files}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={handleFileRemoved}
        maxFileSize={4 * 1024 * 1024 * 1024}
      />

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

      <div className="mt-4">
        <TransferSettings
          values={settings}
          onChange={setSettings}
          maxExpiryDays={7}
          maxDownloadLimit={50}
          tier="free"
        />
      </div>

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

      {files.length > 0 && uploadState === "idle" && (
        <div className="mt-3">
          <BandwidthEstimator totalBytes={totalSize} />
        </div>
      )}
    </Card>
  );
}
