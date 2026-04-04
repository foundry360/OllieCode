const USERNAME_RE = /^[a-z0-9_]{2,32}$/;

/** Lowercase, trim, collapse — call before save. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns an error message, or null if the value is valid. */
export function validateUsernameNormalized(normalized: string): string | null {
  if (normalized.length < 2) {
    return "Pick at least 2 characters.";
  }
  if (normalized.length > 32) {
    return "Use at most 32 characters.";
  }
  if (!USERNAME_RE.test(normalized)) {
    return "Use letters, numbers, and underscores only (no spaces).";
  }
  return null;
}
