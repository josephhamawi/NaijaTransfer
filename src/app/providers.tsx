"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LightweightModeProvider } from "@/contexts/LightweightContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LightweightModeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </LightweightModeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
