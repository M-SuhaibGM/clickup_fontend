import type { NextConfig } from "next";

// Server-only: where the frontend's `/api/*` proxy forwards to.
// Set BACKEND_URL on Vercel to e.g. https://clickup-backend.onrender.com
// (no trailing slash, no /api suffix).
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

// For the browser socket: prefer an explicit NEXT_PUBLIC_SOCKET_URL, then
// NEXT_SOCKET_URL (if you avoid the NEXT_PUBLIC_ prefix on Vercel), then fall
// back to BACKEND_URL. Exposed to the client via the `env` mapping below.
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_SOCKET_URL ??
  BACKEND_URL;

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

  // Expose server-side env vars to the browser at build time without needing
  // the NEXT_PUBLIC_ prefix on the source variable name.
  env: {
    NEXT_PUBLIC_SOCKET_URL: SOCKET_URL,
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
