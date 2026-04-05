"use client";

import { useEffect, useState } from "react";

/** `true` only after mount — avoids SSR/client markup mismatch for browser-only APIs. */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
