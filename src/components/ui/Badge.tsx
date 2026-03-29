"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  free: "bg-charcoal-50 text-charcoal-400 dark:bg-charcoal-600 dark:text-charcoal-100",
  pro: "bg-green-50 text-nigerian-green border border-nigerian-green dark:bg-green-900/30 dark:text-green-100 dark:border-green-700",
  business:
    "bg-gold-100 text-gold-600 border border-gold dark:bg-[var(--gold-bg)] dark:text-gold dark:border-gold-600",
  default:
    "bg-charcoal-50 text-[var(--text-secondary)] dark:bg-charcoal-600 dark:text-charcoal-100",
};

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-caption px-2 py-1",
};

/**
 * Badge component for tier labels and status indicators.
 *
 * Variants: free, pro, business, default
 * Used for tier badges on pricing cards, user profiles, etc.
 */
export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        "rounded-[var(--radius-sm)]",
        "leading-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
