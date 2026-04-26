/**
 * @file Next.js Configuration
 * @description Production configuration for the Appointly platform.
 *
 * Key settings:
 *   - output: standalone —optimizes for Vercel serverless deployment
 *   - images: allows external image domains (user avatars from Google OAuth)
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images from external sources (Google user avatars)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
        pathname: "/**",
      },
    ],
  },

  // Silence known harmless warnings from certain dependencies
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
