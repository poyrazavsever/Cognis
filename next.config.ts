import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {},
};

export default nextConfig;
