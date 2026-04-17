"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used within Tabs");
  return ctx;
}

export interface TabsProps {
  /** Default active tab id */
  defaultTab: string;
  /** Called when the active tab changes */
  onChange?: (tabId: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Tabs component for email/link toggle on upload, dashboard sections, etc.
 *
 * Keyboard accessible: arrow keys to navigate between tabs, Enter/Space to select.
 * ARIA: proper role="tablist", role="tab", role="tabpanel" structure.
 */
export function Tabs({ defaultTab, onChange, children, className }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  const setActiveTab = useCallback(
    (id: string) => {
      setActiveTabState(id);
      onChange?.(id);
    },
    [onChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  children: ReactNode;
  className?: string;
  /** Visual variant */
  variant?: "underline" | "pill";
}

export function TabList({ children, className, variant = "pill" }: TabListProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const currentIndex = Array.from(tabs).findIndex(
      (tab) => tab === document.activeElement
    );

    let nextIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex >= 0) {
      e.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  };

  return (
    <div
      role="tablist"
      className={cn(
        "flex",
        variant === "pill" && [
          "gap-1 p-1",
          "bg-[var(--bg-secondary)] rounded-[var(--radius-md)]",
        ],
        variant === "underline" && "gap-0 border-b border-[var(--border-color)]",
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  /** Unique tab identifier */
  id: string;
  children: ReactNode;
  className?: string;
  /** Disabled tab */
  disabled?: boolean;
}

export function Tab({ id, children, className, disabled = false }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(id)}
      className={cn(
        "flex-1 px-4 py-2.5 min-h-[44px]",
        "text-label-style text-center",
        "transition-colors duration-150",
        "rounded-[var(--radius-sm)]",
        "cursor-pointer select-none",
        isActive
          ? "bg-[var(--tab-active-bg)] text-[var(--text-primary)] shadow-sm font-semibold ring-1 ring-inset ring-[var(--tab-active-ring)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  /** Must match Tab id */
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useTabs();
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={cn("mt-4 focus:outline-none", className)}
    >
      {children}
    </div>
  );
}
