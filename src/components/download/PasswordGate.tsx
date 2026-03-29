"use client";

import { useState, useCallback, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface PasswordGateProps {
  /** Called when the user submits a password */
  onSubmit: (password: string) => Promise<boolean>;
  /** Maximum attempts allowed (NFR10: 5 per minute per IP) */
  maxAttempts?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PasswordGate blocks access to transfer details until the correct password is entered.
 *
 * Shows: lock icon, password input, unlock button, attempts remaining counter.
 * Rate limited: 5 attempts per minute per IP (enforced server-side, displayed client-side).
 * After max attempts: "Too many attempts. Try again in 1 minute."
 *
 * No file details, names, or sender info visible until password verified (FR11).
 */
export default function PasswordGate({
  onSubmit,
  maxAttempts = 5,
  className,
}: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const attemptsRemaining = maxAttempts - attempts;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (locked || !password.trim()) return;

      setLoading(true);
      setError("");

      try {
        const success = await onSubmit(password);
        if (!success) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);

          if (newAttempts >= maxAttempts) {
            setLocked(true);
            setError("Too many attempts. Try again in 1 minute.");

            // Auto-unlock after 1 minute
            setTimeout(() => {
              setLocked(false);
              setAttempts(0);
              setError("");
            }, 60000);
          } else {
            setError("Incorrect password. Please try again.");
          }
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [password, attempts, maxAttempts, locked, onSubmit]
  );

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[60vh] px-4",
        className
      )}
    >
      <Card
        padding="lg"
        elevation="lg"
        className="w-full max-w-sm text-center"
      >
        {/* Lock icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-charcoal-50 dark:bg-charcoal-600 mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-muted)]"
            aria-hidden="true"
          >
            <rect x="6" y="13" width="16" height="12" rx="2" />
            <path d="M10 13V9a4 4 0 018 0v4" />
          </svg>
        </div>

        <h2 className="text-h2 mb-1">This transfer is password protected</h2>
        <p className="text-body-sm text-[var(--text-secondary)] mb-6">
          Enter the password to access the files.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            hasError={!!error}
            disabled={locked}
            aria-label="Transfer password"
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={locked || !password.trim()}
          >
            Unlock Files
          </Button>
        </form>

        {/* Attempts counter */}
        {attempts > 0 && !locked && (
          <p className="text-caption-style text-[var(--text-muted)] mt-4">
            Attempts remaining: {attemptsRemaining} of {maxAttempts}
          </p>
        )}
      </Card>
    </div>
  );
}
