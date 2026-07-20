# Supabase backend (Phase 2)

This folder holds the database design for the real backend. It is **not wired
into the app yet** — Phase 1 still runs on `localStorage`. When you're ready:

## 1. Create the project
- Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
- Note the **Project URL** and **anon public key** (Settings → API).

## 2. Create the schema
- Open the SQL Editor → paste `schema.sql` → Run. (Run **once** on a fresh DB.)
- This creates all tables, the RLS policies (which mirror the app's per-office
  permissions), and the `photos` / `cards` / `reports` storage buckets.

## 3. Create the accounts
- Authentication → Users → add each person (email + password):
  - 1 super admin, 2 office admins, 4 editors, 1 viewer.
- For each, insert a matching row in `app_users` with their `id` (the auth uid),
  `role`, and `office_id` (`office-cairo` / `office-minya`; leave null for
  super admin & viewer).

## 4. Wire the frontend
- `npm install @supabase/supabase-js`
- Add env vars (Vercel → Settings → Environment Variables, and a local `.env`):
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  ```
- Replace the bodies in `client/src/lib/api.ts` with Supabase queries and swap
  `AuthContext.login` for `supabase.auth.signInWithPassword`. Signatures stay the
  same, so the UI doesn't change. Upload files to the storage buckets using the
  path convention `"<office_id>/<filename>"` (the RLS policies key off the first
  path segment).

## Security model (enforced in the database, not just the UI)
| Role         | Read        | Edit                    | Approve | Manage users |
|--------------|-------------|-------------------------|---------|--------------|
| super_admin  | everything  | both offices            | both    | yes          |
| office_admin | everything  | own office only         | own     | no           |
| editor       | everything  | own office (pending)    | no      | no           |
| viewer       | everything  | nothing                 | no      | no           |
