# Child Labor Project — Current Status

A snapshot of what the system is running on today, end to end. The system is
**live in real mode** (Supabase connected). For deeper detail see
[`HANDOFF.md`](./HANDOFF.md); for the setup checklist see
[`supabase/README.md`](./supabase/README.md).

---

## Runtime: what it's running on now

| Piece | Status | Running on |
|---|---|---|
| Frontend (web app) | ✅ Live | React 19 + TypeScript + Vite, hosted on **Vercel** (auto-deploy from GitHub `main`) |
| Database | ✅ Live | **Supabase PostgreSQL** |
| Authentication | ✅ Live | **Supabase Auth** (real email + password) |
| File storage | ✅ Live | **Supabase Storage** (`photos`, `cards`, `reports` buckets) |
| Server-side admin actions | ✅ Live | **Supabase Edge Functions** (Deno) |
| Security | ✅ Live | Row-Level Security (RLS) + super-admin-only Edge Functions |
| Source control | ✅ | GitHub — `github.com/YouShiaZ/child-labor-project` |

---

## Frontend (what the user sees)

**Pages:** Login · Dashboard · Offices · Office detail · Beneficiaries · New
beneficiary · Beneficiary detail · Analytics · Users · Not-found.

**Built with:** React 19, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui,
wouter (routing), recharts (charts), lucide (icons), sonner (toasts).

**Features working now:**
- **2 offices** (Cairo + Minya) with per-office dashboards and data isolation.
- **4 roles** — Super Admin, Office Admin, Editor, Viewer — with scoped access.
- **Approval workflow** — editors submit (pending); office admins approve.
- **Beneficiary intake** — full form (general, health, social, family, education,
  scholarship) + **image cropper** (fixed 512² portraits).
- **Progress reports** — quarterly / semi-annual / annual, per child, with a
  "photos over time" timeline.
- **Seasonal cards** — full-history gallery (Christmas / Easter), season-aware label.
- **Comprehensive annual reports** per office (Word / PDF upload + download).
- **Analytics** dashboard across offices.
- **Users & passwords** — super admin creates accounts and resets passwords; every
  user changes their own password.
- **Audit trail** — "Recent Activity" panel showing who did what (add/edit/approve/
  delete/leave), visible to managers.

---

## Backend (what runs on the server)

**Database tables (Supabase Postgres):**
`offices`, `app_users`, `projects`, `beneficiaries`, `seasonal_cards`,
`progress_reports`, `office_reports`, `leaving_records`, `activity_log`.

**Security — enforced in the database, not just the UI:**
- **RLS policies** put the role/office rules on every row: a user can only edit
  their own office's data; viewers are read-only; everyone reads, permissions bite
  on write. Helper functions: `can_edit_office`, `can_approve_office`, `auth_role`,
  `auth_office`.
- **Storage** writes are limited to each user's own office folder (`<office>/…`).
- **Edge Functions** (`admin-create-user`, `admin-reset-password`,
  `admin-delete-user`) run with the service key **server-side only**, and verify
  the caller is a super admin. The browser never holds the service key.
- **Auth** is real (hashed passwords, JWT sessions handled by Supabase).

**Data flow:** the app loads all data into memory on login (fast, synchronous UI),
and every change is written through to Supabase immediately. Files upload to
Storage and the row keeps the public URL.

---

## How it's wired
```
Browser (React SPA on Vercel)
   │  login / read / write  (anon key, RLS-protected)
   ▼
Supabase
   ├── Postgres   → all data, protected by RLS
   ├── Auth       → email + password, sessions
   ├── Storage    → photos / cards / reports  (per-office folders)
   └── Edge Funcs → create user / reset password / delete user (super-admin only)
```

Environment keys (set in Vercel): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## Accounts model
1 Super Admin (hidden from lists, managed privately) · 2 Office Admins (Cairo /
Minya) · Editors per office · Viewer(s) for sponsors. Super admin creates and
manages all of them in-app.

*Status date: July 2026 · Commit: `fd84cd6` · Live on Vercel + Supabase.*
