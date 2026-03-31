"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Helper text displayed below the input (when no error) */
  helperText?: string;
  /** Whether the input has an error state */
  hasError?: boolean;
  /** Icon to render inside the input on the left */
  leftIcon?: React.ReactNode;
  /** Icon to render inside the input on the right */
  rightIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Input component with NaijaTransfer design tokens.
 *
 * Supports text, email, password types with validation states.
 * 44px minimum height for touch target compliance (NFR21).
 * Focus ring uses Nigerian green.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      hasError,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-") || "field"}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const showError = hasError || !!error;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-style text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full min-h-[44px] px-3 py-2",
              "rounded-[var(--radius-md)]",
              "border bg-[var(--input-bg)] text-[var(--text-primary)]",
              "placeholder:text-[var(--text-muted)]",
              "transition-colors duration-150",
              showError
                ? "border-error-red focus:border-error-red focus:ring-2 focus:ring-error-red/20"
                : "border-[var(--border-color)] focus:border-nigerian-green focus:ring-2 focus:ring-nigerian-green/20",
              "focus:outline-none",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              className
            )}
            aria-invalid={showError}
            aria-describedby={
              showError ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>
        {showError && error && (
          <p
            id={errorId}
            className="text-caption-style text-error-red"
            role="alert"
          >
            {error}
          </p>
        )}
        {!showError && helperText && (
          <p id={helperId} className="text-caption-style text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export default Input;
