import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authEmailLocalPart } from "@/lib/auth/authEmailDomain";
import { normalizeUsername } from "@/lib/profiles/username";

function adminCodenamesFromEnv(): Set<string> {
  const raw = process.env.OLLIE_ADMIN_USERNAMES?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => normalizeUsername(s))
      .filter(Boolean),
  );
}

/**
 * Platform admins: `profiles.is_admin`, or codename listed in `OLLIE_ADMIN_USERNAMES`
 * (comma-separated, matches synthetic auth email local part).
 */
export async function isAdminUser(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  if (!user?.id) return false;

  const envAllow = adminCodenamesFromEnv();
  const local = authEmailLocalPart(user.email);
  if (local && envAllow.has(normalizeUsername(local))) {
    return true;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return false;
  return Boolean(data.is_admin);
}
