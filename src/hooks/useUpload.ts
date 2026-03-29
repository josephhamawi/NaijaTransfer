/**
 * tus upload hook.
 * Manages file upload state, progress, pause/resume, and error handling.
 * Full implementation in Epic 2: Core Transfer Engine.
 */

"use client";

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: "pending" | "uploading" | "paused" | "completed" | "error" | "queued";
  error?: string;
}

export interface UseUploadReturn {
  files: UploadFile[];
  overallProgress: number;
  isUploading: boolean;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (fileId: string) => void;
  startUpload: () => Promise<void>;
  pauseUpload: () => void;
  resumeUpload: () => void;
  cancelUpload: () => void;
}

/**
 * Placeholder hook for file upload management via tus protocol.
 * Implementation in Epic 2.
 */
export function useUpload(): UseUploadReturn {
  return {
    files: [],
    overallProgress: 0,
    isUploading: false,
    addFiles: () => {},
    removeFile: () => {},
    startUpload: async () => {},
    pauseUpload: () => {},
    resumeUpload: () => {},
    cancelUpload: () => {},
  };
}
