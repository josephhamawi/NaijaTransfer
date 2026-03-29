"use client";

import { useEffect, useState } from "react";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types";

// CSS gradient wallpapers — no images needed, zero network cost, instant load.
// Replace with real Nigerian art images once sourced.
const PLACEHOLDER_WALLPAPERS: (Wallpaper & { gradient: string })[] = [
  {
    id: "1",
    imageUrl: "",
    gradient: "linear-gradient(135deg, #008751 0%, #1A1A2E 50%, #006341 100%)",
    artistName: "NigeriaTransfer",
    artworkTitle: "Lagos Nights",
    artistUrl: "#",
  },
  {
    id: "2",
    imageUrl: "",
    gradient: "linear-gradient(160deg, #0a2e1a 0%, #008751 40%, #FFD700 100%)",
    artistName: "NigeriaTransfer",
    artworkTitle: "Niger Delta Gold",
    artistUrl: "#",
  },
  {
    id: "3",
    imageUrl: "",
    gradient: "linear-gradient(120deg, #1A1A2E 0%, #2d1a4e 30%, #008751 70%, #004d30 100%)",
    artistName: "NigeriaTransfer",
    artworkTitle: "Ankara Rhythms",
    artistUrl: "#",
  },
  {
    id: "4",
    imageUrl: "",
    gradient: "radial-gradient(ellipse at 20% 50%, #008751 0%, #1A1A2E 60%, #0a0a14 100%)",
    artistName: "NigeriaTransfer",
    artworkTitle: "Zuma Rock",
    artistUrl: "#",
  },
];

export interface BackgroundWallpaperProps {
  /** Override wallpaper data (e.g., custom branding for Business tier) */
  wallpaper?: Wallpaper;
  /** Show the artist credit bar at the bottom */
  showCredit?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BackgroundWallpaper renders a full-bleed rotating Nigerian art background.
 *
 * In Lightweight Mode: renders nothing (solid bg-primary shown via body bg).
 * In Full Mode: shows full-viewport background image with lazy loading,
 * crossfade transition, and artist credit bar (FR56, FR61).
 *
 * Wallpaper images are expected to be cached at CDN with 24h TTL.
 */
export default function BackgroundWallpaper({
  wallpaper: overrideWallpaper,
  showCredit = true,
  className,
}: BackgroundWallpaperProps) {
  const isLightweight = useIsLightweight();
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper | null>(
    overrideWallpaper || null
  );
  const [imageLoaded, setImageLoaded] = useState(false);

  const [gradient, setGradient] = useState<string>("");

  // Select a random wallpaper on mount if none provided
  useEffect(() => {
    if (overrideWallpaper) {
      setCurrentWallpaper(overrideWallpaper);
      return;
    }
    const randomIndex = Math.floor(
      Math.random() * PLACEHOLDER_WALLPAPERS.length
    );
    const selected = PLACEHOLDER_WALLPAPERS[randomIndex];
    setCurrentWallpaper(selected);
    setGradient(selected.gradient);
    if (!selected.imageUrl) setImageLoaded(true); // Gradient needs no loading
  }, [overrideWallpaper]);

  // In lightweight mode, render nothing -- body bg-primary is the background
  if (isLightweight) return null;

  if (!currentWallpaper) return null;

  return (
    <div
      className={cn("wallpaper-bg fixed inset-0 z-0", className)}
      aria-hidden="true"
    >
      {/* Background: gradient fallback or real image */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center bg-no-repeat",
          "transition-opacity duration-1000",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: currentWallpaper.imageUrl
            ? `url(${currentWallpaper.imageUrl})`
            : gradient,
        }}
      />

      {/* Preload real image if URL exists */}
      {currentWallpaper.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentWallpaper.imageUrl}
          alt=""
          className="hidden"
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      )}

      {/* Subtle dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

      {/* Artist credit bar -- fixed at bottom, 32px height, semi-transparent (FR61) */}
      {showCredit && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            "h-8 flex items-center justify-center",
            "bg-black/60 backdrop-blur-sm",
            "text-white/80 text-caption-style",
            "px-4"
          )}
        >
          <span>
            Background by{" "}
            {currentWallpaper.artistUrl &&
            currentWallpaper.artistUrl !== "#" ? (
              <a
                href={currentWallpaper.artistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                {currentWallpaper.artistName}
              </a>
            ) : (
              <span className="font-medium">
                {currentWallpaper.artistName}
              </span>
            )}
            {currentWallpaper.artworkTitle && (
              <span className="hidden sm:inline">
                {" "}
                &mdash; &ldquo;{currentWallpaper.artworkTitle}&rdquo;
              </span>
            )}
            <span className="hidden sm:inline ml-1">&mdash; View their work</span>
          </span>
        </div>
      )}
    </div>
  );
}
