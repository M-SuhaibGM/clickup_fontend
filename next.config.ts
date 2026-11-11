import type { NextConfig } from "next";

// Server-only env var (no NEXT_PUBLIC_ prefix): used by Next.js to proxy
// `/api/*` requests to the real backend. In production this makes every
// browser → backend call look same-origin, which keeps the refresh cookie
// first-party (fixes Chrome/Safari third-party cookie blocking).
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Proxy the API through the frontend's own origin so cookies stay first-party
  // in every browser (Chrome's third-party cookie block, Safari ITP, Brave…).
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
