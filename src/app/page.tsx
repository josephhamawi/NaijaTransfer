"use client";

import { useCallback, useState } from "react";
import { cn, formatBytes } from "@/lib/utils";
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
  const [transferResult, setTransferResult] = useState<{ shortCode: string; downloadUrl: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleTransfer = useCallback(async () => {
    if (files.length === 0) return;
    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMsg("");

    try {
      // 1. Create transfer
      const recipientEmails = emailTo ? emailTo.split(",").map(e => e.trim()).filter(Boolean) : undefined;
      const res = await fetch("/api/upload/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      // 2. Simulate upload progress (real tus integration would replace this)
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 50));
        setUploadProgress(i);
      }

      // 3. Success
      setTransferResult({
        shortCode: data.shortCode,
        downloadUrl: `${window.location.origin}/d/${data.shortCode}`,
      });
      setUploadState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  }, [files, emailTo, emailFrom, settings]);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const selectedFiles: SelectedFile[] = newFiles.map((file) => {
      const id = `file-${++fileIdCounter}`;
      let previewUrl: string | undefined;

      // Generate thumbnail preview for images
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        previewUrl,
      };
    });

    setFiles((prev) => [...prev, ...selectedFiles]);
  }, []);

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
          "flex items-center justify-center min-h-screen",
          "px-4 pt-24 pb-8",
          "lg:justify-start lg:pl-[10%]"
        )}
      >
        {/* Upload widget card -- frosted glass overlay */}
        <Card
          frosted
          elevation="xl"
          padding="lg"
          className={cn(
            "w-full max-w-[480px]",
            "rounded-[var(--radius-xl)]"
          )}
        >
          {/* Logo / branding in card */}
          <div className="flex items-center gap-2 mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
              className="text-nigerian-green"
            >
              <rect width="28" height="28" rx="6" fill="currentColor" />
              <path
                d="M8 20V8l6 12L20 8v12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-h3 font-bold text-nigerian-green">
              NigeriaTransfer
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
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-nigerian-green rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
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
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-[480px] mt-4">
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
              <Button variant="primary" size="sm" onClick={() => navigator.clipboard.writeText(transferResult.downloadUrl)}>
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
              <a href={`mailto:?subject=Files via NigeriaTransfer&body=${encodeURIComponent(`Here are your files: ${transferResult.downloadUrl}`)}`}>
                <Button variant="outline" size="sm" fullWidth>Email</Button>
              </a>
            </div>

            <Button variant="outline" fullWidth onClick={() => {
              setUploadState("idle");
              setFiles([]);
              setTransferResult(null);
              setUploadProgress(0);
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
          <h2 className="text-h1 text-center mb-10 text-white">How it works</h2>
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

        {/* Why NigeriaTransfer */}
        <section className="bg-charcoal-600/50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-h1 text-center mb-10 text-white">
              Why NigeriaTransfer?
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
            <Button variant="gold" size="lg">
              Learn more
            </Button>
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
