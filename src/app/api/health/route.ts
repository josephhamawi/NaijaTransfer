import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkR2Connectivity } from "@/lib/r2";
import { checkStorageUtilization } from "@/services/storage-monitor.service";

// Track process start time for uptime calculation
const processStartTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export async function GET() {
  const checks: Record<string, unknown> = {};
  let overallStatus: "ok" | "degraded" | "down" = "ok";

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = "down";
    overallStatus = "down";
    console.error("Health check - database error:", error);
  }

  // R2 connectivity check
  try {
    const r2Status = await checkR2Connectivity();
    checks.r2 = r2Status ? "ok" : "down";
    if (!r2Status) overallStatus = overallStatus === "ok" ? "degraded" : overallStatus;
  } catch (error) {
    checks.r2 = "down";
    overallStatus = overallStatus === "ok" ? "degraded" : overallStatus;
    console.error("Health check - R2 error:", error);
  }

  // Storage utilization check
  try {
    const storage = await checkStorageUtilization();
    checks.storage = {
      usedPercent: storage.usedPercent,
      status: storage.usedPercent > 85 ? "critical" : storage.usedPercent > 75 ? "warning" : "ok",
    };
    if (storage.usedPercent > 85) {
      overallStatus = overallStatus === "ok" ? "degraded" : overallStatus;
    }
  } catch (error) {
    checks.storage = { usedPercent: -1, status: "unknown" };
    console.error("Health check - storage error:", error);
  }

  // Uptime
  checks.uptime = formatUptime(Date.now() - processStartTime);

  const statusCode = overallStatus === "down" ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    { status: statusCode }
  );
}
