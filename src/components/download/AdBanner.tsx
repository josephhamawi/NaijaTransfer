"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsLightweight } from "@/contexts/LightweightContext";

export interface AdBannerProps {
  /** Whether ads should be shown (free tier only) */
  showAds: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AdBanner component for Google AdSense banner on free-tier download pages (FR46).
 *
 * Responsive IAB sizes: 320x50 mobile, 468x60 tablet, 728x90 desktop.
 * Graceful fallback: collapses to zero height if ad fails to load (no broken layout).
 * Paid tier (FR47): not rendered at all.
 * Lightweight Mode: renders text-only or collapses.
 */
export default function AdBanner({ showAds, className }: AdBannerProps) {
  const isLightweight = useIsLightweight();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Attempt to load AdSense
  useEffect(() => {
    if (!showAds) return;

    // In a real implementation, this would initialize the AdSense ad unit.
    // For now, simulate ad loading with a placeholder.
    const timer = setTimeout(() => {
      // If AdSense is not available, mark as failed
      if (typeof window !== "undefined" && !(window as unknown as Record<string, unknown>).adsbygoogle) {
        setAdFailed(true);
      } else {
        setAdLoaded(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [showAds]);

  if (!showAds) return null;

  // If ad failed to load, collapse gracefully
  if (adFailed) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full flex items-center justify-center",
        "my-4",
        className
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      {/* Responsive ad container */}
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden",
          "rounded-[var(--radius-sm)]",
          "bg-[var(--bg-secondary)] border border-[var(--border-color)]",
          // Responsive sizes matching IAB standards
          "w-[320px] h-[50px]", // Mobile default
          "md:w-[468px] md:h-[60px]", // Tablet
          "lg:w-[728px] lg:h-[90px]" // Desktop
        )}
      >
        {/* This div is where AdSense would inject the ad */}
        {!adLoaded && (
          <span className="text-caption-style text-[var(--text-muted)]">
            {isLightweight ? "" : "Loading..."}
          </span>
        )}

        {/* AdSense slot (placeholder -- real implementation would use ins element) */}
        {/* <ins className="adsbygoogle" data-ad-client="ca-pub-XXXXX" data-ad-slot="XXXXX" /> */}
      </div>

      {/* Upgrade prompt below ad */}
      <div className="hidden">
        {/* "Remove ads with NigeriaTransfer Pro" -- rendered by parent component */}
      </div>
    </div>
  );
}
