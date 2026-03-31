"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface TransferSettingsValues {
  expiryDays: number;
  downloadLimit: number;
  password: string;
  message: string;
}

export interface TransferSettingsProps {
  values: TransferSettingsValues;
  onChange: (values: TransferSettingsValues) => void;
  maxExpiryDays?: number;
  maxDownloadLimit?: number | null;
  disabled?: boolean;
  tier?: "free" | "pro" | "business";
  className?: string;
}

export default function TransferSettings({
  values,
  onChange,
  maxExpiryDays = 7,
  maxDownloadLimit = 50,
  disabled = false,
  tier = "free",
  className,
}: TransferSettingsProps) {
  const [passwordEnabled, setPasswordEnabled] = useState(!!values.password);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  const expiryValues = [1, 3, 7, 14, 30, 60];
  const limitValues = [
    { value: 1, label: "1" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
    { value: 250, label: "250" },
    { value: 10000, label: "∞" },
  ];

  const handleChange = (key: keyof TransferSettingsValues, value: string | number) => {
    onChange({ ...values, [key]: value });
  };

  function promptUpgrade(feature: string) {
    setUpgradeFeature(feature);
    setShowUpgradeModal(true);
  }

  return (
    <div className={cn(disabled && "opacity-60 pointer-events-none", className)}>
      <Accordion defaultOpen={[]}>
        <AccordionItem id="settings">
          <AccordionTrigger id="settings">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="3" />
                <path d="M14 8a6 6 0 01-.87 3.13l-1.52-.88a3.97 3.97 0 000-4.5l1.52-.88A6 6 0 0114 8zM2 8a6 6 0 01.87-3.13l1.52.88a3.97 3.97 0 000 4.5l-1.52.88A6 6 0 012 8z" />
              </svg>
              Settings
            </span>
          </AccordionTrigger>
          <AccordionContent id="settings">
            <div className="space-y-3">
              {/* Expiry */}
              <div>
                <label className="block text-label-style text-[var(--text-primary)] mb-1.5">Expires after</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {expiryValues.map((days) => {
                    const locked = days > maxExpiryDays;
                    const selected = values.expiryDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            promptUpgrade(`${days}-day expiry`);
                          } else {
                            handleChange("expiryDays", days);
                          }
                        }}
                        className={cn(
                          "relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all",
                          selected && !locked
                            ? "bg-nigerian-green text-white font-semibold shadow-sm"
                            : locked
                              ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-elevated)]"
                              : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        )}
                      >
                        {locked && <LockIcon />}
                        {days}d
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Download limit */}
              <div>
                <label className="block text-label-style text-[var(--text-primary)] mb-1.5">Download limit</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {limitValues.map(({ value, label }) => {
                    const locked = maxDownloadLimit !== null && value > maxDownloadLimit;
                    const selected = values.downloadLimit === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            promptUpgrade(`${label}`);
                          } else {
                            handleChange("downloadLimit", value);
                          }
                        }}
                        className={cn(
                          "relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-sm transition-all",
                          selected && !locked
                            ? "bg-nigerian-green text-white font-semibold shadow-sm"
                            : locked
                              ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-elevated)]"
                              : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        )}
                      >
                        {locked && <LockIcon />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password protection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-label-style text-[var(--text-primary)]">Password protection</label>
                  <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={passwordEnabled}
                      onClick={() => {
                        const next = !passwordEnabled;
                        setPasswordEnabled(next);
                        if (!next) handleChange("password", "");
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
                        "transition-colors duration-200",
                        passwordEnabled ? "bg-nigerian-green" : "bg-[var(--border-color)]"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
                        "transition-transform duration-200",
                        passwordEnabled ? "translate-x-[22px]" : "translate-x-[3px]"
                      )} />
                    </button>
                  </div>
                </div>
                {passwordEnabled && (
                  <Input
                    type="password"
                    placeholder="Enter a password"
                    value={values.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    aria-label="Transfer password"
                  />
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-label-style text-[var(--text-primary)] mb-1.5">Message (optional)</label>
                <textarea
                  value={values.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Add a message for the recipient..."
                  maxLength={500}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 min-h-[44px]",
                    "rounded-[var(--radius-md)]",
                    "border border-[var(--border-color)]",
                    "bg-[var(--input-bg)] text-[var(--text-primary)]",
                    "placeholder:text-[var(--text-muted)]",
                    "focus:border-nigerian-green focus:ring-2 focus:ring-nigerian-green/20",
                    "focus:outline-none",
                    "resize-none transition-colors"
                  )}
                />
                <p className="text-caption-style text-[var(--text-muted)] mt-1 text-right">
                  {values.message.length}/500
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-full sm:max-w-sm w-full shadow-xl border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Upgrade to unlock</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                <strong>{upgradeFeature}</strong> is available on the Pro plan.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Pro Plan</p>
                  <p className="text-xs text-[var(--text-muted)]">10GB transfers, 30-day expiry, 250 downloads</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-nigerian-green">₦2,000</p>
                  <p className="text-xs text-[var(--text-muted)]">/month</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="md" fullWidth onClick={() => setShowUpgradeModal(false)}>
                Not now
              </Button>
              <a href="/pricing" className="flex-1">
                <Button variant="primary" size="md" fullWidth>
                  See plans
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
