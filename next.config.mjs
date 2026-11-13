/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Skew protection: stamp every chunk request with the build's deployment ID
  // so clients loaded before a deploy hard-refresh instead of fetching dead
  // chunk hashes and hitting React hydration errors (#418/#423).
  // BUILD_ID is injected by the build (App Hosting exposes the commit SHA);
  // falls back to a timestamp in local dev so hot-reloads don't collide.
  generateBuildId: async () => process.env.BUILD_ID || `dev-${Date.now()}`,
  deploymentId: process.env.BUILD_ID || undefined,

  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },

  // Security headers (additional to Caddy)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  // ESLint — ignore during builds (fix later)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // No large-body server actions: on Cloud Run (Firebase App Hosting) the
  // request body cap is 32 MiB and not configurable. Bytes go browser →
  // signed PUT → bucket and never pass through this process, so nothing
  // needs a raised limit.
};

export default nextConfig;
