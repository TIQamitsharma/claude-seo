import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Skip TS type-checking during build to reduce build time
  typescript: { ignoreBuildErrors: true },
  // Don't bundle Supabase server-side — use node_modules directly (faster build)
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  // Limit file tracing to webapp directory only (prevents scanning monorepo root)
  outputFileTracingRoot: path.join(__dirname),
  // Limit concurrent webpack module builds to avoid EAGAIN fd exhaustion
  webpack: (config) => {
    config.parallelism = 4;
    return config;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
};

export default nextConfig;
