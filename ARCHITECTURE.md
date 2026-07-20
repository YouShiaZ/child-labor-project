# Child Labor Project — Architecture & Developer Handoff

> Technical reference for the engineer taking this project to production
> (custom subdomain + persistent storage + real backend).
> Current state: **frontend-only SPA**, data lives in the browser (`localStorage`).
> Auth is mocked. No server, no database, no file storage yet.

---

## 1. Stack

| Layer        | Choice                                    | Notes |
|--------------|-------------------------------------------|-------|
| Language     | TypeScript 5.6 (strict)                   | `noEmit`, bundler resolution |
| UI           | React 19                                  | function components + hooks only |
| Build        | Vite 7                                     | root = `client/`, output = `dist/public` |
| Router       | wouter 3                                   | tiny client-side router, hash-free |
| Styling      | Tailwind CSS 4 + `tw-animate-css`         | tokens via CSS vars, no config file |
| Components   | shadcn/ui (Radix primitives)              | 53 primitives in `client/src/components/ui/` |
| Forms        | react-hook-form + zod                     | present as deps; most forms still use local `useState` |
| Icons        | lucide-react                              | |
| Toasts       | sonner                                    | mounted once in `App.tsx` |
| Charts       | recharts                                  | available, not yet used |

No backend runtime. `package.json` has **no** `express`/server deps anymore — this is a pure static build.

---

## 2. Directory map

```
CLP-FINAL-PROJECT/
├── client/
│   ├── index.html                  # Vite entry; loads /src/main.tsx, fonts, favicon
│   ├── public/
│   │   └── favicon.png             # logo (used as app icon + login lockup)
│   └── src/
│       ├── main.tsx                # createRoot(...).render(<App/>)
│       ├── App.tsx                 # providers + <Router> (ALL routes defined here)
│       ├── index.css               # Tailwind import + design tokens (brand colors)
│       │
│       ├── pages/                  # one component per route
│       │   ├── Login.tsx           # mock sign-in, demo account buttons
│       │   ├── Dashboard.tsx       # KPI stats + recent beneficiaries table
│       │   ├── ProjectDetail.tsx   # THE single project: details + beneficiary table
│       │   ├── Beneficiaries.tsx   # global list, status sub-tabs + search
│       │   ├── NewBeneficiary.tsx  # full intake form (all sections)
│       │   ├── BeneficiaryDetail.tsx  # tabs: Details / Progress Reports / Leaving
│       │   ├── Users.tsx           # admin-only user management
│       │   └── NotFound.tsx
│       │
│       ├── components/
│       │   ├── AppLayout.tsx       # top navbar + user menu (page shell)
│       │   ├── RequireAuth.tsx     # route guard (auth + role gate)
│       │   ├── EditField.tsx       # inline label→value editor (text/select)
│       │   ├── MultiSelect.tsx     # tag-style multi picker (hobbies, character)
│       │   ├── ui-bits.tsx         # SectionCard, StatusPill, HealthPill
│       │   ├── ErrorBoundary.tsx
│       │   └── ui/                 # shadcn primitives (button, dialog, select, ...)
│       │
│       ├── contexts/
│       │   ├── AuthContext.tsx     # current user, login/logout, isRole, canEdit
│       │   └── ThemeContext.tsx    # light/dark (dark prepared, disabled by default)
│       │
│       ├── hooks/                  # useMobile, useComposition, usePersistFn
│       │
│       └── lib/
│           ├── types.ts            # ← ALL domain interfaces (source of truth)
│           ├── mockData.ts         # ← seed data + PROJECT_ID
│           ├── api.ts              # ← DATA LAYER. swap this for real HTTP calls
│           ├── options.ts          # dropdown option lists + label maps
│           └── utils.ts            # cn() classnames helper
│
├── dist/public/                    # build output (gitignored)
├── vite.config.ts                  # alias @ → client/src ; build/preview config
├── tsconfig.json
├── netlify.toml                    # SPA redirect + build settings
├── vercel.json                     # SPA rewrite + build settings
├── STRUCTURE.md                    # backend/API contract spec (READ THIS for the API)
├── ARCHITECTURE.md                 # this file
└── DEPLOY.md                       # deploy steps (Arabic)
```

**The whole data/business layer is 4 files:** `lib/types.ts`, `lib/mockData.ts`, `lib/api.ts`, `lib/options.ts`. Everything else is UI.

---

## 3. Routing (`client/src/App.tsx`)

Single source of truth for navigation. This is a **single-project** system — there is no project list.

| Path                        | Component          | Guard            |
|-----------------------------|--------------------|------------------|
| `/`                         | → redirect `/dashboard` | — |
| `/login`                    | `Login`            | public |
| `/dashboard`                | `Dashboard`        | auth |
| `/project`                  | `ProjectDetail`    | auth |
| `/project/new-beneficiary`  | `NewBeneficiary`   | auth + `admin\|editor` |
| `/beneficiaries`            | `Beneficiaries`    | auth |
| `/beneficiaries/:id`        | `BeneficiaryDetail`| auth |
| `/users`                    | `Users`            | auth + `admin` |
| `/projects`, `/projects/:id`| → redirect `/project` | legacy compatibility |
| `*`                         | `NotFound`         | — |

Guard logic lives in `components/RequireAuth.tsx`: no user → redirect `/login`; wrong role → "Access restricted" page. It also wraps children in `AppLayout`.

---

## 4. Domain model (`client/src/lib/types.ts`)

```ts
Role = "admin" | "editor" | "viewer"

User        { id, fullName, email, role, active, createdAt }
Project     { id, projectName, countryName,
              responsibleProjectManager, responsibleSponsorshipOfficerIO,
              responsibleCountryDirector, createdAt }

BeneficiaryStatus = "entry" | "priority" | "sponsored" | "leaving"
Beneficiary {
  id, projectId, beneficiaryNumber, status,
  // General
  firstName, lastName, dateOfBirth, gender, photoUrl?, language, village,
  // Health
  healthSituation: "good" | "average" | "poor",
  // Social
  hobbies: string[], favoriteColor, character: string[],
  // Family
  parentsAlive: "both"|"father"|"mother", liveWithBothParents,
  liveWith: "both"|"father"|"mother"|"others",
  hasSiblings, siblingsCount?, typeOfHouse: "mud_brick"|"reinforced_concrete",
  // Education
  schoolLevel, schoolPerformance: "excellent"|"good"|"average"|"weak",
  favoriteSubject, futurePlans,
  createdAt
}

ReportType = "quarterly" | "semi_annual" | "annual"
ProgressReport {
  id, beneficiaryId,
  reportType, period,      // period: "Q1..Q4" | "H1"/"H2" | "Full Year"
  cycleYear,               // 1..3 (program year)
  date, updatePhotoUrl?, messageToSponsor, beneficiaryUpdate, authorUserId
}

LeavingReason = "change_of_residence" | "death"
              | "joined_another_project" | "improved_living_standard"
LeavingRecord { id, beneficiaryId, reason, explanation?, date, authorUserId }
```

Relationships: one `Project` → many `Beneficiary` → many `ProgressReport`, and 0..1 `LeavingRecord`.
`age` is **never stored** — always computed from `dateOfBirth` via `computeAge()`.

---

## 5. Data layer (`client/src/lib/api.ts`) — the integration seam

Every page imports its data functions from here. **This is the only file you rewrite to add a backend.** Function signatures are the API contract; keep them, change the bodies from `localStorage` reads to `fetch`.

Current behavior:
- On load, hydrates an in-memory `store` from `localStorage["clp_store_v2"]`, falling back to seed data in `mockData.ts`.
- Every mutation calls `persist()` → writes the whole store back to `localStorage`.
- `clone()` = JSON deep-clone (avoids `structuredClone` for older-browser safety).

Exposed functions (group → signature):

```ts
// users
listUsers(): User[]
createUser(Omit<User,"id"|"createdAt">): User
updateUser(id, Partial<User>): User
deleteUser(id): void

// project (single-project system)
getCurrentProject(): Project          // ← use this, not a list
getProject(id): Project | undefined
updateProject(id, Partial<Project>): Project

// beneficiaries
listBeneficiaries(projectId?): Beneficiary[]
getBeneficiary(id): Beneficiary | undefined
nextBeneficiaryNumber(): string       // "CLP-0001" sequential
createBeneficiary(...): Beneficiary
updateBeneficiary(id, patch): Beneficiary

// progress reports
listReports(beneficiaryId): ProgressReport[]   // newest first
listAllReports(): ProgressReport[]
createReport(Omit<ProgressReport,"id">): ProgressReport

// leaving
getLeaving(beneficiaryId): LeavingRecord | undefined
startLeaving(...): LeavingRecord       // also sets beneficiary.status = "leaving"

// helpers
computeAge(dateOfBirth): number | null
fileToDataUrl(file, maxSize=512): Promise<string>   // downscales img → base64
resetStore(): void
```

### Backend mapping
The REST contract these should call is fully specified in **`STRUCTURE.md`** (auth, users, projects, beneficiaries, reports, leaving, photo upload). Recommended production stack: Node + PostgreSQL + Prisma + JWT/NextAuth. To wire it:
1. Replace each function body with a `fetch`/axios call to the matching endpoint.
2. Make them `async` and update callers to `await` (most call sites already handle promises for photo upload).
3. Delete `mockData.ts` seeding once the DB is source of truth (or keep as a seed script).

---

## 6. Auth (`client/src/contexts/AuthContext.tsx`) — mock, replace

- `login(email, password)` matches email against seeded users; **any password passes**.
- Current user persists in `localStorage["clp_auth_user"]`.
- Exposes `isRole(...roles)` and `canEdit` (`admin`/`editor`).
- **Role gating is UI-only** (buttons hidden for viewers). This is NOT security — the real backend must enforce roles server-side on every mutation.

Production: replace `login()` with `POST /api/auth/login` → `{ token, user }`, store token (httpOnly cookie preferred over localStorage), send it on every request, add `GET /api/auth/me` for session restore.

---

## 7. Photos / file storage — where to plug object storage

Today `fileToDataUrl()` reads an uploaded image, downscales it to ≤512px, and stores a **base64 data URL** inside the beneficiary/report record (so it survives refresh in `localStorage`). This does not scale.

Production path:
1. Add `POST /api/beneficiaries/:id/photo` (multipart) and `POST /api/reports/:id/photo`.
2. Upload to S3-compatible object storage (S3 / R2 / Spaces / MinIO).
3. Store the returned public/CDN URL in `photoUrl` / `updatePhotoUrl` instead of base64.
4. Swap the two call sites (`NewBeneficiary.tsx`, `BeneficiaryDetail.tsx` photo dialog + report form) from `fileToDataUrl` to the upload call. The `<img src>` usage stays identical.

Upload call sites to change: search the codebase for `fileToDataUrl`.

---

## 8. Design tokens (`client/src/index.css`)

Brand colors are CSS variables, consumed by Tailwind utilities and `var(--color-brand-*)`:

```
--color-brand-navy:  #1B3A6B   (primary: nav, buttons, headers)
--color-brand-green: #3AAA35   (accent: active states, success, leaf)
--font-display: Poppins  (headings)
--font-sans:    Inter    (body/data)
```

Fonts are loaded from Google Fonts in `client/index.html`. Dark mode variables exist but the app is forced light (`ThemeProvider defaultTheme="light"`).

---

## 9. Build, env & deployment

```bash
npm install
npm run check     # tsc --noEmit
npm run dev       # http://localhost:3000
npm run build     # → dist/public  (static)
npm run preview   # serve the build
```

- Output is a **static SPA** in `dist/public`. No Node server required to host it.
- `vite.config.ts`: `root = client/`, alias `@ → client/src`, `envDir` = repo root.
- **Env vars:** none required today. When the backend lands, add `VITE_API_BASE_URL` (Vite exposes only `VITE_`-prefixed vars to the client) and read it via `import.meta.env.VITE_API_BASE_URL`. Set it per-environment in Vercel/Netlify dashboards.

### SPA routing requirement
Because routing is client-side, the host **must** rewrite all unknown paths to `/index.html`, otherwise deep links (e.g. `/beneficiaries/b-1`) 404 on refresh. Already configured:
- `vercel.json` → `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`
- `netlify.toml` → `redirect /* → /index.html 200`

### Subdomain
Deploy on Vercel, then in **Project → Settings → Domains** add e.g. `clp.yourdomain.com` and create the shown `CNAME` record at your DNS provider (points to `cname.vercel-dns.com`). HTTPS is issued automatically. No app code changes needed — origin is read at runtime.

Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) are already set in both `vercel.json` and `netlify.toml`.

---

## 10. Known gaps before real use

1. **No backend / DB** — data is per-browser, not shared. (spec ready in `STRUCTURE.md`)
2. **Mock auth** — any password works; roles enforced only in UI.
3. **Photos as base64** — move to object storage.
4. **No pagination / server search** — fine for demo volumes only.
5. **Reports are not immutable** — spec wants approval + lock; not implemented.
6. Data retention target is 2–3 years → plan backups on the DB, not the browser.
```
