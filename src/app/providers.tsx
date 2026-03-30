"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LightweightModeProvider } from "@/contexts/LightweightContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";
import CookieConsent from "@/components/shared/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LightweightModeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
            <CookieConsent />
          </ToastProvider>
        </LightweightModeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
