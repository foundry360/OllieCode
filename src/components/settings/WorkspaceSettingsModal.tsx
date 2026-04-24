"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AccountSettingsPanel,
  type AccountSettingsTabId,
} from "@/components/settings/AccountSettingsPanel";
import type { OllieAvatarId } from "@/lib/profiles/avatarAssets";

type WorkspaceSettingsModalProps = {
  open: boolean;
  activeTab: AccountSettingsTabId;
  onTabChange: (tab: AccountSettingsTabId) => void;
  onClose: () => void;
  portalReturnPath: string;
  onAvatarSaved?: (id: OllieAvatarId) => void;
};

export function WorkspaceSettingsModal({
  open,
  activeTab,
  onTabChange,
  onClose,
  portalReturnPath,
  onAvatarSaved,
}: WorkspaceSettingsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200020] flex items-center justify-center p-3 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-[min(96vw,78rem)] min-h-[min(72dvh,760px)] flex-col overflow-hidden rounded-[30px] border border-[#dbe4ea] bg-[#f8fafc] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]">
        <AccountSettingsPanel
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={onClose}
          portalReturnPath={portalReturnPath}
          onAvatarSaved={onAvatarSaved}
        />
      </div>
    </div>,
    document.body,
  );
}
