# Child Labor Project (CLP) — Engineering Handoff

Complete technical reference for the team taking this system to production
(custom domain + real backend + storage). Read this top-to-bottom once, then
use it as a map.

---

## 1. What this system is

An NGO **case-management system** that prevents child labor by supporting
vulnerable children through education, health, social and sponsorship follow-up.
The program runs across **two offices — Cairo and Minya** — over a 3-year cycle
per child. Staff enter beneficiary records; office admins approve them; sponsors
(viewers) can read everything and download files.

Language: **English only.** Brand: navy `#1B3A6B` + green `#3AAA35`.

---

## 2. Current state — read this first

The app runs in one of **two modes**, chosen automatically by whether the two
Supabase env vars are set (no code change needed to switch):

| | DEMO mode (no keys) | REAL mode (keys set) |
|---|---|---|
| Data | In-browser `localStorage` (per browser) | Supabase Postgres (shared) |
| Auth | Mock — matches email, any password | Supabase Auth (real passwords) |
| Files (photos/cards/reports) | base64 in `localStorage` | Supabase Storage buckets |
| Permissions | UI only | UI **+ database RLS** |
| Passwords | inactive | self-service change + super-admin reset |

**The backend is fully coded** — database schema, row-level security, storage,
real authentication, password management and secure admin Edge Functions are all
implemented. Turning it on is **provisioning, not development**: create a Supabase
project, run one SQL file, deploy 3 functions, set 2 env vars. Full checklist in
[`supabase/README.md`](./supabase/README.md).

The app ships **clean (no sample data)** — only the two offices and the staff
accounts are seeded. Until the keys are set it stays in demo mode; **do not enter
real child data until REAL mode is switched on.**

Where things live: the data/business layer is `client/src/lib/api.ts` (in-memory
cache + write-through), the Supabase calls are in `client/src/lib/db.ts`, the
client + mode flag in `client/src/lib/supabase.ts`, and auth + passwords in
`client/src/contexts/AuthContext.tsx`.

---

## 3. Tech stack

- **React 19** + **TypeScript 5.6** (strict), built with **Vite 7** → static SPA
- **wouter** (routing), **Tailwind CSS 4** + **shadcn/ui** (Radix) for UI
- **recharts** (analytics), **lucide-react** (icons), **sonner** (toasts)
- No server runtime — output is static files in `dist/public`
- Package manager: npm (a `package-lock.json` is committed)

---

## 4. Directory map

```
CLP-FINAL-PROJECT/
├── client/
│   ├── index.html                 # Vite entry (fonts, favicon, #root)
│   └── src/
│       ├── main.tsx               # React root
│       ├── App.tsx                # providers + ALL routes (Router)
│       ├── index.css              # Tailwind + brand design tokens
│       ├── pages/
│       │   ├── Login.tsx          # sign-in (mock auth)
│       │   ├── Dashboard.tsx      # program overview (both offices)
│       │   ├── Offices.tsx        # Cairo/Minya cards
│       │   ├── OfficeDetail.tsx   # per-office: Overview / Beneficiaries / Annual Reports
│       │   ├── Beneficiaries.tsx  # global list + office/status filters
│       │   ├── NewBeneficiary.tsx # full intake form (office from route)
│       │   ├── BeneficiaryDetail.tsx # tabs: Details / Progress Reports / Leaving + photo/cards
│       │   ├── Analytics.tsx      # charts across offices
│       │   ├── Users.tsx          # super-admin: account management
│       │   └── NotFound.tsx
│       ├── components/
│       │   ├── AppLayout.tsx      # navbar + user menu + Footer
│       │   ├── Footer.tsx         # developer credit + contact links
│       │   ├── RequireAuth.tsx    # route guard (auth + role)
│       │   ├── EditField.tsx      # inline label→value editor (canEdit-gated)
│       │   ├── ImageCropper.tsx   # square pan/zoom cropper → 512² JPEG
│       │   ├── MultiSelect.tsx    # tag multi-select
│       │   ├── ui-bits.tsx        # StatusPill / HealthPill / ApprovalPill / OfficePill / SectionCard
│       │   └── ui/                # shadcn primitives
│       ├── contexts/
│       │   ├── AuthContext.tsx    # current user + permission helpers
│       │   └── ThemeContext.tsx   # light/dark (forced light)
│       └── lib/
│           ├── types.ts           # ← ALL domain types (source of truth)
│           ├── mockData.ts        # ← seed: offices + accounts (no sample data)
│           ├── api.ts             # ← DATA LAYER + permission helpers (swap for Supabase)
│           ├── options.ts         # dropdown option lists + label maps
│           └── utils.ts           # cn() helper
├── supabase/
│   ├── schema.sql                 # tables + RLS + storage buckets (Phase 2)
│   └── README.md                  # Supabase setup steps
├── dist/public/                   # build output (gitignored)
├── netlify.toml / vercel.json     # SPA rewrite + build config + security headers
├── vite.config.ts / tsconfig.json / package.json
└── HANDOFF.md                     # this file
```

---

## 5. Routing (`client/src/App.tsx`)

| Path | Page | Guard |
|---|---|---|
| `/` | → `/dashboard` | — |
| `/login` | Login | public |
| `/dashboard` | Dashboard | signed in |
| `/offices` | Offices list | signed in |
| `/offices/:officeId` | Office detail | signed in |
| `/offices/:officeId/new-beneficiary` | New intake | super_admin / office_admin / editor (+ must own office) |
| `/beneficiaries` | Global list | signed in |
| `/beneficiaries/:id` | Beneficiary record | signed in |
| `/analytics` | Analytics | signed in |
| `/users` | Account management | **super_admin only** |
| `/project*`, `/projects*` | → `/offices` | legacy redirects |

Guard component: `components/RequireAuth.tsx` (redirects to `/login`, shows
"Access restricted" for wrong role, wraps children in `AppLayout`).

---

## 6. Domain model (`client/src/lib/types.ts`)

```
Office        { id, name, city, governorate }
Role          "super_admin" | "office_admin" | "editor" | "viewer"
User          { id, fullName, email, role, officeId|null, active }
Project       { id, projectName, countryName, responsible* }   // single program

Beneficiary {
  id, projectId, officeId, beneficiaryNumber (CLP-0001…), status,
  approvalStatus: "pending"|"approved", submittedByUserId, approvedByUserId, approvedAt,
  // General: firstName,lastName,dateOfBirth,gender,photoUrl,language,village
  // Health:  healthSituation good|average|poor
  // Social:  hobbies[], favoriteColor, character[]
  // Family:  parentsAlive, liveWith, hasSiblings, siblingsCount, typeOfHouse,
  //          guardianName, relationToChild
  // Education: schoolName, schoolLevel, schoolPerformance, favoriteSubject, futurePlans
  // Scholarship: tuitionFees, amountSponsored, additionalAid,
  //              scholarshipReason, scholarshipImpact
  seasonalCards: SeasonalCard[]      // full history, never overwritten
}
SeasonalCard  { id, url, season: "christmas"|"easter", year, uploadedAt }
ProgressReport{ id, beneficiaryId, reportType: quarterly|semi_annual|annual,
                period (Q1..Q4|H1/H2|Full Year), cycleYear 1..3, date,
                updatePhotoUrl, messageToSponsor, beneficiaryUpdate, authorUserId }
OfficeReport  { id, officeId, year, title, fileName, fileType: word|pdf, fileUrl,
                uploadedByUserId, uploadedAt }   // comprehensive annual office report
LeavingRecord { id, beneficiaryId, reason, explanation, date, authorUserId }
```

Relationships: `Office 1─* Beneficiary 1─* ProgressReport` / `1─* SeasonalCard`
/ `0..1 LeavingRecord`; `Office 1─* OfficeReport`. `age` is **computed**, never
stored (`computeAge`).

---

## 7. Permission model (the important part)

Roles and what they can do:

| Role | Read | Create/Edit/Delete | Approve forms | Manage accounts |
|---|---|---|---|---|
| **super_admin** | everything | **both** offices | both | yes |
| **office_admin** | everything | **own** office only | own office | no |
| **editor** | everything | own office (records start **pending**) | no | no |
| **viewer** | everything (+ analytics, + downloads) | nothing | no | no |

- **Office scoping:** a user opening the other office sees the data **read-only**
  (banner "Read-only – not your office"; edit/add/delete hidden).
- **Approval flow:** editors' new beneficiaries are `pending`; an office_admin
  (or super_admin) of that office approves them. Admin/super submissions
  auto-approve.
- Helper functions live in `lib/api.ts` and are surfaced via `AuthContext`:
  `canEditOffice(officeId)`, `canApprove(officeId)`, `canManageUsers`,
  `isSuperAdmin`, `canEditAny`.
- The super_admin account is intentionally **hidden** from the login screen and
  the Users table (managed privately).

> ⚠️ In Phase 1 these rules are **UI-only** (not security). Phase 2 enforces the
> exact same rules in the database via the RLS policies in `supabase/schema.sql`
> (functions `can_edit_office`, `can_approve_office`, `auth_role`, `auth_office`).

---

## 8. Data layer — the Phase-2 seam (`client/src/lib/api.ts`)

Every page imports data functions from here. To add the backend, replace the
bodies with Supabase calls; keep the signatures. Groups:

```
offices        listOffices, getOffice
users          listUsers, getUser, createUser, updateUser, deleteUser
project        getCurrentProject, getProject, updateProject
beneficiaries  listBeneficiaries(officeId?), getBeneficiary, nextBeneficiaryNumber,
               createBeneficiary, updateBeneficiary, approveBeneficiary
cards          addSeasonalCard, removeSeasonalCard
reports        listReports, listAllReports, createReport
office reports listOfficeReports, createOfficeReport, deleteOfficeReport
leaving        getLeaving, startLeaving
permissions    isSuperAdmin, canEditOffice, canApprove, canManageUsers, canViewAll
helpers        computeAge, getCurrentSeason, seasonalCardLabel, fileToDataUrl, downloadFile, resetStore
```

Persistence: hydrates a `store` from `localStorage["clp_store_v5"]`, seeded from
`mockData.ts`; every mutation re-persists. Bump `STORE_KEY` if the seed shape
changes.

---

## 9. Notable behaviors

- **Image cropper** (`ImageCropper.tsx`): child profile photo is framed with a
  pan/zoom square cropper and exported at a **fixed 512×512 JPEG**, so nothing is
  cut off unexpectedly and all portraits are uniform.
- **Photo timeline**: the entry photo stays fixed; each progress report's photo
  is added to a "Photos over time" strip on the profile.
- **Seasonal cards**: full history kept — a gallery of every Christmas/Easter
  card. The upload button auto-labels by season: Christmas window **Dec–Jan**,
  Easter window **Feb–May** (Coptic Christmas 7 Jan falls in the Christmas
  window). Change the windows in `getCurrentSeason()` in `api.ts`.
- **Comprehensive annual report**: per office, Word/PDF, covers all beneficiaries;
  under Office → "Comprehensive Annual Reports". Everyone can download.
- **Individual progress reports**: per child, quarterly / semi-annual / annual,
  with duplicate-prevention per (type, period, year).

---

## 10. Accounts (staff)

Seeded accounts (in `mockData.ts`; in Phase 2 recreate them as Supabase Auth
users and set real passwords):

| Email | Role | Office |
|---|---|---|
| super@clp.org | Super Admin | — (both) |
| admin.cairo@clp.org | Office Admin | Cairo |
| admin.minya@clp.org | Office Admin | Minya |
| editor1.cairo@clp.org | Editor | Cairo |
| editor2.cairo@clp.org | Editor | Cairo |
| editor1.minya@clp.org | Editor | Minya |
| editor2.minya@clp.org | Editor | Minya |
| viewer@clp.org | Viewer | — |

**Phase 1 passwords:** auth is mock — *any* password signs you in (email must
match). **Phase 2:** set real passwords in Supabase Auth.

---

## 11. Local development

```bash
# one-time (the old node_modules had platform-specific junk; reinstall clean)
rm -rf node_modules
npm install

npm run check     # TypeScript (tsc --noEmit)
npm run dev       # http://localhost:3000
npm run build     # → dist/public
npm run preview   # serve the build
```

---

## 12. Deploy (GitHub + Vercel)

Repo: `https://github.com/YouShiaZ/child-labor-project` → Vercel auto-deploys on
push. Vercel reads `vercel.json`:
- Build: `npm run build` · Output: `dist/public` · Install: `npm install`

SPA note: unknown paths must rewrite to `/index.html` (already configured in both
`vercel.json` and `netlify.toml`) or deep links 404 on refresh. Security headers
(`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) are set there
too.

**Custom subdomain:** Vercel → Project → Settings → Domains → add e.g.
`clp.yourdomain.com`, then create the shown `CNAME` at your DNS provider. HTTPS is
automatic. No code change needed.

**Env var for Phase 2:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in
Vercel → Settings → Environment Variables (Vite only exposes `VITE_`-prefixed
vars). Read via `import.meta.env`.

---

## 13. Turning on the real backend (provisioning only)

The integration is already written. Full checklist in
[`supabase/README.md`](./supabase/README.md). In short: create a Supabase project
→ run `supabase/schema.sql` → seed the first super admin → deploy the 3 Edge
Functions (`supabase/functions/`) → set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
→ redeploy. The app then switches to real mode automatically; the super admin
creates all other accounts in-app.

**Passwords & accounts:** each user changes their own password from the top-right
menu (`ChangePasswordDialog`, via `supabase.auth.updateUser`). The super admin
creates / deletes accounts and resets any password from the Users page — these go
through the secure Edge Functions, which run with the service-role key server-side
and verify the caller is a super admin. The anon key in the browser can never
perform admin actions.

**Storage sizing:** compressed photos ≈ 50–100 KB each; ~1,000 children × a few
images ≈ **0.5–1 GB**. Word/PDF reports add a little. **5 GB is comfortable.**
Use **object storage** (Supabase Storage / S3 / Cloudflare R2) — not shared web
hosting. Supabase Storage free tier = 1 GB; paid ≈ 100 GB. An existing S3-compatible
store can be reused with a dedicated CLP bucket.

---

## 14. Known limitations before going live

1. Real mode requires provisioning (section 13) — until then data is per-browser.
2. Progress reports are not locked after approval (spec wants immutability) — add
   a DB rule if required.
3. Plan Supabase DB backups — records are retained 2–3 years.
4. The client bundle is a single chunk (~325 KB gzip); fine to ship, can be
   code-split later if desired.
