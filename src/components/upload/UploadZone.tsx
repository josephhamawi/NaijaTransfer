"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { cn, formatFileSize, truncateFilename, getFileCategory } from "@/lib/utils";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { FileTypeIcon } from "./FileTypeIcon";

export interface SelectedFile {
  id: string;
  file: File;
  name: string;
  /**
   * Path relative to the dropped/selected folder root (e.g.
   * "MyFolder/sub/file.txt"). Equals `name` for plain files.
   * The server uses this verbatim as the file's display name and as
   * the entry name inside the bulk ZIP, which is how folder structure
   * survives a round-trip.
   */
  relativePath: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
}

/**
 * A file paired with the path that should be preserved through the
 * upload (always at least the basename; longer for files inside a
 * dropped/selected folder).
 */
export type FileWithPath = { file: File; relativePath: string };

export interface UploadZoneProps {
  /** Currently selected files */
  files: SelectedFile[];
  /** Called when files (plain or expanded from a folder) are added */
  onFilesAdded: (files: FileWithPath[]) => void;
  /** Called when a file is removed */
  onFileRemoved: (fileId: string) => void;
  /** Maximum file size in bytes (tier-dependent) */
  maxFileSize?: number;
  /** Whether upload is in progress (disables adding/removing) */
  uploading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Recursively expand a dropped FileSystemEntry tree (folder drag-and-drop)
 * into a flat list with relative paths preserved.
 *
 * `createReader().readEntries()` can return a partial batch (~100 entries
 * in Chrome), so we have to call it in a loop until it returns empty.
 */
async function readEntries(
  entry: FileSystemEntry,
  pathPrefix = ""
): Promise<FileWithPath[]> {
  if (entry.isFile) {
    return new Promise<FileWithPath[]>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => {
          const relativePath = pathPrefix
            ? `${pathPrefix}/${file.name}`
            : file.name;
          resolve([{ file, relativePath }]);
        },
        () => resolve([])
      );
    });
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const children: FileSystemEntry[] = [];

    const readBatch = () =>
      new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(
          (batch) => resolve(batch),
          () => resolve([])
        );
      });

    while (true) {
      const batch = await readBatch();
      if (batch.length === 0) break;
      children.push(...batch);
    }

    const nextPrefix = pathPrefix
      ? `${pathPrefix}/${entry.name}`
      : entry.name;
    const nested = await Promise.all(
      children.map((c) => readEntries(c, nextPrefix))
    );
    return nested.flat();
  }

  return [];
}

async function collectFromDataTransfer(
  items: DataTransferItemList,
  fallbackFiles: FileList
): Promise<FileWithPath[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  // Browsers without webkitGetAsEntry (rare on desktop) — fall back to
  // the flat FileList, which can't represent folder structure anyway.
  if (entries.length === 0) {
    return Array.from(fallbackFiles).map((file) => ({
      file,
      relativePath: file.name,
    }));
  }

  const expanded = await Promise.all(entries.map((e) => readEntries(e)));
  return expanded.flat();
}

/**
 * UploadZone: drag-and-drop + click file selection area.
 *
 * Idle state: dashed border zone with + icon and prompt text.
 * Drag hover: green border, background tint, icon pulse.
 * Files selected: file list with thumbnails/icons, names, sizes, remove buttons.
 * Mobile: tap-to-select only (no drag-and-drop).
 *
 * All touch targets are 44px minimum (NFR21).
 * Lightweight Mode: shows file-type icons instead of thumbnails.
 * Accessible: keyboard operable, ARIA labels, role="button".
 */
export default function UploadZone({
  files,
  onFilesAdded,
  onFileRemoved,
  maxFileSize = 4 * 1024 * 1024 * 1024, // 4GB default
  uploading = false,
  className,
}: UploadZoneProps) {
  const isLightweight = useIsLightweight();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (uploading) return;
      void collectFromDataTransfer(e.dataTransfer.items, e.dataTransfer.files).then(
        (collected) => {
          if (collected.length > 0) onFilesAdded(collected);
        }
      );
    },
    [onFilesAdded, uploading]
  );

  const handleClick = useCallback(() => {
    if (!uploading) {
      inputRef.current?.click();
    }
  }, [uploading]);

  const handleFolderClick = useCallback(() => {
    if (!uploading) {
      folderInputRef.current?.click();
    }
  }, [uploading]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        // `webkitRelativePath` is populated when the input has
        // `webkitdirectory`; empty otherwise. Either way we end up with
        // a usable relativePath.
        const collected: FileWithPath[] = Array.from(selected).map((file) => ({
          file,
          relativePath:
            (file as File & { webkitRelativePath?: string })
              .webkitRelativePath || file.name,
        }));
        onFilesAdded(collected);
      }
      // Reset so the same file/folder can be re-added
      e.target.value = "";
    },
    [onFilesAdded]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const hasFiles = files.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* Hidden folder input. `webkitdirectory` is non-standard JSX so we
          mark it as a non-empty string attribute via the DOM cast. */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
      />

      {/* Drop zone / click to select -- shown when no files selected */}
      {!hasFiles && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3",
            "min-h-[160px] p-6",
            "rounded-[var(--radius-xl)]",
            "border-2 border-dashed",
            "cursor-pointer select-none",
            "transition-all duration-200",
            isDragOver
              ? "border-nigerian-green bg-green-50/50 dark:bg-green-900/10 scale-[1.02]"
              : "border-[var(--upload-zone-border)] hover:border-nigerian-green/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          aria-label="Drop files here or click to select files for upload"
        >
          {/* Plus icon */}
          <div
            className={cn(
              "flex items-center justify-center",
              "w-14 h-14 rounded-full",
              "bg-green-50 dark:bg-green-900/20",
              "text-nigerian-green",
              isDragOver && "scale-110 transition-transform"
            )}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M14 6v16M6 14h16" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-body font-medium text-[var(--text-primary)]">
              <span className="hidden md:inline">
                Drag files or a folder here, or click to select
              </span>
              <span className="md:hidden">Tap to select files</span>
            </p>
            <p className="text-body-sm text-[var(--text-muted)] mt-1">
              Up to {formatFileSize(maxFileSize)} per file
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFolderClick();
              }}
              className={cn(
                "text-body-sm font-medium text-nigerian-green",
                "hover:underline mt-2 inline-flex items-center",
                "min-h-[44px]"
              )}
            >
              or select a folder
            </button>
          </div>
        </div>
      )}

      {/* File list -- shown after files are added */}
      {hasFiles && (
        <div
          className="space-y-2"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.map((file) => {
            const category = getFileCategory(file.mimeType);
            const isOverSize = file.size > maxFileSize;

            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3",
                  "rounded-[var(--radius-md)]",
                  "bg-[var(--bg-secondary)]",
                  isOverSize &&
                    "border border-error-red/30 bg-[var(--error-bg)]"
                )}
              >
                {/* Thumbnail or file-type icon */}
                <div className="w-10 h-10 shrink-0 rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center bg-charcoal-50 dark:bg-charcoal-600">
                  {!isLightweight &&
                  file.previewUrl &&
                  category === "image" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.previewUrl}
                        alt=""
                        className="preview-thumbnail w-10 h-10 object-cover"
                      />
                    </>
                  ) : (
                    <FileTypeIcon category={category} />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-body-sm font-medium text-[var(--text-primary)] truncate"
                    title={file.relativePath}
                  >
                    {truncateFilename(file.relativePath, 45)}
                  </p>
                  <p className="text-caption-style text-[var(--text-muted)]">
                    {formatFileSize(file.size)}
                  </p>
                  {isOverSize && (
                    <p
                      className="text-caption-style text-error-red"
                      role="alert"
                    >
                      Exceeds {formatFileSize(maxFileSize)} limit
                    </p>
                  )}
                </div>

                {/* Remove button */}
                {!uploading && (
                  <button
                    onClick={() => onFileRemoved(file.id)}
                    className={cn(
                      "flex items-center justify-center shrink-0",
                      "w-9 h-9 min-w-[44px] min-h-[44px]",
                      "rounded-[var(--radius-sm)]",
                      "text-[var(--text-muted)] hover:text-error-red",
                      "hover:bg-red-50 dark:hover:bg-red-700/10",
                      "transition-colors"
                    )}
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* Summary row */}
          <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
            <p className="text-body-sm text-[var(--text-secondary)]">
              {files.length} {files.length === 1 ? "file" : "files"} &mdash;{" "}
              {formatFileSize(totalSize)} total
            </p>
            {!uploading && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClick}
                  className={cn(
                    "text-body-sm font-medium text-nigerian-green",
                    "hover:underline",
                    "min-h-[44px] inline-flex items-center"
                  )}
                >
                  + Add files
                </button>
                <button
                  onClick={handleFolderClick}
                  className={cn(
                    "text-body-sm font-medium text-nigerian-green",
                    "hover:underline",
                    "min-h-[44px] inline-flex items-center"
                  )}
                >
                  + Add folder
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
