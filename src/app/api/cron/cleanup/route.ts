import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { runFullCleanup } = await import("@/services/cleanup.service");
    const result = await runFullCleanup();

    return NextResponse.json({
      data: {
        expiredTransfers: result.expiredTransfers,
        bytesReclaimed: result.bytesReclaimed,
        oldLogsDeleted: result.orphanedChunks,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
