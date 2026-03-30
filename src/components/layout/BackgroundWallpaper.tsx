"use client";

import { useEffect, useState } from "react";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types";

// Nigerian photography from Unsplash (free, attribution included)
// These are real photos of Nigeria — Lagos, markets, landscapes, culture
const PLACEHOLDER_WALLPAPERS: (Wallpaper & { gradient: string })[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=1920&q=80",
    gradient: "linear-gradient(135deg, #008751 0%, #1A1A2E 50%, #006341 100%)",
    artistName: "Babatunde Olajide",
    artworkTitle: "Lagos Skyline",
    artistUrl: "https://unsplash.com/@spicyboggy",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1591115765373-5f9cf1da194e?w=1920&q=80",
    gradient: "linear-gradient(160deg, #0a2e1a 0%, #008751 40%, #FFD700 100%)",
    artistName: "Muhammadtaha Ibrahim",
    artworkTitle: "African Textiles",
    artistUrl: "https://unsplash.com/@planeteelevene",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1573553235970-1f1e157bf168?w=1920&q=80",
    gradient: "linear-gradient(120deg, #1A1A2E 0%, #2d1a4e 30%, #008751 70%, #004d30 100%)",
    artistName: "Dami Adebayo",
    artworkTitle: "Lagos at Dusk",
    artistUrl: "https://unsplash.com/@damidee",
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=1920&q=80",
    gradient: "radial-gradient(ellipse at 20% 50%, #008751 0%, #1A1A2E 60%, #0a0a14 100%)",
    artistName: "Tobi Ogunbadeniyi",
    artworkTitle: "Street Life",
    artistUrl: "https://unsplash.com/@tobiogunbadeniyi",
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=1920&q=80",
    gradient: "linear-gradient(180deg, #1A1A2E 0%, #008751 100%)",
    artistName: "Emmanuel Ikwuegbu",
    artworkTitle: "Golden Hour",
    artistUrl: "https://unsplash.com/@emmaikwuegbu",
  },
  {
    id: "6",
    imageUrl: "https://images.pexels.com/photos/16155217/pexels-photo-16155217.jpeg?auto=compress&cs=tinysrgb&w=1920",
    gradient: "linear-gradient(135deg, #2a6f4e 0%, #1A1A2E 60%, #008751 100%)",
    artistName: "Pexels",
    artworkTitle: "Lagos Market",
    artistUrl: "https://www.pexels.com/photo/crowded-city-street-16155217/",
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
      {/* Gradient background — always visible immediately */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: gradient }}
      />

      {/* Photo layer — fades in on top of gradient when loaded */}
      {currentWallpaper.imageUrl && (
        <>
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center bg-no-repeat",
              "transition-opacity duration-1000",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundImage: `url(${currentWallpaper.imageUrl})` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentWallpaper.imageUrl}
            alt=""
            className="hidden"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </>
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
