/** Must match the prefix sent from the Educators plan contact modal. */
export const EDUCATORS_CONTACT_INQUIRY_PREFIX = "[Educators plan inquiry]";

export function isEducatorsInquiryMessage(message: string | null | undefined): boolean {
  return (message?.trimStart() ?? "").startsWith(EDUCATORS_CONTACT_INQUIRY_PREFIX);
}

export function buildEducatorsContactInboxMessage(organization: string, body: string): string {
  const org = organization.trim();
  const orgLine = org ? `Organization / school: ${org}` : "Organization / school: (not provided)";
  return `${EDUCATORS_CONTACT_INQUIRY_PREFIX}\n\n${orgLine}\n\n---\n\n${body.trim()}`;
}
