// Edge Function: reset any user's password (super_admin only).
import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, requireSuperAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = serviceClient();
    await requireSuperAdmin(req, admin);

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) return json({ error: "Missing fields." }, 400);
    if (String(newPassword).length < 8) return json({ error: "Password too short." }, 400);

    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 403);
  }
});
