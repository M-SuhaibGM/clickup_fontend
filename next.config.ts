import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional: If these cause issues with auth, you can remove them. 
  // cacheComponents: true,
  // partialPrefetching: true,
  reactStrictMode: false, // ← Add this line to disable Strict Mode
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

  // ⚠️ KEEP THIS! This is what fixes your 401/Cookie issues.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;