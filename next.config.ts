import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disabled to test tab focus issues
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
    ],
  },
};

export default nextConfig;
