import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify-optimized settings
  output: "standalone", // Use standalone for Netlify
  images: {
    unoptimized: true, // For Netlify static export compatibility
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.s3.**.amazonaws.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.freepik.com" },
      { protocol: "https", hostname: "bucket-production-4a4a.up.railway.app" },
      { protocol: "https", hostname: "**.railway.app" },
    ],
  },
  // API rewrites for CORS
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
  // Experimental features for Tailwind v4
  experimental: {
    optimizePackageImports: ["@tailwindcss/postcss"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
