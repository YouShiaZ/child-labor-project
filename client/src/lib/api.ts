// Child Labor Project — data layer.
//
// Runs in two modes (see lib/supabase.ts):
//   • REAL mode  — data lives in Supabase; loaded once into an in-memory cache
//                  on startup (bootstrap) and written through on every change.
//   • DEMO mode  — data lives in localStorage.
// Pages read from the in-memory `store` synchronously in BOTH modes, so the UI
// code never changes. Writes update `store` immediately (optimistic) and, in
// real mode, persist to Supabase in the background.
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
  SeasonalCard,
} from "./types";
import { SUPABASE_ENABLED, BUCKETS } from "./supabase";
import * as db from "./db";
import { toast } from "sonner";

export { PROJECT_ID, OFFICE_CAIRO, OFFICE_MINYA, SUPABASE_ENABLED };

// -----------------------------------------------------------------------------
// In-memory store
// -----------------------------------------------------------------------------
const STORE_KEY = "clp_store_v5";

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

function loadDemo(): Store {
  if (typeof localStorage === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<Store>;
    const base = seed();
    return { ...base, ...parsed };
  } catch {
    return seed();
  }
}

// In real mode the store starts from the seed's structural rows (offices) and is
// replaced by bootstrap(); in demo mode it comes from localStorage.
let store: Store = SUPABASE_ENABLED ? seed() : loadDemo();

function persist() {
  if (SUPABASE_ENABLED) return; // real mode persists to Supabase, not localStorage
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    console.warn("[CLP] Could not persist to localStorage (storage full?).");
  }
}

export function resetStore() {
  if (SUPABASE_ENABLED) return;
  store = seed();
  persist();
}

/** Load all data from Supabase into the in-memory store. Call once after login. */
export async function bootstrap(): Promise<void> {
  if (!SUPABASE_ENABLED) return;
  const snap = await db.dbFetchAll();
  store = {
    offices: snap.offices,
    users: snap.users,
    projects: snap.projects.length ? snap.projects : seed().projects,
    beneficiaries: snap.beneficiaries,
    reports: snap.reports,
    officeReports: snap.officeReports,
    leaving: snap.leaving,
  };
}

// Fire-and-forget write to Supabase with a visible error if it fails.
function push(action: () => Promise<unknown>) {
  if (!SUPABASE_ENABLED) return;
  action().catch((e) => {
    console.error("[CLP] Supabase write failed:", e);
    toast.error("Could not save to the server. Please retry.");
  });
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// -----------------------------------------------------------------------------
// Permission helpers (mirror the DB RLS rules)
// -----------------------------------------------------------------------------
export const isSuperAdmin = (u: User | null) => u?.role === "super_admin";

export function canEditOffice(u: User | null, officeId: OfficeId): boolean {
  if (!u || !u.active) return false;
  if (u.role === "super_admin") return true;
  if (u.role === "office_admin" || u.role === "editor") return u.officeId === officeId;
  return false;
}

export function canApprove(u: User | null, officeId: OfficeId): boolean {
  if (!u || !u.active) return false;
  if (u.role === "super_admin") return true;
  if (u.role === "office_admin") return u.officeId === officeId;
  return false;
}

export const canManageUsers = (u: User | null) => isSuperAdmin(u);
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

/** Add a user row to the local store (used by AuthContext after an edge-function create in real mode, or directly in demo). */
export const upsertUserLocal = (u: User) => {
  store.users = [...store.users.filter((x) => x.id !== u.id), u];
};

export const createUser = (u: Omit<User, "id" | "createdAt">) => {
  const user: User = { ...u, id: uid(), createdAt: today() };
  store.users = [...store.users, user];
  persist();
  return user;
};

export const updateUser = (id: string, patch: Partial<User>) => {
  store.users = store.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
  persist();
  push(() => db.dbUpdateUserProfile(id, patch));
  return store.users.find((u) => u.id === id)!;
};

export const deleteUser = (id: string) => {
  store.users = store.users.filter((u) => u.id !== id);
  persist();
};

// -----------------------------------------------------------------------------
// Project
// -----------------------------------------------------------------------------
export const listProjects = () => [...store.projects];
export const getProject = (id: string) => store.projects.find((p) => p.id === id);
export const getCurrentProject = (): Project =>
  store.projects.find((p) => p.id === PROJECT_ID) ?? store.projects[0];

export const updateProject = (id: string, patch: Partial<Project>) => {
  store.projects = store.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  persist();
  push(() => db.dbUpdateProject(id, patch));
  return store.projects.find((p) => p.id === id)!;
};

// -----------------------------------------------------------------------------
// Beneficiaries
// -----------------------------------------------------------------------------
export const listBeneficiaries = (officeId?: OfficeId) =>
  officeId ? store.beneficiaries.filter((b) => b.officeId === officeId) : [...store.beneficiaries];

export const getBeneficiary = (id: string) => store.beneficiaries.find((b) => b.id === id);

export function nextBeneficiaryNumber(): string {
  const nums = store.beneficiaries
    .map((b) => Number(b.beneficiaryNumber.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "CLP-" + String(next).padStart(4, "0");
}

export const createBeneficiary = (b: Omit<Beneficiary, "id" | "createdAt">) => {
  const ben: Beneficiary = { ...b, id: uid(), createdAt: today() };
  store.beneficiaries = [...store.beneficiaries, ben];
  persist();
  push(() => db.dbInsertBeneficiary(ben));
  return ben;
};

export const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
  store.beneficiaries = store.beneficiaries.map((b) => (b.id === id ? { ...b, ...patch } : b));
  persist();
  // seasonalCards changes are pushed via addSeasonalCard/removeSeasonalCard.
  const { seasonalCards, ...rest } = patch as Record<string, unknown>;
  if (Object.keys(rest).length) push(() => db.dbUpdateBeneficiary(id, rest));
  return store.beneficiaries.find((b) => b.id === id)!;
};

export const approveBeneficiary = (id: string, approverUserId: string) =>
  updateBeneficiary(id, { approvalStatus: "approved", approvedByUserId: approverUserId, approvedAt: today() });

export function addSeasonalCard(beneficiaryId: string, url: string, season?: SeasonKind) {
  const b = getBeneficiary(beneficiaryId);
  if (!b) return;
  const card: SeasonalCard = {
    id: uid(), url, season: season ?? getCurrentSeason(), year: new Date().getFullYear(), uploadedAt: today(),
  };
  store.beneficiaries = store.beneficiaries.map((x) =>
    x.id === beneficiaryId ? { ...x, seasonalCards: [...(x.seasonalCards ?? []), card] } : x,
  );
  persist();
  push(() => db.dbInsertCard(beneficiaryId, card));
}

export function removeSeasonalCard(beneficiaryId: string, cardId: string) {
  store.beneficiaries = store.beneficiaries.map((x) =>
    x.id === beneficiaryId ? { ...x, seasonalCards: (x.seasonalCards ?? []).filter((c) => c.id !== cardId) } : x,
  );
  persist();
  push(() => db.dbDeleteCard(cardId));
}

// -----------------------------------------------------------------------------
// Progress reports
// -----------------------------------------------------------------------------
export const listReports = (beneficiaryId: string) =>
  store.reports.filter((r) => r.beneficiaryId === beneficiaryId).sort((a, b) => (a.date < b.date ? 1 : -1));

export const listAllReports = () => [...store.reports];

export const createReport = (r: Omit<ProgressReport, "id">) => {
  const rep: ProgressReport = { ...r, id: uid() };
  store.reports = [...store.reports, rep];
  persist();
  push(() => db.dbInsertReport(rep));
  return rep;
};

// -----------------------------------------------------------------------------
// Annual office reports
// -----------------------------------------------------------------------------
export const listOfficeReports = (officeId?: OfficeId) =>
  (officeId ? store.officeReports.filter((r) => r.officeId === officeId) : [...store.officeReports]).sort(
    (a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1),
  );

export const createOfficeReport = (r: Omit<OfficeReport, "id" | "uploadedAt">) => {
  const rep: OfficeReport = { ...r, id: uid(), uploadedAt: now() };
  store.officeReports = [...store.officeReports, rep];
  persist();
  push(() => db.dbInsertOfficeReport(rep));
  return rep;
};

export const deleteOfficeReport = (id: string) => {
  store.officeReports = store.officeReports.filter((r) => r.id !== id);
  persist();
  push(() => db.dbDeleteOfficeReport(id));
};

// -----------------------------------------------------------------------------
// Leaving
// -----------------------------------------------------------------------------
export const getLeaving = (beneficiaryId: string) => store.leaving.find((l) => l.beneficiaryId === beneficiaryId);

export const startLeaving = (l: Omit<LeavingRecord, "id">) => {
  const rec: LeavingRecord = { ...l, id: uid() };
  store.leaving = [...store.leaving, rec];
  persist();
  push(() => db.dbInsertLeaving(rec));
  updateBeneficiary(l.beneficiaryId, { status: "leaving" }); // persists + pushes
  return rec;
};

// -----------------------------------------------------------------------------
// File saving (routes to Supabase Storage in real mode, base64 in demo)
// -----------------------------------------------------------------------------
/** Save a cropped/generated image (data URL). Returns a URL to store. */
export async function saveImageDataUrl(dataUrl: string, kind: "photo" | "card", officeId: OfficeId): Promise<string> {
  if (!SUPABASE_ENABLED) return dataUrl;
  const bucket = kind === "card" ? BUCKETS.cards : BUCKETS.photos;
  return db.dbUploadImageDataUrl(dataUrl, bucket, officeId);
}

/** Save a picked image File. Returns a URL to store. */
export async function saveImageFile(file: File, kind: "photo" | "card", officeId: OfficeId): Promise<string> {
  if (!SUPABASE_ENABLED) return fileToDataUrl(file);
  const bucket = kind === "card" ? BUCKETS.cards : BUCKETS.photos;
  return db.dbUploadFile(file, bucket, officeId);
}

/** Save a document (Word/PDF). Returns a URL to store. */
export async function saveDocumentFile(file: File, officeId: OfficeId): Promise<string> {
  if (!SUPABASE_ENABLED) return fileToDataUrl(file);
  return db.dbUploadFile(file, BUCKETS.reports, officeId);
}

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

export function getCurrentSeason(date = new Date()): SeasonKind {
  const m = date.getMonth() + 1;
  if (m === 12 || m === 1) return "christmas";
  if (m >= 3 && m <= 5) return "easter";
  if (m === 2) return "easter";
  return "christmas";
}

export function seasonalCardLabel(date = new Date()): string {
  return getCurrentSeason(date) === "christmas" ? "Christmas Card" : "Easter Card";
}

/** Read an image File as a downscaled base64 data URL (demo mode + cropper source). */
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

/** Trigger a browser download of a URL / data URL. */
export function downloadFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
