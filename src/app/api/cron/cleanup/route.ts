/**
 * POST /api/cron/cleanup
 * Hourly cleanup of expired transfers and orphaned chunks.
 * Protected by CRON_SECRET header.
 * Implementation for Story 1.5.
 */

import { NextResponse } from "next/server";
import { runFullCleanup } from "@/services/cleanup.service";
import { apiSuccess, apiError } from "@/lib/server-utils";

export async function POST(request: Request) {
  // Verify cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(apiError("FORBIDDEN", "Invalid cron secret"), { status: 403 });
  }

  try {
    const result = await runFullCleanup();

    return NextResponse.json(
      apiSuccess({
        expiredTransfers: result.expiredTransfers,
        bytesReclaimed: result.bytesReclaimed.toString(),
        orphanedChunks: result.orphanedChunks,
        errors: result.errors,
      })
    );
  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Cleanup failed"), { status: 500 });
  }
}
