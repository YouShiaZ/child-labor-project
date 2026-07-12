# Child Labor Project — System Structure & Backend Specification

This document describes the **data model, roles, and API surface** the frontend expects, so the
backend can be implemented later without changing the UI. The current build is **frontend-only**
with mock data in `client/src/lib/mockData.ts` and shared types in `client/src/lib/types.ts`.

---

## 1. Roles & Authentication

There is **one Admin**. The Admin creates user accounts. Every non-admin user is exactly one of:

| Role     | Can do |
| -------- | ------ |
| `admin`  | Manage users (create/disable), full read/write on all data |
| `editor` | Create/edit beneficiaries, project details, progress reports, leaving records |
| `viewer` | Read-only access to everything (for sponsors, country director, managers) |

Suggested auth: email + password, JWT session. Frontend stores the current user in an
auth context (`client/src/contexts/AuthContext.tsx`). The login page is mock now; replace
`login()` with a call to `POST /api/auth/login`.

```
POST /api/auth/login      { email, password } -> { token, user }
POST /api/auth/logout
GET  /api/auth/me         -> { user }
```

### User
```
User {
  id: string
  fullName: string
  email: string
  role: "admin" | "editor" | "viewer"
  active: boolean
  createdAt: ISODate
}
```
Admin-only user management:
```
GET    /api/users
POST   /api/users         { fullName, email, role, password }
PATCH  /api/users/:id     { fullName?, role?, active? }
DELETE /api/users/:id
```

---

## 2. Project

A project groups beneficiaries. Fields requested by the user:

```
Project {
  id: string
  projectName: string
  countryName: string
  responsibleProjectManager: string
  responsibleSponsorshipOfficerIO: string
  responsibleCountryDirector: string
  createdAt: ISODate
  beneficiaryCount?: number   // derived
}
```
Endpoints:
```
GET   /api/projects
GET   /api/projects/:id
POST  /api/projects         (editor/admin)
PATCH /api/projects/:id     (editor/admin)
```

---

## 3. Beneficiary (the child)

The program runs **3 years** per child. A beneficiary belongs to a project and moves through
stages: `entry` -> `priority` -> `sponsored` -> `leaving`.

```
Beneficiary {
  id: string
  projectId: string
  beneficiaryNumber: string          // human-readable code
  status: "entry" | "priority" | "sponsored" | "leaving"

  // --- General (New Entry) ---
  firstName: string
  lastName: string
  dateOfBirth: ISODate               // age is COMPUTED on the client from this
  gender: "male" | "female"
  photoUrl?: string                  // uploaded portrait
  language: string
  village: string

  // --- Health Situation ---
  healthSituation: "good" | "average" | "poor"

  // --- Social issues ---
  hobbies: string[]                  // multi-select (Football, Drawing, Reading, ...)
  favoriteColor: string              // select
  character: string[]                // multi-select (Calm, Shy, Active, Kind, ...)

  // --- Family ---
  parentsAlive: "both" | "father" | "mother"
  liveWithBothParents: boolean
  liveWith: "both" | "father" | "mother" | "others"   // when not both parents
  hasSiblings: boolean
  siblingsCount?: number
  typeOfHouse: "mud_brick" | "reinforced_concrete"

  // --- Education ---
  schoolLevel: string
  schoolPerformance: "excellent" | "good" | "average" | "weak"
  favoriteSubject: string
  futurePlans: string

  createdAt: ISODate
}
```
Endpoints:
```
GET    /api/projects/:projectId/beneficiaries?status=entry|priority|sponsored|leaving|all
GET    /api/beneficiaries/:id
POST   /api/beneficiaries            (editor/admin)
PATCH  /api/beneficiaries/:id        (editor/admin)
POST   /api/beneficiaries/:id/photo  (multipart upload) -> { photoUrl }
```

### Age computation (client-side, no backend needed)
```
age = floor((today - dateOfBirth) / 1 year)
```

---

## 4. Individual Progress Report

A periodic update sent to the sponsor (the program is 3 years, typically yearly cycles).

```
ProgressReport {
  id: string
  beneficiaryId: string
  cycleYear: number               // 1..3
  date: ISODate
  updatePhotoUrl?: string
  messageToSponsor: string        // long text
  beneficiaryUpdate: string       // long text
  authorUserId: string
}
```
Endpoints:
```
GET   /api/beneficiaries/:id/reports
POST  /api/beneficiaries/:id/reports   (editor/admin)
PATCH /api/reports/:id                 (editor/admin)
```

---

## 5. Leaving Record ("Start Leaving")

When a child leaves the program, an editor starts a leaving record.

```
LeavingRecord {
  id: string
  beneficiaryId: string
  reason: "change_of_residence" | "death" | "joined_another_project" | "improved_living_standard"
  explanation?: string
  date: ISODate
  authorUserId: string
}
```
Starting a leaving record also sets the beneficiary `status` to `leaving`.
```
POST /api/beneficiaries/:id/leaving   (editor/admin) { reason, explanation, date }
GET  /api/beneficiaries/:id/leaving
```

---

## 6. Suggested backend stack (later phase)

- Runtime: Node.js (the project already ships an Express `server/` placeholder), or migrate to a
  Next.js API / standalone API. Keep the contract above identical.
- DB: PostgreSQL with tables `users`, `projects`, `beneficiaries`, `progress_reports`, `leaving_records`.
- File storage: object storage (S3-compatible) for `photoUrl` / `updatePhotoUrl`.
- Auth: JWT + bcrypt password hashing; role checks via middleware.

When wiring the backend, replace the mock functions in `client/src/lib/api.ts` (thin wrapper around
`mockData`) with real `fetch` calls to the endpoints above. The UI does not need to change.

---

## 7. Frontend file map (current build)

```
client/src/
  contexts/AuthContext.tsx     ← mock auth + current user role
  lib/types.ts                 ← all TypeScript interfaces above
  lib/options.ts               ← dropdown option lists (hobbies, colors, character, etc.)
  lib/mockData.ts              ← seed data
  lib/api.ts                   ← mock API layer (swap for real fetch later)
  components/AppLayout.tsx     ← navbar + page shell
  components/RoleGate.tsx      ← hides edit controls for viewers
  pages/Login.tsx
  pages/Dashboard.tsx
  pages/Projects.tsx
  pages/ProjectDetail.tsx      ← Project Details + Beneficiaries tabs
  pages/BeneficiaryDetail.tsx  ← Details Entry + Progress Reports + Leaving
  pages/NewBeneficiary.tsx     ← New Entry multi-section form
  pages/Users.tsx              ← Admin user management
```
