/** True when PostgREST/Postgres indicates `contact_inbox_messages` is absent. */
export function isContactInboxMissing(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("contact_inbox_messages") &&
    (m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find") ||
      m.includes("pgrst205") ||
      m.includes("42p01"))
  );
}
