// Edge Function: create a staff account (super_admin only).
// Creates the Supabase Auth user + the matching app_users row.
import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, requireSuperAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = serviceClient();
    await requireSuperAdmin(req, admin);

    const { fullName, email, password, role, officeId } = await req.json();
    if (!fullName || !email || !password) return json({ error: "Missing fields." }, 400);
    if (String(password).length < 8) return json({ error: "Password too short." }, 400);
    const validRoles = ["super_admin", "office_admin", "editor", "viewer"];
    if (!validRoles.includes(role)) return json({ error: "Invalid role." }, 400);
    const office = role === "office_admin" || role === "editor" ? officeId : null;
    if ((role === "office_admin" || role === "editor") && !office)
      return json({ error: "Office required for this role." }, 400);

    // 1) Create the auth user (email pre-confirmed).
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (cErr || !created.user) return json({ error: cErr?.message ?? "Create failed." }, 400);

    // 2) Create the profile row.
    const { data: row, error: pErr } = await admin
      .from("app_users")
      .insert({ id: created.user.id, full_name: fullName, email, role, office_id: office, active: true })
      .select()
      .single();
    if (pErr) {
      // roll back the auth user if the profile insert fails
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: pErr.message }, 400);
    }

    return json({
      user: {
        id: row.id, fullName: row.full_name, email: row.email, role: row.role,
        officeId: row.office_id, active: row.active, createdAt: row.created_at,
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 403);
  }
});
