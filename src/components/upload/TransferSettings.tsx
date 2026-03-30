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
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";

export interface TransferSettingsValues {
  expiryDays: number;
  downloadLimit: number;
  password: string;
  message: string;
}

export interface TransferSettingsProps {
  /** Current settings values */
  values: TransferSettingsValues;
  /** Called when any setting changes */
  onChange: (values: TransferSettingsValues) => void;
  /** Maximum allowed expiry days (tier-dependent) */
  maxExpiryDays?: number;
  /** Maximum allowed download limit (tier-dependent) */
  maxDownloadLimit?: number | null;
  /** Whether the form is disabled (e.g., during upload) */
  disabled?: boolean;
  /** User's tier for showing upgrade prompts */
  tier?: "free" | "pro" | "business";
  /** Additional CSS classes */
  className?: string;
}

/**
 * TransferSettings: expandable accordion for transfer configuration (UX-DR7).
 *
 * Contains: expiry dropdown, download limit, password toggle + input, message textarea.
 * Shows upgrade prompts for tier-limited options.
 * Collapsed by default to keep the upload widget minimal.
 */
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

  // Build expiry options based on tier
  const expiryOptions: DropdownOption[] = [];
  const expiryValues = [1, 3, 7, 14, 30, 60];
  for (const days of expiryValues) {
    expiryOptions.push({
      value: String(days),
      label: `${days} ${days === 1 ? "day" : "days"}`,
      disabled: days > maxExpiryDays,
    });
  }

  // Build download limit options
  const limitOptions: DropdownOption[] = [
    { value: "10", label: "10 downloads" },
    { value: "25", label: "25 downloads" },
    { value: "50", label: "50 downloads" },
    {
      value: "100",
      label: "100 downloads",
      disabled: maxDownloadLimit !== null && maxDownloadLimit < 100,
    },
    {
      value: "250",
      label: "250 downloads",
      disabled: maxDownloadLimit !== null && maxDownloadLimit < 250,
    },
    {
      value: "10000",
      label: "Unlimited",
      disabled: maxDownloadLimit !== null,
    },
  ];

  const handleChange = (key: keyof TransferSettingsValues, value: string | number) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className={cn(disabled && "opacity-60 pointer-events-none", className)}>
      <Accordion defaultOpen={[]}>
        <AccordionItem id="settings">
          <AccordionTrigger id="settings">
            <span className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="3" />
                <path d="M14 8a6 6 0 01-.87 3.13l-1.52-.88a3.97 3.97 0 000-4.5l1.52-.88A6 6 0 0114 8zM2 8a6 6 0 01.87-3.13l1.52.88a3.97 3.97 0 000 4.5l-1.52.88A6 6 0 012 8z" />
              </svg>
              Settings
            </span>
          </AccordionTrigger>
          <AccordionContent id="settings">
            <div className="space-y-4">
              {/* Expiry */}
              <Dropdown
                label="Expires after"
                options={expiryOptions}
                value={String(values.expiryDays)}
                onChange={(v) => handleChange("expiryDays", parseInt(v, 10))}
                helperText={
                  tier === "free" && maxExpiryDays <= 7
                    ? "Longer expiry available with Pro"
                    : undefined
                }
              />

              {/* Download limit */}
              <Dropdown
                label="Download limit"
                options={limitOptions}
                value={String(values.downloadLimit)}
                onChange={(v) =>
                  handleChange("downloadLimit", parseInt(v, 10))
                }
              />

              {/* Password protection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-label-style text-[var(--text-primary)]">
                    Password protection
                  </label>
                  {/* 44px touch target wrapper for accessibility */}
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
                        passwordEnabled
                          ? "bg-nigerian-green"
                          : "bg-[var(--border-color)]"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
                          "transition-transform duration-200",
                          passwordEnabled ? "translate-x-[22px]" : "translate-x-[3px]"
                        )}
                      />
                    </button>
                  </div>
                </div>
                {passwordEnabled && (
                  <Input
                    type="password"
                    placeholder="Enter a password"
                    value={values.password}
                    onChange={(e) =>
                      handleChange("password", e.target.value)
                    }
                    aria-label="Transfer password"
                  />
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-label-style text-[var(--text-primary)] mb-1.5">
                  Message (optional)
                </label>
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
    </div>
  );
}
