import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Prevent webpack from bundling Supabase server packages — load from node_modules at runtime
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  // Scope file tracing to webapp/ only so webpack doesn't scan the monorepo root
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.parallelism = 4;
    return config;
  },
};

export default nextConfig;
