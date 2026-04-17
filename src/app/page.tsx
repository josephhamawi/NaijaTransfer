"use client";

import { useCallback, useState } from "react";
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
      // 1. Create transfer
      const recipientEmails = emailTo ? emailTo.split(",").map(e => e.trim()).filter(Boolean) : undefined;
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
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to create transfer");
      }

      const { data } = await res.json();

      // 2. Upload each file as parallel parts.
      //
      //    Cloudflare's Free/Pro/Business plans cap request bodies at
      //    ≤200 MB, so real transfers POST to upload.naijatransfer.com
      //    (DNS-only, bypasses Cloudflare). Same-origin in dev.
      //
      //    Splitting each file into N parts and uploading them in
      //    parallel lets the browser saturate the user's uplink — a
      //    single TCP flow from Nigerian residential links usually
      //    tops out well below the real ceiling. The server composes
      //    the parts back into one object in /complete.
      const uploadHost =
        window.location.hostname.endsWith("naijatransfer.com")
          ? "https://upload.naijatransfer.com"
          : "";

      let priorFilesBytes = 0;
      for (const selectedFile of files) {
        // 2a. Init — server reserves quota, decides part layout.
        const initRes = await fetch(
          `${uploadHost}/api/upload/file/init?transferId=${encodeURIComponent(data.transferId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: selectedFile.file.name,
              fileSize: selectedFile.file.size,
              contentType:
                selectedFile.file.type || "application/octet-stream",
            }),
          }
        );
        if (!initRes.ok) {
          const err = await initRes.json().catch(() => ({}));
          throw new Error(
            err.error?.message || `Failed to start ${selectedFile.name}`
          );
        }
        const { data: initData } = await initRes.json();
        const { uploadId, partCount, partSize } = initData as {
          uploadId: string;
          partCount: number;
          partSize: number;
        };

        // 2b. Upload parts in parallel. Track per-part loaded bytes so
        //     the aggregate progress across concurrent uploads stays
        //     accurate — can't rely on onload alone because parts may
        //     finish out of order.
        const fileStartBytes = priorFilesBytes;
        const partLoaded = new Array(partCount).fill(0);
        const sumLoaded = () =>
          partLoaded.reduce((a: number, b: number) => a + b, 0);

        const uploadPart = (partNumber: number) =>
          new Promise<void>((resolve, reject) => {
            const start = (partNumber - 1) * partSize;
            const end = Math.min(
              start + partSize,
              selectedFile.file.size
            );
            const blob = selectedFile.file.slice(start, end);

            const xhr = new XMLHttpRequest();
            xhr.open(
              "POST",
              `${uploadHost}/api/upload/file/chunk?uploadId=${encodeURIComponent(
                uploadId
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
              if (xhr.status >= 200 && xhr.status < 300) {
                partLoaded[partNumber - 1] = end - start;
                reportProgress(fileStartBytes + sumLoaded());
                resolve();
                return;
              }
              let message = `Failed to upload part ${partNumber}`;
              try {
                const body = JSON.parse(xhr.responseText || "{}");
                if (body?.error?.message) message = body.error.message;
              } catch {}
              reject(new Error(message));
            };
            xhr.onerror = () => reject(new Error("network error"));
            xhr.onabort = () => reject(new Error("Upload cancelled"));
            xhr.send(blob);
          });

        const partNumbers = Array.from(
          { length: partCount },
          (_, i) => i + 1
        );
        await Promise.all(partNumbers.map(uploadPart));

        // 2c. Complete — server composes parts into final object and
        //     writes the file record. This is the "Finalizing" phase
        //     from the user's point of view.
        setIsFinalizing(true);
        const completeRes = await fetch(
          `${uploadHost}/api/upload/file/complete?uploadId=${encodeURIComponent(uploadId)}`,
          { method: "POST" }
        );
        setIsFinalizing(false);
        if (!completeRes.ok) {
          const err = await completeRes.json().catch(() => ({}));
          throw new Error(
            err.error?.message || `Failed to finalize ${selectedFile.name}`
          );
        }

        priorFilesBytes += selectedFile.size;
        reportProgress(priorFilesBytes);
      }

      // 3. Send email notification if recipients provided
      if (recipientEmails && recipientEmails.length > 0) {
        try {
          const notifyRes = await fetch(`/api/transfer/${data.shortCode}/notify`, {
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
        shortCode: data.shortCode,
        downloadUrl: `${window.location.origin}/d/${data.shortCode}`,
      });
      setUploadState("success");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Unknown error";
      // User-friendly error messages
      let friendly = "Something went wrong. Please try again.";
      if (raw.includes("DAILY_LIMIT")) friendly = "You've reached your daily transfer limit. Try again tomorrow or upgrade to Pro.";
      else if (raw.includes("too large") || raw.includes("size")) friendly = "File is too large for your plan. Upgrade for bigger transfers.";
      else if (raw.includes("network") || raw.includes("fetch")) friendly = "Connection lost. Check your internet and try again.";

      toast.error("Upload failed", friendly);
      setErrorMsg(friendly);
      setUploadState("error");
    }
  }, [files, emailTo, emailFrom, settings]);

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
