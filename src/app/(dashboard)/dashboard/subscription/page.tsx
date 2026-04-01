"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";

interface SubscriptionData {
  tier: string;
  planStart: string | null;
  planEnd: string | null;
  paystackSubCode: string | null;
  pricing: { PRO: string; BUSINESS: string };
}

const tierInfo: Record<string, { label: string; features: string[] }> = {
  FREE: {
    label: "Free",
    features: ["4 GB per transfer", "7-day expiry", "50 downloads", "10 transfers/day"],
  },
  PRO: {
    label: "Pro",
    features: ["10 GB per transfer", "30-day expiry", "250 downloads", "100 transfers/day", "No ads"],
  },
  BUSINESS: {
    label: "Business",
    features: ["50 GB per transfer", "60-day expiry", "Unlimited downloads", "500 transfers/day", "Custom branding"],
  },
};

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionPageInner />
    </Suspense>
  );
}

function SubscriptionPageInner() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      toast.success("Subscription active!", "Your plan has been upgraded. Welcome aboard!");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/user/subscription")
      .then((r) => r.json())
      .then((d) => setSub(d.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleUpgrade(plan: "PRO" | "BUSINESS") {
    setUpgrading(plan);
    try {
      const res = await authFetch("/api/user/subscription", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Upgrade failed", data.error?.message || "Please try again.");
        return;
      }
      window.location.href = data.data.checkoutUrl;
    } catch {
      toast.error("Error", "Failed to start checkout.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await authFetch("/api/user/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Cancel failed", data.error?.message || "Please try again.");
        return;
      }
      toast.success("Subscription cancelled", "You've been moved to the Free plan.");
      setSub((prev) => prev ? { ...prev, tier: "FREE", paystackSubCode: null } : null);
      setShowCancelConfirm(false);
    } catch {
      toast.error("Error", "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-h2 sm:text-h1 font-bold mb-8">Subscription</h1>
        <Card padding="lg" elevation="sm" className="animate-pulse">
          <div className="h-6 w-32 bg-[var(--bg-secondary)] rounded mb-4" />
          <div className="h-4 w-48 bg-[var(--bg-secondary)] rounded" />
        </Card>
      </div>
    );
  }

  const currentTier = sub?.tier || "FREE";
  const info = tierInfo[currentTier] || tierInfo.FREE;
  const isPaid = currentTier !== "FREE";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-h2 sm:text-h1 font-bold mb-8">Subscription</h1>

      {/* Current plan */}
      <Card padding="lg" elevation="sm" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-bold">Current Plan</h2>
          <Badge variant={currentTier === "PRO" ? "pro" : currentTier === "BUSINESS" ? "business" : "free"}>
            {info.label}
          </Badge>
        </div>

        <ul className="space-y-2 mb-4">
          {info.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-body-sm text-[var(--text-secondary)]">
              <svg className="w-4 h-4 text-nigerian-green shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {isPaid && sub?.planEnd && (
          <p className="text-body-sm text-[var(--text-muted)]">
            {sub.paystackSubCode ? "Renews" : "Expires"} on{" "}
            {new Date(sub.planEnd).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </Card>

      {/* Upgrade options */}
      {currentTier === "FREE" && (
        <Card padding="lg" elevation="sm" className="mb-6">
          <h2 className="text-h3 font-bold mb-4">Upgrade</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={!!upgrading}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-nigerian-green bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left disabled:opacity-50"
            >
              <Badge variant="pro" className="mb-2">Pro</Badge>
              <span className="text-h3 font-bold">{sub?.pricing?.PRO || "₦2,000"}</span>
              <span className="text-body-sm text-[var(--text-muted)]">/month</span>
              <span className="text-body-sm text-[var(--text-secondary)] mt-2">10 GB transfers, no ads</span>
              {upgrading === "PRO" && <span className="text-body-sm text-nigerian-green mt-1">Redirecting...</span>}
            </button>

            <button
              onClick={() => handleUpgrade("BUSINESS")}
              disabled={!!upgrading}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-gold bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left disabled:opacity-50"
            >
              <Badge variant="business" className="mb-2">Business</Badge>
              <span className="text-h3 font-bold">{sub?.pricing?.BUSINESS || "₦10,000"}</span>
              <span className="text-body-sm text-[var(--text-muted)]">/month</span>
              <span className="text-body-sm text-[var(--text-secondary)] mt-2">50 GB, custom branding, API</span>
              {upgrading === "BUSINESS" && <span className="text-body-sm text-gold mt-1">Redirecting...</span>}
            </button>
          </div>
        </Card>
      )}

      {currentTier === "PRO" && (
        <Card padding="lg" elevation="sm" className="mb-6">
          <h2 className="text-h3 font-bold mb-4">Upgrade to Business</h2>
          <p className="text-body-sm text-[var(--text-secondary)] mb-4">
            Get 50 GB transfers, unlimited downloads, custom branding, and API access.
          </p>
          <Button
            variant="gold"
            loading={upgrading === "BUSINESS"}
            disabled={!!upgrading}
            onClick={() => handleUpgrade("BUSINESS")}
          >
            Upgrade to Business — {sub?.pricing?.BUSINESS || "₦10,000"}/mo
          </Button>
        </Card>
      )}

      {/* Cancel subscription */}
      {isPaid && sub?.paystackSubCode && (
        <Card padding="lg" elevation="sm">
          {showCancelConfirm ? (
            <>
              <h2 className="text-h3 font-bold mb-2">Cancel subscription?</h2>
              <p className="text-body-sm text-[var(--text-secondary)] mb-4">
                You&apos;ll lose access to {info.label} features immediately. Active transfers will remain available until their expiry date.
              </p>
              <div className="flex gap-3">
                <Button variant="danger" loading={cancelling} onClick={handleCancel}>
                  Yes, cancel
                </Button>
                <Button variant="outline" disabled={cancelling} onClick={() => setShowCancelConfirm(false)}>
                  Keep my plan
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-h3 font-bold mb-2">Manage Subscription</h2>
              <p className="text-body-sm text-[var(--text-secondary)] mb-4">
                Need to cancel? You can cancel anytime with no penalties.
              </p>
              <Button variant="outline" onClick={() => setShowCancelConfirm(true)}>
                Cancel subscription
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
