# Backend activation (Supabase)

The backend is **fully coded** — database schema, row-level security, storage,
real authentication, and password management are all implemented in the app.
Nothing here needs new development; this is a **provisioning checklist**. Until
these steps are done the app runs in demo mode (localStorage, mock auth).

```
supabase/
├── schema.sql                     # tables + RLS + storage buckets + seed offices
└── functions/                     # secure server-side admin actions (Deno)
    ├── admin-create-user/         # super-admin: create a staff account
    ├── admin-reset-password/      # super-admin: reset anyone's password
    └── admin-delete-user/         # super-admin: delete a staff account
```

## 1. Create the project
- [supabase.com](https://supabase.com) → New project (free tier is fine to start).
- Copy the **Project URL** and **anon public** key (Settings → API).

## 2. Create the schema
- SQL Editor → paste `schema.sql` → **Run** (once, on a fresh DB).
- Then run each file in `supabase/migrations/` **in order** (`001_…`, `002_…`).
  Migration 002 adds the approval queue and the editor write-hardening
  (editors can't change approved data directly — everything goes through an
  office-admin approval).
- Creates all tables, the RLS policies (the app's per-office permissions enforced
  in the database), the `photos` / `cards` / `reports` storage buckets, and the
  two offices + program row.

## 3. Create the first Super Admin (bootstrap)
Everything else can be done in-app, but the first super admin must be seeded:
1. Authentication → Users → **Add user** (email + password, mark "Auto Confirm").
2. Copy that user's **UID**, then in the SQL Editor run:
   ```sql
   insert into app_users (id, full_name, email, role, office_id, active)
   values ('<PASTE-UID>', 'Program Director', 'super@yourdomain.org', 'super_admin', null, true);
   ```
After this, the super admin signs in and creates **all other accounts** from the
Users page (no more manual SQL).

## 4. Deploy the Edge Functions
These run the admin actions server-side with the service-role key (never exposed
to the browser) and verify the caller is a super admin.
```bash
npm i -g supabase          # Supabase CLI
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy admin-create-user
supabase functions deploy admin-reset-password
supabase functions deploy admin-delete-user
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
by Supabase automatically — no manual secrets needed.

## 5. Point the app at Supabase
Set two env vars in your host (Vercel → Settings → Environment Variables) and
locally in `.env.local`:
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```
Redeploy. The app auto-switches to real mode: shared database, real login,
storage-backed images/documents, and working password management.

## 6. Verify
- Sign in as the super admin → create an Office Admin and an Editor.
- Editor adds a beneficiary → it appears as **pending** for the whole office.
- Office Admin approves it; a Viewer (or the other office) sees it read-only.
- Upload a photo/card/report → confirm the file lands in the matching bucket
  under `<office_id>/…`.
- Each user can change their own password (top-right menu); super admin can
  reset anyone's from the Users page.

---

## Security model (enforced in the database, not just the UI)
| Role | Read | Edit | Approve | Manage accounts |
|---|---|---|---|---|
| super_admin | everything | both offices | both | yes |
| office_admin | everything | own office | own office | no |
| editor | everything | own office (pending) | no | no |
| viewer | everything | nothing | no | no |

- RLS policies (`can_edit_office`, `can_approve_office`, `auth_role`,
  `auth_office`) enforce the table above on every read/write.
- Storage writes are limited to a user's own office folder (`<office_id>/…`).
- The service-role key lives only inside the Edge Functions (server-side); the
  browser only ever holds the anon key.
- Account creation / deletion / password reset require a verified super admin.

## Storage sizing
Compressed photos ≈ 50–100 KB each; ~1,000 children × a few images ≈ 0.5–1 GB.
Word/PDF reports add a little. **5 GB is comfortable.** Supabase Storage free tier
= 1 GB; paid ≈ 100 GB. Any S3-compatible store (S3 / R2 / Spaces / MinIO) can be
used instead of Supabase Storage if preferred — keep a dedicated CLP bucket.
