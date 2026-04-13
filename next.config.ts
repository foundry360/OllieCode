import type { NextConfig } from "next";
import path from "node:path";

function supabaseStorageImagePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    const hostname = new URL(raw).hostname;
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const supabaseImageRemote = supabaseStorageImagePattern();

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
  images: {
    remotePatterns: supabaseImageRemote ? [supabaseImageRemote] : [],
  },
};

export default nextConfig;
