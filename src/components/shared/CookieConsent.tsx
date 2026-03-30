"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("nt-cookies-accepted");
    if (!accepted) {
      // Small delay so it doesn't flash on first paint
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("nt-cookies-accepted", "true");
    setShow(false);
  }

  function decline() {
    localStorage.setItem("nt-cookies-accepted", "essential");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "p-4 md:p-0 md:bottom-4 md:left-4 md:right-auto md:max-w-md",
        "animate-in slide-in-from-bottom duration-500"
      )}
    >
      <div
        className={cn(
          "bg-charcoal-800 text-white rounded-2xl",
          "border border-white/10",
          "shadow-2xl shadow-black/40",
          "p-5"
        )}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-xl shrink-0">🍪</span>
          <div>
            <h3 className="text-sm font-semibold mb-1">We value your privacy</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              We use essential cookies to make NaijaTransfer work and analytics cookies to improve your experience. No tracking, no ads cookies.{" "}
              <a href="/privacy" className="text-nigerian-green hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={decline}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={accept}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-nigerian-green hover:bg-nigerian-green/90 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
