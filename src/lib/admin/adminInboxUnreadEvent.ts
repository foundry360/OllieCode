/** Fired when inbox read state changes so the admin sidebar can refresh the unread badge. */
export const OLLIE_ADMIN_INBOX_UNREAD_REFRESH = "ollie:admin-inbox-unread-refresh";

export function dispatchAdminInboxUnreadRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OLLIE_ADMIN_INBOX_UNREAD_REFRESH));
}
