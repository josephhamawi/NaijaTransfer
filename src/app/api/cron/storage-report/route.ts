/**
 * POST /api/cron/storage-report
 * Daily storage utilization report.
 * Protected by CRON_SECRET header.
 * Implementation for Story 1.8.
 */

import { NextResponse } from "next/server";
import { generateStorageReport } from "@/services/storage-monitor.service";
import { apiSuccess, apiError } from "@/lib/server-utils";

export async function POST(request: Request) {
  // Verify cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(apiError("FORBIDDEN", "Invalid cron secret"), { status: 403 });
  }

  try {
    const report = await generateStorageReport();

    console.warn("Daily storage report:", JSON.stringify(report));

    return NextResponse.json(apiSuccess(report));
  } catch (error) {
    console.error("Storage report failed:", error);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Storage report failed"), { status: 500 });
  }
}
