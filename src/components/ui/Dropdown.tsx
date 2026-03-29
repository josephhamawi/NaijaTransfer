"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Available options */
  options: DropdownOption[];
  /** Currently selected value */
  value: string;
  /** Called when selection changes */
  onChange: (value: string) => void;
  /** Label text */
  label?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Dropdown select component for expiry selection, download limit, etc.
 *
 * Keyboard accessible: arrow keys, Enter to select, Escape to close.
 * 44px minimum height for touch targets.
 * Proper ARIA listbox/option roles.
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      placeholder = "Select...",
      helperText,
      error,
      disabled = false,
      fullWidth = true,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((o) => o.value === value);
    const showError = !!error;
    const dropdownId = `dropdown-${label?.toLowerCase().replace(/\s+/g, "-") || "select"}`;

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
          if (
            e.key === "Enter" ||
            e.key === " " ||
            e.key === "ArrowDown"
          ) {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex(
              options.findIndex((o) => o.value === value)
            );
          }
          return;
        }

        const enabledOptions = options.filter((o) => !o.disabled);

        switch (e.key) {
          case "ArrowDown": {
            e.preventDefault();
            setHighlightedIndex((prev) => {
              const next = prev + 1;
              return next < options.length ? next : 0;
            });
            break;
          }
          case "ArrowUp": {
            e.preventDefault();
            setHighlightedIndex((prev) => {
              const next = prev - 1;
              return next >= 0 ? next : options.length - 1;
            });
            break;
          }
          case "Enter":
          case " ": {
            e.preventDefault();
            const opt = options[highlightedIndex];
            if (opt && !opt.disabled) {
              onChange(opt.value);
              setIsOpen(false);
            }
            break;
          }
          case "Home": {
            e.preventDefault();
            setHighlightedIndex(0);
            break;
          }
          case "End": {
            e.preventDefault();
            setHighlightedIndex(options.length - 1);
            break;
          }
        }
      },
      [isOpen, disabled, options, value, highlightedIndex, onChange]
    );

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn("relative", fullWidth && "w-full", className)}
      >
        {label && (
          <label
            id={`${dropdownId}-label`}
            className="block text-label-style text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Trigger button */}
        <button
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${dropdownId}-list`}
          aria-labelledby={label ? `${dropdownId}-label` : undefined}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex w-full items-center justify-between",
            "min-h-[44px] px-3 py-2",
            "rounded-[var(--radius-md)]",
            "border bg-[var(--input-bg)] text-[var(--text-primary)]",
            "text-left",
            "transition-colors duration-150",
            "cursor-pointer",
            showError
              ? "border-error-red"
              : "border-[var(--border-color)] focus:border-nigerian-green",
            "focus:ring-2",
            showError
              ? "focus:ring-error-red/20"
              : "focus:ring-nigerian-green/20",
            "focus:outline-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              !selectedOption && "text-[var(--text-muted)]"
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={cn(
              "shrink-0 ml-2 text-[var(--text-muted)] transition-transform",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <ul
            ref={listRef}
            id={`${dropdownId}-list`}
            role="listbox"
            aria-labelledby={label ? `${dropdownId}-label` : undefined}
            className={cn(
              "absolute z-50 w-full mt-1",
              "max-h-60 overflow-y-auto",
              "rounded-[var(--radius-md)]",
              "border border-[var(--border-color)]",
              "bg-[var(--bg-elevated)]",
              "shadow-md",
              "py-1"
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                className={cn(
                  "flex items-center px-3 py-2.5 min-h-[40px]",
                  "text-body-sm cursor-pointer",
                  "transition-colors duration-75",
                  option.value === value && "font-semibold text-nigerian-green",
                  option.disabled
                    ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
                    : index === highlightedIndex
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
                )}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M3.5 8.5L6 11l6.5-6.5" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}

        {showError && error && (
          <p className="text-caption-style text-error-red mt-1" role="alert">
            {error}
          </p>
        )}
        {!showError && helperText && (
          <p className="text-caption-style text-[var(--text-muted)] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
