"use client";

import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";

/** Admin shell header — dark bar + logo; section nav is in the sidebar. */
export function AdminAppHeader() {
  return <SignedInAppHeader adminPortal />;
}
