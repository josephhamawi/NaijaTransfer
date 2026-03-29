"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface QRCodeProps {
  /** URL to encode in the QR code */
  url: string;
  /** Size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QRCode component renders a QR code for transfer links (FR22).
 *
 * Uses the `qrcode` npm package for generation.
 * Falls back to a text representation if rendering fails.
 * Always rendered (even in Lightweight Mode) -- QR codes are minimal data
 * and high utility for in-person sharing.
 */
export default function QRCode({
  url,
  size = 120,
  className,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        // Dynamic import to keep bundle small
        const QRCodeLib = await import("qrcode");
        const dataUrlResult = await QRCodeLib.toDataURL(url, {
          width: size * 2, // 2x for retina
          margin: 1,
          color: {
            dark: "#1A1A2E",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });

        if (!cancelled) {
          setDataUrl(dataUrlResult);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (error) {
    // Fallback: show the URL text
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white rounded-[var(--radius-md)] p-3",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-caption-style text-charcoal-400 text-center break-all">
          {url}
        </span>
      </div>
    );
  }

  if (!dataUrl) {
    // Loading state
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white rounded-[var(--radius-md)] p-3",
          "animate-pulse",
          className
        )}
        style={{ width: size, height: size }}
      >
        <div className="w-3/4 h-3/4 bg-charcoal-50 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-block bg-white rounded-[var(--radius-md)] p-3",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`QR code for ${url}`}
        width={size}
        height={size}
        className="block"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
