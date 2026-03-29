"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onClose: () => void;
  /** Dialog title for accessibility */
  title: string;
  /** Optional description */
  description?: string;
  /** Width preset */
  size?: "sm" | "md" | "lg" | "full";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-[calc(100vw-32px)] md:max-w-2xl",
};

/**
 * Dialog/Modal component for file preview, confirmations, etc.
 *
 * Accessible: focus trap, Escape key close, ARIA attributes.
 * Click outside backdrop to close.
 * 44px close button for touch targets.
 */
const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      size = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    // Lock body scroll when open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    // Focus trap: focus the dialog when opened
    useEffect(() => {
      if (open && dialogRef.current) {
        dialogRef.current.focus();
      }
    }, [open]);

    const handleBackdropClick = useCallback(
      (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose]
    );

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Dialog panel */}
        <div
          ref={(node) => {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          aria-describedby={description ? "dialog-description" : undefined}
          tabIndex={-1}
          className={cn(
            "relative z-10 w-full",
            "rounded-[var(--radius-lg)]",
            "bg-[var(--bg-elevated)] border border-[var(--border-color)]",
            "shadow-xl",
            "p-6",
            "focus:outline-none",
            "max-h-[90vh] overflow-y-auto",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-3 right-3",
              "flex items-center justify-center",
              "w-11 h-11 min-w-[44px] min-h-[44px]",
              "rounded-[var(--radius-md)]",
              "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
              "transition-colors"
            )}
            aria-label="Close dialog"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-h2 pr-10 mb-1">{title}</h2>

          {/* Description */}
          {description && (
            <p
              id="dialog-description"
              className="text-body-sm text-[var(--text-secondary)] mb-4"
            >
              {description}
            </p>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    );
  }
);

Dialog.displayName = "Dialog";

export { Dialog };
export default Dialog;
