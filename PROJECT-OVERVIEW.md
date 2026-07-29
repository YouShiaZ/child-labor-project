# Child Labor Project (CLP) — Technical Overview

A concise snapshot of the system as it stands today. For the full engineering
handoff see [`HANDOFF.md`](./HANDOFF.md); for backend activation see
[`supabase/README.md`](./supabase/README.md).

---

## What it is
A web-based **case-management system** for a child-labor prevention program run
across **two offices — Cairo & Minya**. Staff register children (beneficiaries),
follow up over a 3-year cycle, and produce reports for sponsors.

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, built with Vite (single-page app) |
| Styling / UI | Tailwind CSS 4 + shadcn/ui, lucide icons, recharts (charts) |
| Routing | wouter |
| Backend | **Supabase** — PostgreSQL database + Auth + Storage |
| Security | Row-Level Security (RLS) + secure server-side Edge Functions (Deno) |
| Hosting | Vercel (static SPA) + custom domain; auto-deploy from GitHub |

## Main features
- **Two offices** with per-office dashboards and data isolation.
- **4 roles:** Super Admin, Office Admin, Editor, Viewer — each with scoped access.
- **Approval workflow:** editors submit records; office admins approve.
- **Beneficiary profiles:** full intake form (general, health, social, family,
  education, scholarship) + photo cropper (fixed 512² portraits).
- **Progress reports:** quarterly / semi-annual / annual, per child.
- **Seasonal thank-you cards:** full history gallery (Christmas / Easter).
- **Comprehensive annual reports** per office (Word / PDF upload & download).
- **Analytics** dashboard across offices.
- **Account & password management:** users change their own password; super admin
  creates accounts and resets any password.

## Architecture at a glance
```
React SPA (Vercel)
   │  reads/writes via one data layer (lib/api.ts)
   ▼
Supabase
   ├── PostgreSQL  (data, protected by RLS = per-office permissions)
   ├── Auth        (real email + password login)
   ├── Storage     (photos / cards / reports, per-office folders)
   └── Edge Funcs  (super-admin: create user / reset password / delete user)
```

## Security highlights
- Permissions enforced in the **database** (RLS), not just the UI.
- Admin actions (create/delete users, reset passwords) run **server-side** with a
  service key never exposed to the browser, and require a verified super admin.
- File uploads are restricted to each user's own office folder.

## Current status
- **Frontend + backend integration: complete and building green** (TypeScript
  clean, production build passing).
- Runs in **two modes** (auto-selected by env keys):
  - **Demo** (no keys) — data in the browser, mock login. Deployable for review.
  - **Real** (keys set) — shared database, real auth, storage, passwords.
- Ships **clean** (no sample data) — only the two offices + staff accounts seeded.
- **Remaining = provisioning, not development:** create a Supabase project, run one
  SQL file, deploy 3 functions, set 2 env vars, connect the domain.

---
*Last updated: July 2026 · Repo: github.com/YouShiaZ/child-labor-project*
