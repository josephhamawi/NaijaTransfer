"use client";

import { cn } from "@/lib/utils";

type FileCategory =
  | "image"
  | "video"
  | "pdf"
  | "audio"
  | "archive"
  | "document"
  | "other";

interface FileTypeIconProps {
  category: FileCategory;
  size?: number;
  className?: string;
}

const iconColors: Record<FileCategory, string> = {
  image: "text-blue-500",
  video: "text-purple-500",
  pdf: "text-error-red",
  audio: "text-green-700",
  archive: "text-gold-600",
  document: "text-blue-600",
  other: "text-charcoal-400",
};

/**
 * SVG icon representing a file type category.
 * Inline SVG, <1KB each. Used in Lightweight Mode as thumbnail replacement.
 */
export function FileTypeIcon({
  category,
  size = 20,
  className,
}: FileTypeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(iconColors[category], className)}
      aria-hidden="true"
    >
      {category === "image" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5-8 8" />
        </>
      )}
      {category === "video" && (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
        </>
      )}
      {category === "pdf" && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <polyline points="14 2 14 8 20 8" />
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="6"
            fontWeight="bold"
          >
            PDF
          </text>
        </>
      )}
      {category === "audio" && (
        <>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </>
      )}
      {category === "archive" && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12h1M10 15h1M10 18h1" />
          <rect x="12" y="11" width="2" height="8" rx="0.5" />
        </>
      )}
      {category === "document" && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="12" y2="17" />
        </>
      )}
      {category === "other" && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <polyline points="14 2 14 8 20 8" />
        </>
      )}
    </svg>
  );
}

export default FileTypeIcon;
