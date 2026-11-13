/**
 * Browser upload engine.
 *
 * Shape of the fast path (what WeTransfer, Dropbox and friends do):
 *
 *   1. ONE init call for the whole transfer, which hands back a signed
 *      PUT URL per part.
 *   2. Bytes go straight from the browser into the bucket. They never
 *      touch the app server, so an upload isn't bounded by one Node
 *      process in one datacentre.
 *   3. Parts from *all* files share one concurrency pool, so a hundred
 *      small files saturate the link instead of trickling one at a time.
 *   4. ONE complete call closes out the whole transfer.
 *
 * The old engine did init → chunk → complete per file, strictly
 * sequentially, with every byte proxied through the app server. For
 * small files almost all the wall time was round trips, which is why
 * "even small files" felt slow.
 *
 * Direct-to-bucket is the only path. The proxy upload endpoints were
 * removed with the Hetzner VM: Cloud Run caps request bodies at 32 MiB,
 * so a multi-GB file cannot stream through the app server on Firebase
 * App Hosting. When the bucket refuses browser PUTs the upload fails
 * with an explicit error instead of silently falling back to a route
 * that no longer exists.
 */

export interface UploadTarget {
  /** Stable identity for resume (path + size + mtime). */
  key: string;
  file: File;
  /** Path preserved through upload — "MyFolder/sub/file.txt". */
  relativePath: string;
}

export interface StoredSession {
  transferId: string;
  uploadId: string;
  partCount: number;
  partSize: number;
  single: boolean;
}

export interface RunUploadOptions {
  transferId: string;
  targets: UploadTarget[];
  signal: AbortSignal;
  isCancelled: () => boolean;
  trackXhr: (xhr: XMLHttpRequest) => void;
  untrackXhr: (xhr: XMLHttpRequest) => void;
  /** Absolute bytes uploaded across the whole transfer. */
  onProgress: (bytesUploaded: number) => void;
  onFinalizing: (finalizing: boolean) => void;
  /** Resume store, owned by the caller so it survives a failed attempt. */
  sessions: Map<string, StoredSession>;
}

/** Direct PUTs go to the bucket, a different origin from the app. */
const DIRECT_CONCURRENCY = 8;
/** Files per batch-init call; matches MAX_FILES_PER_CALL on the server. */
const INIT_BATCH = 64;
/** Part URLs per just-in-time /sign call; matches MAX_URLS_PER_CALL. */
const SIGN_BATCH = 128;
const MAX_ATTEMPTS = 6;

/**
 * The bucket is rejecting cross-origin PUTs outright. Terminal: there is
 * no proxy path to fall back to, so surface something the user can act
 * on instead of retrying into the same wall.
 */
class DirectUploadUnavailableError extends Error {
  constructor() {
    super(
      "Uploads are blocked by the storage bucket's CORS policy. Please try again later."
    );
  }
}

class CancelledError extends Error {
  constructor() {
    super("Upload cancelled");
  }
}

interface FileState {
  target: UploadTarget;
  uploadId: string;
  partCount: number;
  partSize: number;
  single: boolean;
  urls: Map<number, string>;
  /** Bytes confirmed uploaded, per part. */
  loaded: number[];
  /** Parts already in the bucket (from resume or this run). */
  done: Set<number>;
  /** True once every part has landed. */
  complete: boolean;
  /** Session predates this attempt — ask the bucket what already landed. */
  resumed: boolean;
}

interface Task {
  fileIndex: number;
  partNumber: number;
}

export async function runUpload(opts: RunUploadOptions): Promise<void> {
  const {
    transferId,
    targets,
    signal,
    isCancelled,
    trackXhr,
    untrackXhr,
    onProgress,
    onFinalizing,
    sessions,
  } = opts;

  const throwIfCancelled = () => {
    if (isCancelled() || signal.aborted) throw new CancelledError();
  };

  // ── Progress accounting ───────────────────────────────────────────
  // Kept as a running total rather than re-summing every part on each
  // progress event; with hundreds of parts in flight that sum was
  // itself measurable work.
  let totalLoaded = 0;
  const bump = (state: FileState, partNumber: number, loaded: number) => {
    const idx = partNumber - 1;
    totalLoaded += loaded - state.loaded[idx];
    state.loaded[idx] = loaded;
    onProgress(totalLoaded);
  };

  const partBounds = (state: FileState, partNumber: number) => {
    const start = (partNumber - 1) * state.partSize;
    const end = Math.min(start + state.partSize, state.target.file.size);
    return { start, end };
  };

  // ── Session setup: resume what we can, init the rest ──────────────
  const states: FileState[] = new Array(targets.length);
  const pending: Array<{ target: UploadTarget; slot: number }> = [];

  targets.forEach((target, slot) => {
    const saved = sessions.get(target.key);
    if (saved && saved.transferId === transferId) {
      states[slot] = {
        target,
        uploadId: saved.uploadId,
        partCount: saved.partCount,
        partSize: saved.partSize,
        single: saved.single,
        urls: new Map(),
        loaded: new Array(saved.partCount).fill(0),
        done: new Set(),
        complete: false,
        resumed: true,
      };
    } else {
      pending.push({ target, slot });
    }
  });

  const initTargets = async (list: Array<{ target: UploadTarget; slot: number }>) => {
    for (let i = 0; i < list.length; i += INIT_BATCH) {
      throwIfCancelled();
      const slice = list.slice(i, i + INIT_BATCH);
      const res = await fetch(
        `/api/upload/file/batch-init?transferId=${encodeURIComponent(transferId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: slice.map(({ target: t }) => ({
              // The server stores this verbatim as originalName, which is
              // what the ZIP download uses for entry paths — that's how
              // folder structure survives the round-trip.
              fileName: t.relativePath,
              fileSize: t.file.size,
              contentType: t.file.type || "application/octet-stream",
            })),
          }),
          signal,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to start upload");
      }
      const { data } = await res.json();
      if (!data.direct) throw new DirectUploadUnavailableError();

      for (const u of data.uploads as Array<{
        index: number;
        uploadId: string;
        partCount: number;
        partSize: number;
        single: boolean;
        urls: Array<{ partNumber: number; url: string }>;
      }>) {
        const { target, slot } = slice[u.index];
        states[slot] = {
          target,
          uploadId: u.uploadId,
          partCount: u.partCount,
          partSize: u.partSize,
          single: u.single,
          urls: new Map(u.urls.map((x) => [x.partNumber, x.url])),
          loaded: new Array(u.partCount).fill(0),
          done: new Set(),
          complete: false,
          resumed: false,
        };
        sessions.set(target.key, {
          transferId,
          uploadId: u.uploadId,
          partCount: u.partCount,
          partSize: u.partSize,
          single: u.single,
        });
      }
    }
  };

  await initTargets(pending);

  // Resumed sessions need their already-landed parts and fresh URLs.
  const resumed = states
    .map((state, slot) => ({ state, slot }))
    .filter(({ state }) => state?.resumed);
  /** Sessions the server no longer knows about — re-init them below. */
  const stale: Array<{ target: UploadTarget; slot: number }> = [];

  await pool(resumed, 8, async ({ state, slot }) => {
    throwIfCancelled();
    const res = await fetch(`/api/upload/file/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId: state.uploadId,
        includeCompleted: true,
        partNumbers: Array.from({ length: Math.min(state.partCount, SIGN_BATCH) }, (_, i) => i + 1),
      }),
      signal,
    });
    if (!res.ok) {
      // Session expired or was already finalized. Start this file over
      // rather than failing the whole transfer.
      sessions.delete(state.target.key);
      stale.push({ target: state.target, slot });
      return;
    }
    const { data } = await res.json();
    for (const u of data.urls as Array<{ partNumber: number; url: string }>) {
      state.urls.set(u.partNumber, u.url);
    }
    for (const n of (data.completed as number[]) ?? []) {
      if (n >= 1 && n <= state.partCount) {
        state.done.add(n);
        const { start, end } = partBounds(state, n);
        bump(state, n, end - start);
      }
    }
  });

  if (stale.length > 0) await initTargets(stale);

  if (states.some((state) => !state)) {
    throw new Error("Failed to start upload for every file. Please try again.");
  }

  // Seed progress for anything already complete on arrival.
  for (const state of states) {
    if (state.done.size === state.partCount) state.complete = true;
  }

  // ── Transfer the bytes ────────────────────────────────────────────
  let directSuccesses = 0;
  let directFailures = 0;
  const active = new Set<XMLHttpRequest>();

  // Several parts of one file can need URLs at the same moment; without
  // this the pool would fire one /sign request per worker for the same
  // range.
  const signInFlight = new Map<string, Promise<void>>();

  const ensureUrl = async (state: FileState, partNumber: number) => {
    const cached = state.urls.get(partNumber);
    if (cached) return cached;

    const inFlight = signInFlight.get(state.uploadId);
    if (inFlight) {
      await inFlight;
      const afterWait = state.urls.get(partNumber);
      if (afterWait) return afterWait;
    }

    const fetchUrls = doSign(state, partNumber);
    signInFlight.set(state.uploadId, fetchUrls);
    try {
      await fetchUrls;
    } finally {
      signInFlight.delete(state.uploadId);
    }

    const url = state.urls.get(partNumber);
    if (!url) throw new Error("Could not refresh upload URL");
    return url;
  };

  const doSign = async (state: FileState, partNumber: number) => {
    const res = await fetch(`/api/upload/file/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId: state.uploadId,
        // Warm the next run of parts while we're here so the pool
        // doesn't stall on one /sign call per part.
        partNumbers: Array.from(
          { length: Math.min(SIGN_BATCH, state.partCount - partNumber + 1) },
          (_, i) => partNumber + i
        ),
      }),
      signal,
    });
    if (!res.ok) throw new Error("Could not refresh upload URL");
    const { data } = await res.json();
    for (const u of data.urls as Array<{ partNumber: number; url: string }>) {
      state.urls.set(u.partNumber, u.url);
    }
  };

  const send = (
    method: "PUT" | "POST",
    url: string,
    blob: Blob,
    contentType: string,
    onLoaded: (loaded: number) => void
  ) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      active.add(xhr);
      trackXhr(xhr);
      const cleanup = () => {
        active.delete(xhr);
        untrackXhr(xhr);
      };
      xhr.open(method, url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onLoaded(e.loaded);
      };
      xhr.onload = () => {
        cleanup();
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        const err = new Error(`upload failed: HTTP ${xhr.status}`) as Error & {
          status?: number;
          body?: string;
        };
        err.status = xhr.status;
        err.body = xhr.responseText;
        reject(err);
      };
      xhr.onerror = () => {
        cleanup();
        const err = new Error("network error") as Error & { status?: number };
        err.status = 0;
        reject(err);
      };
      xhr.onabort = () => {
        cleanup();
        reject(new CancelledError());
      };
      xhr.send(blob);
    });

  const uploadPart = async (state: FileState, partNumber: number) => {
    const { start, end } = partBounds(state, partNumber);
    const blob = state.target.file.slice(start, end);
    const contentType = state.target.file.type || "application/octet-stream";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      throwIfCancelled();
      try {
        const url = await ensureUrl(state, partNumber);
        await send("PUT", url, blob, contentType, (loaded) => bump(state, partNumber, loaded));
        directSuccesses++;
        state.done.add(partNumber);
        bump(state, partNumber, end - start);
        return;
      } catch (err) {
        if (err instanceof CancelledError || isCancelled()) throw err;
        const status = (err as { status?: number }).status;
        const body = (err as { body?: string }).body ?? "";

        // Tier/quota rejections are final — retrying can't help.
        if (/FILE_TOO_LARGE|TRANSFER_TOO_LARGE|TOO_MANY_FILES|UPLOAD_NOT_FOUND/.test(body)) {
          throw new Error(parseError(body) || "Upload rejected");
        }

        // A signature that expired mid-upload: mint a new one.
        if (status === 400 || status === 403) {
          state.urls.delete(partNumber);
        }
        directFailures++;
        // Nothing has ever gone through and the browser sees no response
        // at all — the bucket is rejecting the cross-origin PUT. Retrying
        // cannot fix a CORS policy, and there is no proxy path left, so
        // stop and say why.
        if (directSuccesses === 0 && directFailures >= 3 && (status === 0 || status === 403)) {
          throw new DirectUploadUnavailableError();
        }

        bump(state, partNumber, 0);
        if (attempt === MAX_ATTEMPTS) throw err;
        await waitForOnline(signal);
        throwIfCancelled();
        await delay(1000 * Math.min(16, 2 ** (attempt - 1)), signal);
      }
    }
  };

  const buildTasks = (): Task[] => {
    const tasks: Task[] = [];
    states.forEach((state, fileIndex) => {
      if (state.complete) return;
      for (let n = 1; n <= state.partCount; n++) {
        if (!state.done.has(n)) tasks.push({ fileIndex, partNumber: n });
      }
    });
    return tasks;
  };

  try {
    await pool(buildTasks(), DIRECT_CONCURRENCY, (task) =>
      uploadPart(states[task.fileIndex], task.partNumber)
    );
  } catch (err) {
    // Stop anything still pushing bytes at a bucket that won't take
    // them, so the error surfaces now instead of after every in-flight
    // part has burned its retry budget.
    if (err instanceof DirectUploadUnavailableError) {
      for (const xhr of active) {
        try {
          xhr.abort();
        } catch {
          /* already settled */
        }
      }
      active.clear();
    }
    throw err;
  }

  for (const state of states) {
    if (state.done.size === state.partCount) state.complete = true;
  }

  // ── Finalize ──────────────────────────────────────────────────────
  onFinalizing(true);
  try {
    const done = states.filter((s) => s.complete);

    if (done.length > 0) {
      for (let i = 0; i < done.length; i += INIT_BATCH) {
        const slice = done.slice(i, i + INIT_BATCH);
        const res = await fetch(
          `/api/upload/file/batch-complete?transferId=${encodeURIComponent(transferId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadIds: slice.map((s) => s.uploadId) }),
            signal,
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to finalize transfer");
        }
        for (const s of slice) sessions.delete(s.target.key);
      }
    }
  } finally {
    onFinalizing(false);
  }
}

// ─── helpers ─────────────────────────────────────────────────────────

/** Run `fn` over `items` with at most `limit` in flight. */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  if (items.length === 0) return;
  let next = 0;
  let failure: unknown = null;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (failure === null) {
      const i = next++;
      if (i >= items.length) return;
      try {
        await fn(items[i]);
      } catch (err) {
        // Keep the first failure: it explains why the run stopped. Later
        // workers may only be reporting the fallout (aborted or
        // cancelled parts).
        if (failure === null) failure = err;
      }
    }
  });
  await Promise.all(workers);
  if (failure !== null) throw failure;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

/**
 * Park until the browser reports a connection again (capped), so a
 * tunnel dropping for twenty seconds doesn't burn the retry budget.
 */
function waitForOnline(signal: AbortSignal, maxWaitMs = 60_000): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener("online", done);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, maxWaitMs);
    window.addEventListener("online", done, { once: true });
    signal.addEventListener("abort", done, { once: true });
  });
}

function parseError(body: string): string | null {
  try {
    return JSON.parse(body)?.error?.message ?? null;
  } catch {
    return null;
  }
}
