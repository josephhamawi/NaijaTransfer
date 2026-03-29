/**
 * NextAuth.js v5 configuration.
 * Providers: Email magic link, Google OAuth, Phone OTP (credential).
 * Implementation completed in Epic 5.
 */

// Placeholder for NextAuth configuration.
// This will be fully implemented in Epic 5: Authentication & User System.
// The auth configuration depends on:
// - Brevo email provider setup
// - Google OAuth credentials
// - Termii SMS OTP integration
// - Prisma adapter

export const AUTH_CONFIG = {
  // Session strategy: JWT (stateless, no DB lookup per request)
  sessionStrategy: "jwt" as const,

  // Session max age: 30 days
  sessionMaxAge: 30 * 24 * 60 * 60,

  // JWT contains: userId, email, tier, name
  jwtPayload: ["userId", "email", "tier", "name"] as const,
};
