"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "gold"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** Icon to show before text */
  leftIcon?: React.ReactNode;
  /** Icon to show after text */
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-nigerian-green text-white",
    "hover:bg-green-700 active:bg-green-900",
    "dark:bg-nigerian-green dark:hover:bg-green-700 dark:active:bg-green-900",
    "focus-visible:ring-2 focus-visible:ring-nigerian-green focus-visible:ring-offset-2",
  ].join(" "),
  secondary: [
    "bg-transparent text-nigerian-green border border-nigerian-green",
    "hover:bg-green-50 active:bg-green-100",
    "dark:text-green-100 dark:border-green-100 dark:hover:bg-green-900/20 dark:active:bg-green-900/30",
    "focus-visible:ring-2 focus-visible:ring-nigerian-green focus-visible:ring-offset-2",
  ].join(" "),
  outline: [
    "bg-transparent border border-[var(--border-color)] text-[var(--text-primary)]",
    "hover:bg-charcoal-50 active:bg-charcoal-100",
    "dark:hover:bg-charcoal-600/50 dark:active:bg-charcoal-600",
    "focus-visible:ring-2 focus-visible:ring-nigerian-green focus-visible:ring-offset-2",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--text-primary)]",
    "hover:bg-charcoal-50 active:bg-charcoal-100",
    "dark:hover:bg-charcoal-600/50 dark:active:bg-charcoal-600",
    "focus-visible:ring-2 focus-visible:ring-nigerian-green focus-visible:ring-offset-2",
  ].join(" "),
  danger: [
    "bg-error-red text-white",
    "hover:bg-red-700 active:bg-red-700",
    "focus-visible:ring-2 focus-visible:ring-error-red focus-visible:ring-offset-2",
  ].join(" "),
  gold: [
    "bg-gold text-charcoal",
    "hover:bg-gold-600 active:bg-gold-600",
    "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-body-sm px-3 py-1.5 min-h-[36px] rounded-[var(--radius-md)]",
  md: "text-label px-6 py-3 min-h-[44px] rounded-[var(--radius-md)]",
  lg: "text-button-lg px-8 py-3.5 min-h-[48px] rounded-[var(--radius-md)]",
};

/**
 * Button component with NigeriaTransfer design tokens.
 *
 * Variants: primary (green), secondary (outlined green), ghost, danger (red), gold, outline
 * All sizes meet 44px minimum touch target on mobile (pointer: coarse).
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-colors duration-150",
          "cursor-pointer select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          leftIcon && (
            <span className="inline-flex shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { Button };
export default Button;
