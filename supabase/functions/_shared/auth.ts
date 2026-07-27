// Shared helpers for Edge Functions: build a service-role client and verify that
// the caller is an active super_admin. Every admin action must call requireSuperAdmin.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Verifies the request's bearer token belongs to an active super_admin.
 * Returns the caller's user id, or throws an Error with an HTTP-ish message.
 */
export async function requireSuperAdmin(req: Request, admin: SupabaseClient): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Missing authorization token.");

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) throw new Error("Invalid session.");

  const { data: profile, error: profErr } = await admin
    .from("app_users")
    .select("role, active")
    .eq("id", userData.user.id)
    .single();

  if (profErr || !profile) throw new Error("No profile found.");
  if (profile.role !== "super_admin" || !profile.active) {
    throw new Error("Forbidden: super admin only.");
  }
  return userData.user.id;
}
