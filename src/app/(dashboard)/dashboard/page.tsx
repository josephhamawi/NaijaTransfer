"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { formatBytes } from "@/lib/utils";

interface Transfer {
  id: string;
  shortCode: string;
  status: string;
  downloadCount: number;
  downloadLimit: number;
  totalSizeBytes: number;
  fileCount: number;
  expiresAt: string;
  createdAt: string;
}

export default function DashboardPage() {
  const toast = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [storage, setStorage] = useState<{ usedFormatted: string; maxFormatted: string; percentage: number; tier: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/transfers").then(r => r.json()).then(d => setTransfers(d.data?.transfers ?? [])).catch(() => {});
    fetch("/api/user/storage").then(r => r.json()).then(d => setStorage(d.data ?? null)).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-h2 sm:text-h1 font-bold">Dashboard</h1>
        <a href="/"><Button variant="primary">New Transfer</Button></a>
      </div>

      {/* Storage + Subscription cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card padding="md" elevation="sm">
          <h2 className="text-body font-semibold mb-2">Storage</h2>
          {storage && (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-h2 font-bold">{storage.usedFormatted}</span>
                <span className="text-body-sm text-[var(--text-muted)]">of {storage.maxFormatted}</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-nigerian-green rounded-full transition-all" style={{ width: `${Math.min(storage.percentage, 100)}%` }} />
              </div>
            </>
          )}
        </Card>

        <Card padding="md" elevation="sm">
          <h2 className="text-body font-semibold mb-2">Plan</h2>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={storage?.tier === "PRO" ? "pro" : storage?.tier === "BUSINESS" ? "business" : "free"}>
              {storage?.tier ?? "FREE"}
            </Badge>
          </div>
          {storage?.tier === "FREE" && (
            <a href="/pricing"><Button variant="gold" size="sm">Upgrade</Button></a>
          )}
        </Card>
      </div>

      {/* Transfers list */}
      <h2 className="text-h3 font-bold mb-4">My Transfers</h2>
      {transfers.length === 0 ? (
        <Card padding="lg" elevation="sm" className="text-center">
          <p className="text-body text-[var(--text-secondary)] mb-4">No transfers yet.</p>
          <a href="/"><Button variant="primary">Send your first file</Button></a>
        </Card>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => (
            <Card key={t.id} padding="md" elevation="sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium">{t.fileCount} file{t.fileCount !== 1 ? "s" : ""}</span>
                    <Badge variant={t.status === "ACTIVE" ? "pro" : "default"}>{t.status}</Badge>
                  </div>
                  <p className="text-caption-style text-[var(--text-muted)] break-words">
                    {formatBytes(t.totalSizeBytes)} · {t.downloadCount}/{t.downloadLimit} downloads · Expires {new Date(t.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/d/${t.shortCode}`); toast.success("Copied!", "Link copied to clipboard"); }}>
                    Copy Link
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
