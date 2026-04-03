import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Required when another package-lock.json exists above this folder (e.g. home
    // directory). Without this, Next picks the wrong root and the app fails to load.
    root: path.join(__dirname),
  },
};

export default nextConfig;
