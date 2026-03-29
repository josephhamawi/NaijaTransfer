"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import AdBanner from "@/components/download/AdBanner";
import { cn, formatBytes, formatRelativeTime } from "@/lib/utils";

interface TransferFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  hasPreview: boolean;
}

interface TransferData {
  shortCode: string;
  message: string | null;
  hasPassword: boolean;
  downloadLimit: number;
  downloadCount: number;
  totalSizeBytes: number;
  expiresAt: string;
  showAds: boolean;
  tier: string;
  files: TransferFile[];
}

export default function DownloadPage() {
  const params = useParams<{ code: string }>();
  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function fetchTransfer() {
      try {
        const res = await fetch(`/api/transfer/${params.code}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error?.code === "NOT_FOUND" ? "expired" : "error");
          return;
        }
        const json = await res.json();
        setTransfer(json.data);
      } catch {
        setError("error");
      } finally {
        setLoading(false);
      }
    }
    fetchTransfer();
  }, [params.code]);

  async function verifyPassword() {
    if (!passwordInput) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/transfer/${params.code}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        setPasswordVerified(true);
      } else {
        setPasswordInput("");
      }
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <PageLayout showWallpaper>
        <div className="flex items-center justify-center min-h-screen">
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-md text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-[var(--bg-secondary)] rounded w-2/3 mx-auto" />
              <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2 mx-auto" />
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error === "expired") {
    return (
      <PageLayout showWallpaper>
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-md text-center">
            <h1 className="text-h2 mb-2">Transfer Expired</h1>
            <p className="text-body-sm text-[var(--text-secondary)] mb-6">This transfer has expired or been deleted.</p>
            <Button variant="primary" size="lg" onClick={() => window.location.href = "/"}>
              Send your own files — free!
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error || !transfer) {
    return (
      <PageLayout showWallpaper>
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-md text-center">
            <h1 className="text-h2 mb-2">Something went wrong</h1>
            <p className="text-body-sm text-[var(--text-secondary)]">Please try again later.</p>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Password gate
  if (transfer.hasPassword && !passwordVerified) {
    return (
      <PageLayout showWallpaper>
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card frosted elevation="xl" padding="lg" className="w-full max-w-md">
            <h1 className="text-h2 mb-2 text-center">Password Protected</h1>
            <p className="text-body-sm text-[var(--text-secondary)] text-center mb-6">
              Enter the password to access these files.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); verifyPassword(); }}>
              <Input
                type="password"
                label="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
              />
              <Button variant="primary" size="lg" fullWidth className="mt-4" loading={verifying}>
                Access Files
              </Button>
            </form>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const expiresAt = new Date(transfer.expiresAt);
  const downloadsLeft = transfer.downloadLimit - transfer.downloadCount;

  return (
    <PageLayout showWallpaper>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-lg space-y-4">
          <Card frosted elevation="xl" padding="lg">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-h3 font-bold">Your files are ready</h1>
                <Badge variant={transfer.tier === "FREE" ? "default" : transfer.tier === "PRO" ? "pro" : "business"}>
                  {transfer.files.length} file{transfer.files.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-body-sm text-[var(--text-secondary)]">
                {formatBytes(transfer.totalSizeBytes)} total
              </p>
            </div>

            {/* Sender message */}
            {transfer.message && (
              <div className="bg-[var(--bg-secondary)] border-l-3 border-nigerian-green p-3 rounded mb-4">
                <p className="text-body-sm text-[var(--text-primary)]">{transfer.message}</p>
              </div>
            )}

            {/* File list */}
            <div className="divide-y divide-[var(--border-color)]">
              {transfer.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon mimeType={file.mimeType} />
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium truncate">{file.name}</p>
                      <p className="text-caption-style text-[var(--text-muted)]">{formatBytes(file.sizeBytes)}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/transfer/${params.code}/download/${file.id}`}
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm">Download</Button>
                  </a>
                </div>
              ))}
            </div>

            {/* Download All */}
            {transfer.files.length > 1 && (
              <a href={`/api/transfer/${params.code}/download-all`} className="block mt-4">
                <Button variant="primary" size="lg" fullWidth>
                  Download All as ZIP
                </Button>
              </a>
            )}

            {/* Expiry + downloads info */}
            <div className="flex items-center justify-between mt-4 text-caption-style text-[var(--text-muted)]">
              <span>Expires {formatRelativeTime(expiresAt)}</span>
              {transfer.downloadLimit > 0 && (
                <span>{downloadsLeft} download{downloadsLeft !== 1 ? "s" : ""} left</span>
              )}
            </div>
          </Card>

          {/* Ad banner for free tier */}
          <AdBanner showAds={transfer.showAds} />

          {/* CTA */}
          <div className="text-center">
            <a href="/" className="text-body-sm text-nigerian-green hover:underline font-medium">
              Send your own files — free!
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const color = mimeType.startsWith("image/") ? "text-blue-500"
    : mimeType.startsWith("video/") ? "text-purple-500"
    : mimeType === "application/pdf" ? "text-red-500"
    : "text-[var(--text-muted)]";

  return (
    <div className={cn("w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0", color)}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path d="M12 2v4h4" />
      </svg>
    </div>
  );
}
