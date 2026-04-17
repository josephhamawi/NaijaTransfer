/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Skew protection: stamp every chunk request with the build's deployment ID
  // so clients loaded before a deploy hard-refresh instead of fetching dead
  // chunk hashes and hitting React hydration errors (#418/#423).
  // BUILD_ID is injected by scripts/deploy.sh (git SHA); falls back to a
  // timestamp in local dev so hot-reloads don't collide.
  generateBuildId: async () => process.env.BUILD_ID || `dev-${Date.now()}`,
  deploymentId: process.env.BUILD_ID || undefined,

  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
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

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "4gb",
    },
  },
};

export default nextConfig;
