"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { LightweightModeProvider } from "@/contexts/LightweightContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";

/**
 * Client-side provider tree for the entire application.
 *
 * Wraps all pages with:
 * - ThemeProvider: dark mode (class strategy) with system detect + manual toggle + localStorage
 * - LightweightModeProvider: data-saving mode, auto-enabled on mobile (FR58)
 * - ToastProvider: notification system with auto-dismiss
 *
 * ToastContainer is rendered here so notifications display globally.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LightweightModeProvider>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </LightweightModeProvider>
    </ThemeProvider>
  );
}
