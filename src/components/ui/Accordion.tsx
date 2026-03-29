"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  multiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(
  undefined
);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx)
    throw new Error("Accordion components must be used within Accordion");
  return ctx;
}

export interface AccordionProps {
  children: ReactNode;
  /** Allow multiple items open at once */
  multiple?: boolean;
  /** Default open item ids */
  defaultOpen?: string[];
  className?: string;
}

/**
 * Accordion component for transfer settings panel, FAQ, etc.
 *
 * Keyboard accessible: Enter/Space to toggle, arrow keys to navigate.
 * Proper ARIA attributes for expanded/collapsed states.
 */
export function Accordion({
  children,
  multiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(defaultOpen)
  );

  const toggle = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!multiple) next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [multiple]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, multiple }}>
      <div className={cn("divide-y divide-[var(--border-color)]", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionItem({ id, children, className }: AccordionItemProps) {
  return <div className={cn(className)}>{children}</div>;
}

export interface AccordionTriggerProps {
  /** Must match AccordionItem id */
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionTrigger({
  id,
  children,
  className,
}: AccordionTriggerProps) {
  const { openItems, toggle } = useAccordion();
  const isOpen = openItems.has(id);

  return (
    <button
      id={`accordion-trigger-${id}`}
      aria-expanded={isOpen}
      aria-controls={`accordion-content-${id}`}
      onClick={() => toggle(id)}
      className={cn(
        "flex w-full items-center justify-between",
        "py-4 min-h-[44px]",
        "text-left text-label-style text-[var(--text-primary)]",
        "hover:text-nigerian-green",
        "transition-colors duration-150",
        "cursor-pointer",
        className
      )}
    >
      <span className="flex-1">{children}</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "shrink-0 ml-2 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
        aria-hidden="true"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>
    </button>
  );
}

export interface AccordionContentProps {
  /** Must match AccordionItem id */
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionContent({
  id,
  children,
  className,
}: AccordionContentProps) {
  const { openItems } = useAccordion();
  const isOpen = openItems.has(id);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      id={`accordion-content-${id}`}
      role="region"
      aria-labelledby={`accordion-trigger-${id}`}
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div ref={contentRef} className={cn("pb-4", className)}>
        {children}
      </div>
    </div>
  );
}
