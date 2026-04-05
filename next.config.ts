import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Required when another package-lock.json exists above this folder (e.g. home
    // directory). Without this, Next picks the wrong root and the app fails to load.
    root: path.join(__dirname),
  },
  /** Browsers request `/favicon.ico` by default; asset lives at `public/images/favicon.ico`. */
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/images/favicon.ico" }];
  },
};

export default nextConfig;
