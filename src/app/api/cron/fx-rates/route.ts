import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { refreshFxRates } = await import("@/services/fx.service");
    const result = await refreshFxRates();

    return NextResponse.json({
      data: {
        written: result.written,
        errors: result.errors,
        parallel: result.parallel,
        official: result.official,
      },
    });
  } catch (error) {
    console.error("FX rates cron failed:", error);
    return NextResponse.json({ error: "FX refresh failed" }, { status: 500 });
  }
}
