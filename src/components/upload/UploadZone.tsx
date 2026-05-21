"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
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

/**
 * Group selected files by their top-level folder for display. Files
 * whose relativePath has no slash render as individual rows; files
 * inside a folder collapse into one folder row that summarizes the
 * contents (count + total size). Insertion order is preserved so a
 * folder appears where its first file landed, intermixed with any
 * standalone files.
 */
type FileGroup =
  | { kind: "file"; file: SelectedFile }
  | {
      kind: "folder";
      name: string;
      files: SelectedFile[];
      totalSize: number;
      hasOverSize: boolean;
    };

function groupFiles(files: SelectedFile[], maxFileSize: number): FileGroup[] {
  const groups: FileGroup[] = [];
  const folderIndex = new Map<string, number>();

  for (const file of files) {
    const slash = file.relativePath.indexOf("/");
    if (slash === -1) {
      groups.push({ kind: "file", file });
      continue;
    }
    const folderName = file.relativePath.slice(0, slash);
    const existing = folderIndex.get(folderName);
    if (existing !== undefined) {
      const g = groups[existing] as Extract<FileGroup, { kind: "folder" }>;
      g.files.push(file);
      g.totalSize += file.size;
      if (file.size > maxFileSize) g.hasOverSize = true;
    } else {
      folderIndex.set(folderName, groups.length);
      groups.push({
        kind: "folder",
        name: folderName,
        files: [file],
        totalSize: file.size,
        hasOverSize: file.size > maxFileSize,
      });
    }
  }

  return groups;
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
 * Small popover that lets the user pick between adding files or a
 * folder. Rendered absolutely; the caller controls anchoring via
 * `className` and dismissal via a doc-level pointerdown listener.
 *
 * Click handlers stopPropagation so clicks inside the menu don't
 * bubble to the surrounding dropzone (which would otherwise re-open
 * the menu on its own click handler).
 */
const PickerMenu = forwardRef<
  HTMLDivElement,
  {
    onPickFiles: () => void;
    onPickFolder: () => void;
    className?: string;
  }
>(function PickerMenu({ onPickFiles, onPickFolder, className }, ref) {
  return (
    <div
      ref={ref}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-10 min-w-[180px]",
        "rounded-[var(--radius-md)]",
        "bg-[var(--bg-elevated,var(--bg-primary))]",
        "border border-[var(--border-color)]",
        "shadow-lg p-1",
        className
      )}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onPickFiles}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2",
          "rounded-[var(--radius-sm)]",
          "text-body-sm text-left text-[var(--text-primary)]",
          "hover:bg-[var(--bg-secondary)]",
          "min-h-[40px]"
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
        Choose files
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onPickFolder}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2",
          "rounded-[var(--radius-sm)]",
          "text-body-sm text-left text-[var(--text-primary)]",
          "hover:bg-[var(--bg-secondary)]",
          "min-h-[40px]"
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
        Choose folder
      </button>
    </div>
  );
});

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
  const [pickerMenuOpen, setPickerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the picker menu on outside click or Escape.
  useEffect(() => {
    if (!pickerMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPickerMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerMenuOpen]);

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

  const openPickerMenu = useCallback(() => {
    if (!uploading) setPickerMenuOpen(true);
  }, [uploading]);

  const pickFiles = useCallback(() => {
    setPickerMenuOpen(false);
    inputRef.current?.click();
  }, []);

  const pickFolder = useCallback(() => {
    setPickerMenuOpen(false);
    folderInputRef.current?.click();
  }, []);

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
        openPickerMenu();
      }
    },
    [openPickerMenu]
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
          // When the menu is open, the doc-level pointerdown listener
          // closes it; we suppress onClick here so the trigger doesn't
          // immediately reopen on the same gesture.
          onClick={pickerMenuOpen ? undefined : openPickerMenu}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative",
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
          aria-label="Drop files or a folder here, or click to choose"
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
                Drag files or a folder here, or click to choose
              </span>
              <span className="md:hidden">Tap to add files or a folder</span>
            </p>
            <p className="text-body-sm text-[var(--text-muted)] mt-1">
              Up to {formatFileSize(maxFileSize)} per file
            </p>
          </div>

          {pickerMenuOpen && (
            <PickerMenu
              ref={menuRef}
              onPickFiles={pickFiles}
              onPickFolder={pickFolder}
              className="top-[calc(50%+0.5rem)] left-1/2 -translate-x-1/2"
            />
          )}
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
          {groupFiles(files, maxFileSize).map((group) => {
            if (group.kind === "folder") {
              const fileWord = group.files.length === 1 ? "file" : "files";
              return (
                <div
                  key={`folder-${group.name}`}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    "rounded-[var(--radius-md)]",
                    "bg-[var(--bg-secondary)]",
                    group.hasOverSize &&
                      "border border-error-red/30 bg-[var(--error-bg)]"
                  )}
                >
                  {/* Folder icon */}
                  <div className="w-10 h-10 shrink-0 rounded-[var(--radius-sm)] flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-nigerian-green">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-body-sm font-medium text-[var(--text-primary)] truncate"
                      title={group.name}
                    >
                      {truncateFilename(group.name, 45)}
                    </p>
                    <p className="text-caption-style text-[var(--text-muted)]">
                      {group.files.length} {fileWord} &middot;{" "}
                      {formatFileSize(group.totalSize)}
                    </p>
                  </div>

                  {!uploading && (
                    <button
                      onClick={() => {
                        for (const f of group.files) onFileRemoved(f.id);
                      }}
                      className={cn(
                        "flex items-center justify-center shrink-0",
                        "w-9 h-9 min-w-[44px] min-h-[44px]",
                        "rounded-[var(--radius-sm)]",
                        "text-[var(--text-muted)] hover:text-error-red",
                        "hover:bg-red-50 dark:hover:bg-red-700/10",
                        "transition-colors"
                      )}
                      aria-label={`Remove folder ${group.name}`}
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
            }

            const file = group.file;
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
                    title={file.name}
                  >
                    {truncateFilename(file.name, 45)}
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
              <div className="relative">
                <button
                  onClick={pickerMenuOpen ? undefined : openPickerMenu}
                  aria-haspopup="menu"
                  aria-expanded={pickerMenuOpen}
                  className={cn(
                    "text-body-sm font-medium text-nigerian-green",
                    "hover:underline",
                    "min-h-[44px] inline-flex items-center"
                  )}
                >
                  + Add more
                </button>
                {pickerMenuOpen && (
                  <PickerMenu
                    ref={menuRef}
                    onPickFiles={pickFiles}
                    onPickFolder={pickFolder}
                    className="right-0 top-full mt-1"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
