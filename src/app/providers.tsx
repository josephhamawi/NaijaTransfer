"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LightweightModeProvider } from "@/contexts/LightweightContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LightweightModeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </LightweightModeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
