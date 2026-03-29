"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types";

const icons: Record<ThemeMode, React.ReactNode> = {
  light: (
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
      <circle cx="10" cy="10" r="4" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
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
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  ),
  system: (
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
      <rect x="3" y="3" width="14" height="10" rx="2" />
      <path d="M7 16h6M10 13v3" />
    </svg>
  ),
};

const labels: Record<ThemeMode, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

/**
 * ThemeToggle cycles through light -> dark -> system modes.
 *
 * Shows sun icon (light), moon icon (dark), or monitor icon (system).
 * 44px touch target, keyboard accessible.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, cycleMode } = useTheme();

  return (
    <button
      onClick={cycleMode}
      className={cn(
        "flex items-center justify-center",
        "w-11 h-11 min-w-[44px] min-h-[44px]",
        "rounded-[var(--radius-md)]",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
        "transition-colors duration-150",
        className
      )}
      aria-label={`Theme: ${labels[mode]}. Click to change.`}
      title={labels[mode]}
    >
      {icons[mode]}
    </button>
  );
}

export default ThemeToggle;
