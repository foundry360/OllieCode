"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AccountSettingsPanel,
  normalizeAccountSettingsTab,
  type AccountSettingsTabId,
} from "@/components/settings/AccountSettingsPanel";

export function SettingsPageShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = normalizeAccountSettingsTab(searchParams.get("tab"));

  const handleTabChange = useCallback(
    (tab: AccountSettingsTabId) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", tab);
      router.replace(`/settings?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <AccountSettingsPanel
      activeTab={activeTab}
      onTabChange={handleTabChange}
      portalReturnPath={`/settings?tab=${activeTab}`}
    />
  );
}
