/**
 * Lightweight, fire-and-forget client for the Kodefoundry CRM.
 *
 * Design rules (this must NEVER affect the running app):
 * - Optional: if CRM_APP_ID / CRM_API_KEY are unset, every function is a silent
 *   no-op. NaijaTransfer behaves identically with or without the CRM configured.
 * - Non-throwing: all network/parse errors are swallowed. A CRM outage can never
 *   fail a signup, a payment webhook, or any request.
 * - Non-blocking: calls are fire-and-forget (not awaited), so they add no latency.
 *   This relies on the long-running Node server (PM2), where the promise settles
 *   after the response is sent.
 * - Server-side only. Do not import from client components.
 */

const CRM_ENDPOINT = process.env.CRM_ENDPOINT || "https://api-ei3nxpoa5q-uc.a.run.app";
const CRM_APP_ID = process.env.CRM_APP_ID || "";
const CRM_API_KEY = process.env.CRM_API_KEY || "";

function crmEnabled(): boolean {
  return Boolean(CRM_APP_ID && CRM_API_KEY);
}

async function post(path: string, body: Record<string, unknown>): Promise<void> {
  if (!crmEnabled()) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(`${CRM_ENDPOINT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: CRM_APP_ID, apiKey: CRM_API_KEY, ...body }),
      signal: controller.signal,
    });
  } catch {
    // Swallow — CRM tracking must never affect the app.
  } finally {
    clearTimeout(timer);
  }
}

/** Record an analytics event for a user (e.g. "signup", "payment_completed"). */
export function crmTrack(
  userId: string | null | undefined,
  eventType: string,
  metadata?: Record<string, unknown>,
): void {
  if (!userId || !crmEnabled()) return;
  void post("/events", { userId, eventType, metadata: metadata || {} });
}

/** Push/refresh a user's profile traits in the CRM (email, name, phone). */
export function crmIdentify(
  userId: string | null | undefined,
  traits: { email?: string | null; displayName?: string | null; phone?: string | null },
): void {
  if (!userId || !crmEnabled()) return;
  void post("/events", {
    userId,
    eventType: "user_identified",
    metadata: {
      traits: {
        ...(traits.email ? { email: traits.email } : {}),
        ...(traits.displayName ? { displayName: traits.displayName } : {}),
        ...(traits.phone ? { phone: traits.phone } : {}),
      },
    },
  });
}
