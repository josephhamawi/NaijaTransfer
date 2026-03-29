import { NextRequest, NextResponse } from "next/server";
import { getUserTransfers } from "@/services/transfer.service";

export async function GET(request: NextRequest) {
  try {
    // TODO: Wire up auth - const session = await getServerSession(authOptions);
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 50);

    const result = await getUserTransfers(userId, page, limit);

    return NextResponse.json({
      data: {
        transfers: result.transfers.map((t) => ({
          id: t.id,
          shortCode: t.shortCode,
          status: t.status,
          downloadCount: t.downloadCount,
          downloadLimit: t.downloadLimit,
          totalSizeBytes: Number(t.totalSizeBytes),
          fileCount: (t.files ?? []).length,
          expiresAt: t.expiresAt.toISOString(),
          createdAt: t.createdAt.toISOString(),
        })),
        total: result.total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("User transfers error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch transfers" } }, { status: 500 });
  }
}
