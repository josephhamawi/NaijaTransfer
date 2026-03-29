"use client";

import { useLightweightMode } from "@/contexts/LightweightContext";
import { cn } from "@/lib/utils";

/**
 * LightweightToggle sits in the header. Shows a leaf icon when lightweight is OFF
 * (prompting to "go light"), and an image icon when ON (prompting to "go rich").
 *
 * A small green dot badge indicates when lightweight/data-saving mode is active.
 * 44px touch target, keyboard accessible.
 */
export function LightweightToggle({ className }: { className?: string }) {
  const { isLightweight, toggle } = useLightweightMode();

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative flex items-center justify-center",
        "w-11 h-11 min-w-[44px] min-h-[44px]",
        "rounded-[var(--radius-md)]",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
        "transition-colors duration-150",
        className
      )}
      aria-label={
        isLightweight
          ? "Lightweight mode on. Click for full experience with artwork."
          : "Full mode. Click for lightweight mode to save data."
      }
      aria-pressed={isLightweight}
      title={
        isLightweight
          ? "Full experience: shows artwork"
          : "Lightweight mode: saves data"
      }
    >
      {isLightweight ? (
        /* Image icon - when lightweight is ON, show "go rich" */
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="16" height="14" rx="2" />
          <circle cx="7" cy="8" r="1.5" />
          <path d="M18 13l-4-4-6 6" />
          <path d="M2 17l6-6 3 3" />
        </svg>
      ) : (
        /* Leaf icon - when lightweight is OFF, show "go light" */
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 3c-3 0-7 1-9 5-2 4-2 9-2 9s5 0 9-2c4-2 5-6 5-9 0-1-1-3-3-3z" />
          <path d="M3 17C6 14 8 11 8 8" />
        </svg>
      )}

      {/* Green dot indicator when lightweight mode is active */}
      {isLightweight && (
        <span
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-nigerian-green rounded-full border-2 border-[var(--bg-primary)]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default LightweightToggle;
