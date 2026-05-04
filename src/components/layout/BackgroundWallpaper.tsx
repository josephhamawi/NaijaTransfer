"use client";

import { useEffect, useState, useRef } from "react";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types";
import { WALLPAPERS } from "@/data/wallpapers";

export interface BackgroundWallpaperProps {
  wallpaper?: Wallpaper;
  showCredit?: boolean;
  className?: string;
}

export default function BackgroundWallpaper({
  wallpaper: overrideWallpaper,
  showCredit = true,
  className,
}: BackgroundWallpaperProps) {
  const isLightweight = useIsLightweight();
  // Start from a stable index so SSR and client hydration produce the same
  // HTML (Math.random here would cause React #418). We pick a real random
  // wallpaper inside useEffect, after hydration.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(-1);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Randomize once on mount (client-only, post-hydration).
  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * WALLPAPERS.length));
  }, []);

  // Auto-rotate every 10 seconds with crossfade
  useEffect(() => {
    if (overrideWallpaper || isLightweight) return;

    timerRef.current = setInterval(() => {
      setNextIndex((currentIndex + 1) % WALLPAPERS.length);
      setTransitioning(true);

      // After fade completes, swap current to next
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % WALLPAPERS.length);
        setNextIndex(-1);
        setTransitioning(false);
      }, 1500); // Match CSS transition duration
    }, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, overrideWallpaper, isLightweight]);

  if (isLightweight) return null;

  const current = overrideWallpaper || WALLPAPERS[currentIndex];
  const next = nextIndex >= 0 ? WALLPAPERS[nextIndex] : null;

  return (
    <div className={cn("wallpaper-bg fixed inset-0 z-0", className)} aria-hidden="true">
      {/* Current wallpaper — always visible */}
      <WallpaperLayer
        wallpaper={current as Wallpaper & { gradient: string }}
        opacity={1}
      />

      {/* Next wallpaper — fades in on top */}
      {next && (
        <WallpaperLayer
          wallpaper={next}
          opacity={transitioning ? 1 : 0}
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />

      {/* Artist credit */}
      {showCredit && (
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white/80 text-xs px-4 z-10">
          <span>
            Background by{" "}
            {current.artistUrl && current.artistUrl !== "#" ? (
              <a href={current.artistUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                {current.artistName}
              </a>
            ) : (
              <span className="font-medium">{current.artistName}</span>
            )}
            {current.artworkTitle && (
              <span className="hidden sm:inline"> &mdash; &ldquo;{current.artworkTitle}&rdquo;</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function WallpaperLayer({
  wallpaper,
  opacity,
}: {
  wallpaper: Wallpaper & { gradient?: string };
  opacity: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const grad = (wallpaper as { gradient?: string }).gradient || "";

  return (
    <div
      className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
      style={{ opacity }}
    >
      {/* Gradient base */}
      {grad && <div className="absolute inset-0" style={{ backgroundImage: grad }} />}

      {/* Photo */}
      {wallpaper.imageUrl && (
        <>
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundImage: `url(${wallpaper.imageUrl})` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wallpaper.imageUrl}
            alt=""
            className="hidden"
            onLoad={() => setImgLoaded(true)}
          />
        </>
      )}
    </div>
  );
}
