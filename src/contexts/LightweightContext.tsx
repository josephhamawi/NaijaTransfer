"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface LightweightContextValue {
  /** Whether lightweight mode is active */
  isLightweight: boolean;
  /** Toggle lightweight mode on/off */
  toggle: () => void;
  /** Set lightweight mode explicitly */
  setLightweight: (value: boolean) => void;
}

const LightweightContext = createContext<LightweightContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "nt-lightweight-mode";
const MOBILE_BREAKPOINT = 768;

/**
 * Detect if the user prefers reduced data usage.
 * Checks the Save-Data client hint and prefers-reduced-data media query.
 */
function prefersReducedData(): boolean {
  if (typeof window === "undefined") return false;
  // Check navigator.connection.saveData (Network Information API)
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  // Check prefers-reduced-data media query (limited browser support)
  if (window.matchMedia?.("(prefers-reduced-data: reduce)").matches)
    return true;
  return false;
}

/**
 * Detect if the user is on a mobile device (by viewport width).
 */
function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function LightweightModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLightweight, setIsLightweight] = useState(false);

  // Initialize: check localStorage, then fallback to mobile/save-data detection
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsLightweight(stored === "true");
    } else {
      // FR58: Default ON for mobile
      const shouldEnable = isMobileViewport() || prefersReducedData();
      setIsLightweight(shouldEnable);
    }
  }, []);

  // Apply/remove the .lightweight class on <body>
  useEffect(() => {
    if (isLightweight) {
      document.body.classList.add("lightweight");
    } else {
      document.body.classList.remove("lightweight");
    }
  }, [isLightweight]);

  const toggle = useCallback(() => {
    setIsLightweight((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const setLightweight = useCallback((value: boolean) => {
    setIsLightweight(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const value = useMemo<LightweightContextValue>(
    () => ({ isLightweight, toggle, setLightweight }),
    [isLightweight, toggle, setLightweight]
  );

  return (
    <LightweightContext.Provider value={value}>
      {children}
    </LightweightContext.Provider>
  );
}

/**
 * Hook to check if lightweight mode is active.
 * Components use this to conditionally render thumbnails, animations, etc.
 */
export function useIsLightweight(): boolean {
  const ctx = useContext(LightweightContext);
  if (!ctx) {
    throw new Error(
      "useIsLightweight must be used within a LightweightModeProvider"
    );
  }
  return ctx.isLightweight;
}

/**
 * Hook for full lightweight mode context (includes toggle/set).
 */
export function useLightweightMode(): LightweightContextValue {
  const ctx = useContext(LightweightContext);
  if (!ctx) {
    throw new Error(
      "useLightweightMode must be used within a LightweightModeProvider"
    );
  }
  return ctx;
}
