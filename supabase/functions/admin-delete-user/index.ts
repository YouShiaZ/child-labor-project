// Edge Function: delete a staff account (super_admin only).
// Deleting the auth user cascades to the app_users row (FK on delete cascade).
import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, requireSuperAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = serviceClient();
    const callerId = await requireSuperAdmin(req, admin);

    const { userId } = await req.json();
    if (!userId) return json({ error: "Missing userId." }, 400);
    if (userId === callerId) return json({ error: "You cannot delete your own account." }, 400);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 403);
  }
});
