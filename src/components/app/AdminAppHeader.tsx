"use client";

import { useMemo } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import {
  SignedInAppHeader,
  type AdminHeaderSection,
} from "@/components/app/SignedInAppHeader";

/** Admin shell header — matches Learning Hub (lime bar, logo, pills) + Dashboard / Lessons. */
export function AdminAppHeader() {
  const segments = useSelectedLayoutSegments();

  const adminActive = useMemo((): AdminHeaderSection => {
    if (segments[0] === "lessons") return "lessons";
    return "dashboard";
  }, [segments]);

  return <SignedInAppHeader admin={{ active: adminActive }} />;
}
