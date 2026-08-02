// Child Labor Project — seed data.
//
// Beneficiary / report data is intentionally EMPTY: the system ships clean and
// ready for real data entry. Only the structural rows are seeded:
//   - the two offices (Cairo + Minya)
//   - the program row
//   - the staff accounts (so the team can sign in)
// In Phase 2 (Supabase) these same rows are inserted by supabase/schema.sql and
// the accounts become real Supabase Auth users.
import type {
  User,
  Office,
  Project,
  Beneficiary,
  ProgressReport,
  OfficeReport,
  LeavingRecord,
} from "./types";

// The program runs across TWO offices.
export const OFFICE_CAIRO = "office-cairo";
export const OFFICE_MINYA = "office-minya";

export const offices: Office[] = [
  { id: OFFICE_CAIRO, name: "Cairo Office", city: "Cairo", governorate: "Cairo", code: "CAI", createdAt: "2024-01-10" },
  { id: OFFICE_MINYA, name: "Minya Office", city: "Minya", governorate: "Minya", code: "MIN", createdAt: "2024-01-10" },
];

// The single program (kept for reporting / API contract).
export const PROJECT_ID = "p-1";

export const projects: Project[] = [
  {
    id: PROJECT_ID,
    projectName: "Child Labor Project",
    countryName: "Egypt",
    responsibleProjectManager: "",
    responsibleSponsorshipOfficerIO: "",
    responsibleCountryDirector: "",
    createdAt: "2024-01-15",
  },
];

// Staff accounts: 1 super admin, 2 office admins, 4 editors (2 per office), 1 viewer.
// (Phase 1 mock auth accepts any password; Phase 2 uses real Supabase passwords.)
export const users: User[] = [
  { id: "u-super",       fullName: "Program Director",     email: "super@clp.org",         role: "super_admin",  officeId: null,         active: true, createdAt: "2024-01-10" },
  { id: "u-admin-cairo", fullName: "Cairo Office Manager", email: "admin.cairo@clp.org",   role: "office_admin", officeId: OFFICE_CAIRO, active: true, createdAt: "2024-01-12" },
  { id: "u-admin-minya", fullName: "Minya Office Manager", email: "admin.minya@clp.org",   role: "office_admin", officeId: OFFICE_MINYA, active: true, createdAt: "2024-01-12" },
  { id: "u-ed-cairo-1",  fullName: "Cairo Editor 1",       email: "editor1.cairo@clp.org", role: "editor",       officeId: OFFICE_CAIRO, active: true, createdAt: "2024-02-01" },
  { id: "u-ed-cairo-2",  fullName: "Cairo Editor 2",       email: "editor2.cairo@clp.org", role: "editor",       officeId: OFFICE_CAIRO, active: true, createdAt: "2024-02-01" },
  { id: "u-ed-minya-1",  fullName: "Minya Editor 1",       email: "editor1.minya@clp.org", role: "editor",       officeId: OFFICE_MINYA, active: true, createdAt: "2024-02-01" },
  { id: "u-ed-minya-2",  fullName: "Minya Editor 2",       email: "editor2.minya@clp.org", role: "editor",       officeId: OFFICE_MINYA, active: true, createdAt: "2024-02-01" },
  { id: "u-viewer",      fullName: "Sponsor Viewer",       email: "viewer@clp.org",        role: "viewer",       officeId: null,         active: true, createdAt: "2024-02-05" },
];

// No sample data — the system starts empty.
export const beneficiaries: Beneficiary[] = [];
export const progressReports: ProgressReport[] = [];
export const officeReports: OfficeReport[] = [];
export const leavingRecords: LeavingRecord[] = [];
