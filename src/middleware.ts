import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware for:
 * - Auth session validation (dashboard routes)
 * - Rate limiting helpers
 * - Security headers
 * - CORS for public API
 *
 * Full auth implementation in Epic 5.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security headers (supplement Caddy headers for dev)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS for public API v1 endpoints
  if (pathname.startsWith("/api/v1/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key"
    );

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // Internal API endpoints: restrict to same origin
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/v1/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.APP_URL || "http://localhost:3000",
      "https://naijatransfer.com",
      "https://www.naijatransfer.com",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
  }

  // Protect cron endpoints with secret
  if (pathname.startsWith("/api/cron/")) {
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Invalid cron secret" } }, {
        status: 403,
      });
    }
  }

  // Dashboard routes require auth (placeholder - full impl in Epic 5)
  // if (pathname.startsWith("/dashboard")) {
  //   const session = await getSession(request);
  //   if (!session) return NextResponse.redirect(new URL("/login", request.url));
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/upload/file (streaming upload — Next.js middleware
     *   buffers the request body for any matched path, which
     *   OOM-kills Node on multi-GB uploads. Skipping middleware
     *   here lets the route handler stream request.body directly.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/upload/file).*)",
  ],
};
