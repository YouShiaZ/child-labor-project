// Child Labor Project — client-side data layer.
//
// Still a MOCK layer persisted to localStorage (Phase 1). In Phase 2 the bodies
// below get replaced with Supabase calls; the SIGNATURES stay the same so the UI
// does not change. Permission helpers here mirror the RLS policies planned for
// the database, so the same rules apply on both sides.
import {
  offices as seedOffices,
  users as seedUsers,
  projects as seedProjects,
  beneficiaries as seedBeneficiaries,
  progressReports as seedReports,
  officeReports as seedOfficeReports,
  leavingRecords as seedLeaving,
  PROJECT_ID,
  OFFICE_CAIRO,
  OFFICE_MINYA,
} from "./mockData";
import type {
  User,
  Office,
  OfficeId,
  Project,
  Beneficiary,
  ProgressReport,
  OfficeReport,
  LeavingRecord,
  SeasonKind,
} from "./types";

export { PROJECT_ID, OFFICE_CAIRO, OFFICE_MINYA };

// -----------------------------------------------------------------------------
// Persistence
// -----------------------------------------------------------------------------
const STORE_KEY = "clp_store_v3"; // bump when the seed shape changes

interface Store {
  offices: Office[];
  users: User[];
  projects: Project[];
  beneficiaries: Beneficiary[];
  reports: ProgressReport[];
  officeReports: OfficeReport[];
  leaving: LeavingRecord[];
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const seed = (): Store => ({
  offices: clone(seedOffices),
  users: clone(seedUsers),
  projects: clone(seedProjects),
  beneficiaries: clone(seedBeneficiaries),
  reports: clone(seedReports),
  officeReports: clone(seedOfficeReports),
  leaving: clone(seedLeaving),
});

function load(): Store {
  if (typeof localStorage === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<Store>;
    const base = seed();
    return {
      offices: parsed.offices ?? base.offices,
      users: parsed.users ?? base.users,
      projects: parsed.projects ?? base.projects,
      beneficiaries: parsed.beneficiaries ?? base.beneficiaries,
      reports: parsed.reports ?? base.reports,
      officeReports: parsed.officeReports ?? base.officeReports,
      leaving: parsed.leaving ?? base.leaving,
    };
  } catch {
    return seed();
  }
}

let store: Store = load();

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    console.warn("[CLP] Could not persist to localStorage (storage full?).");
  }
}

export function resetStore() {
  store = seed();
  persist();
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// -----------------------------------------------------------------------------
// Permission helpers (mirror the DB RLS rules)
// -----------------------------------------------------------------------------
export const isSuperAdmin = (u: User | null) => u?.role === "super_admin";

/** Can this user create/edit/delete records in the given office? */
export function canEditOffice(u: User | null, officeId: OfficeId): boolean {
  if (!u || !u.active) return false;
  if (u.role === "super_admin") return true;
  if (u.role === "office_admin" || u.role === "editor")
    return u.officeId === officeId;
  return false; // viewer
}

/** Can this user approve submitted forms in the given office? */
export function canApprove(u: User | null, officeId: OfficeId): boolean {
  if (!u || !u.active) return false;
  if (u.role === "super_admin") return true;
  if (u.role === "office_admin") return u.officeId === officeId;
  return false;
}

/** Only the super admin manages accounts. */
export const canManageUsers = (u: User | null) => isSuperAdmin(u);

/** Everyone who is signed in can view all offices (read-only for those they don't own). */
export const canViewAll = (u: User | null) => !!u && u.active;

// -----------------------------------------------------------------------------
// Offices
// -----------------------------------------------------------------------------
export const listOffices = () => [...store.offices];
export const getOffice = (id: OfficeId) => store.offices.find((o) => o.id === id);

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export const listUsers = () => [...store.users];
export const getUser = (id: string) => store.users.find((u) => u.id === id);

export const createUser = (u: Omit<User, "id" | "createdAt">) => {
  const user: User = { ...u, id: uid("u"), createdAt: today() };
  store.users = [...store.users, user];
  persist();
  return user;
};

export const updateUser = (id: string, patch: Partial<User>) => {
  store.users = store.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
  persist();
  return store.users.find((u) => u.id === id)!;
};

export const deleteUser = (id: string) => {
  store.users = store.users.filter((u) => u.id !== id);
  persist();
};

// -----------------------------------------------------------------------------
// Project (single program)
// -----------------------------------------------------------------------------
export const listProjects = () => [...store.projects];
export const getProject = (id: string) => store.projects.find((p) => p.id === id);
export const getCurrentProject = (): Project =>
  store.projects.find((p) => p.id === PROJECT_ID) ?? store.projects[0];

export const updateProject = (id: string, patch: Partial<Project>) => {
  store.projects = store.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  persist();
  return store.projects.find((p) => p.id === id)!;
};

// -----------------------------------------------------------------------------
// Beneficiaries
// -----------------------------------------------------------------------------
/** All beneficiaries, optionally filtered by office. */
export const listBeneficiaries = (officeId?: OfficeId) =>
  officeId
    ? store.beneficiaries.filter((b) => b.officeId === officeId)
    : [...store.beneficiaries];

export const getBeneficiary = (id: string) =>
  store.beneficiaries.find((b) => b.id === id);

/** Next sequential beneficiary code, e.g. CLP-0005 (global across offices). */
export function nextBeneficiaryNumber(): string {
  const nums = store.beneficiaries
    .map((b) => Number(b.beneficiaryNumber.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "CLP-" + String(next).padStart(4, "0");
}

export const createBeneficiary = (b: Omit<Beneficiary, "id" | "createdAt">) => {
  const ben: Beneficiary = { ...b, id: uid("b"), createdAt: today() };
  store.beneficiaries = [...store.beneficiaries, ben];
  persist();
  return ben;
};

export const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
  store.beneficiaries = store.beneficiaries.map((b) =>
    b.id === id ? { ...b, ...patch } : b,
  );
  persist();
  return store.beneficiaries.find((b) => b.id === id)!;
};

/** Approve a pending beneficiary record. */
export const approveBeneficiary = (id: string, approverUserId: string) => {
  return updateBeneficiary(id, {
    approvalStatus: "approved",
    approvedByUserId: approverUserId,
    approvedAt: today(),
  });
};

// -----------------------------------------------------------------------------
// Progress reports
// -----------------------------------------------------------------------------
export const listReports = (beneficiaryId: string) =>
  store.reports
    .filter((r) => r.beneficiaryId === beneficiaryId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

export const listAllReports = () => [...store.reports];

export const createReport = (r: Omit<ProgressReport, "id">) => {
  const rep: ProgressReport = { ...r, id: uid("r") };
  store.reports = [...store.reports, rep];
  persist();
  return rep;
};

// -----------------------------------------------------------------------------
// Annual office reports (Word / PDF documents)
// -----------------------------------------------------------------------------
export const listOfficeReports = (officeId?: OfficeId) =>
  (officeId
    ? store.officeReports.filter((r) => r.officeId === officeId)
    : [...store.officeReports]
  ).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));

export const createOfficeReport = (r: Omit<OfficeReport, "id" | "uploadedAt">) => {
  const rep: OfficeReport = { ...r, id: uid("or"), uploadedAt: now() };
  store.officeReports = [...store.officeReports, rep];
  persist();
  return rep;
};

export const deleteOfficeReport = (id: string) => {
  store.officeReports = store.officeReports.filter((r) => r.id !== id);
  persist();
};

// -----------------------------------------------------------------------------
// Leaving
// -----------------------------------------------------------------------------
export const getLeaving = (beneficiaryId: string) =>
  store.leaving.find((l) => l.beneficiaryId === beneficiaryId);

export const startLeaving = (l: Omit<LeavingRecord, "id">) => {
  const rec: LeavingRecord = { ...l, id: uid("l") };
  store.leaving = [...store.leaving, rec];
  updateBeneficiary(l.beneficiaryId, { status: "leaving" }); // persists
  return rec;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
export function computeAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const n = new Date();
  let age = n.getFullYear() - dob.getFullYear();
  const m = n.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

/**
 * Which seasonal card is "in season" right now.
 * Christmas window: 1 Dec – 31 Jan.  Easter window: 1 Mar – 31 May.
 * Coptic Christmas (7 Jan) falls inside the Christmas window.
 */
export function getCurrentSeason(date = new Date()): SeasonKind {
  const m = date.getMonth() + 1; // 1..12
  if (m === 12 || m === 1) return "christmas";
  if (m >= 3 && m <= 5) return "easter";
  if (m === 2) return "easter"; // Easter approaching
  return "christmas"; // Jun–Nov: Christmas approaching
}

/** Label for the seasonal card field, based on the current date. */
export function seasonalCardLabel(date = new Date()): string {
  return getCurrentSeason(date) === "christmas" ? "Christmas Card" : "Easter Card";
}

/**
 * Read an uploaded file as a base64 data URL. Images are downscaled so they fit
 * in localStorage during Phase 1. Non-images (Word/PDF) are read as-is.
 * Replace with a Supabase Storage upload in Phase 2.
 */
export function fileToDataUrl(file: File, maxSize = 512): Promise<string> {
  const isImage = file.type.startsWith("image/");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      if (!isImage) {
        resolve(reader.result as string);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Trigger a browser download of a data URL / URL. */
export function downloadFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
