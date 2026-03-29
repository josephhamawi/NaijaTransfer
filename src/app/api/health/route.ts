import { NextResponse } from "next/server";

const processStartTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export async function GET() {
  const checks: Record<string, string> = {};
  let overallStatus: "ok" | "degraded" | "down" = "ok";

  // Firestore check
  try {
    const { firestore } = await import("@/lib/firebase-admin");
    await firestore.collection("_health").doc("ping").set({ t: Date.now() });
    checks.database = "ok";
  } catch {
    checks.database = "down";
    overallStatus = "degraded";
  }

  // Storage check
  try {
    const { checkStorageHealth } = await import("@/lib/storage");
    const ok = await checkStorageHealth();
    checks.storage = ok ? "ok" : "down";
    if (!ok) overallStatus = overallStatus === "ok" ? "degraded" : overallStatus;
  } catch {
    checks.storage = "down";
    overallStatus = overallStatus === "ok" ? "degraded" : overallStatus;
  }

  checks.uptime = formatUptime(Date.now() - processStartTime);

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    checks,
  });
}

// Force dynamic rendering — don't pre-render at build time
export const dynamic = "force-dynamic";
