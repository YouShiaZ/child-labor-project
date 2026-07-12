// Child Labor Project — client-side data layer.
//
// This is still a MOCK layer (no server), but it now PERSISTS to localStorage so a
// demo reviewer can add/edit records and keep them across page refreshes.
//
// When the real backend lands (see STRUCTURE.md), replace the bodies of these
// functions with `fetch` calls to /api/... — the signatures do not need to change.
import {
  users as seedUsers,
  projects as seedProjects,
  beneficiaries as seedBeneficiaries,
  progressReports as seedReports,
  leavingRecords as seedLeaving,
  PROJECT_ID,
} from "./mockData";
import type {
  User,
  Project,
  Beneficiary,
  ProgressReport,
  LeavingRecord,
} from "./types";

export { PROJECT_ID };

// -----------------------------------------------------------------------------
// Persistence
// -----------------------------------------------------------------------------

const STORE_KEY = "clp_store_v2"; // bump when the seed shape changes

interface Store {
  users: User[];
  projects: Project[];
  beneficiaries: Beneficiary[];
  reports: ProgressReport[];
  leaving: LeavingRecord[];
}

// Plain-JSON deep clone. Avoids structuredClone(), which is missing on older
// browsers the reviewers might be using.
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const seed = (): Store => ({
  users: clone(seedUsers),
  projects: clone(seedProjects),
  beneficiaries: clone(seedBeneficiaries),
  reports: clone(seedReports),
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
      users: parsed.users ?? base.users,
      projects: parsed.projects ?? base.projects,
      beneficiaries: parsed.beneficiaries ?? base.beneficiaries,
      reports: parsed.reports ?? base.reports,
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
    // Quota exceeded (usually large base64 photos) — keep the session alive anyway.
    console.warn("[CLP] Could not persist to localStorage (storage full?).");
  }
}

/** Wipe local changes and restore the seed data. Useful for demos. */
export function resetStore() {
  store = seed();
  persist();
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export const listUsers = () => [...store.users];

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
// Project (single-project system)
// -----------------------------------------------------------------------------

export const listProjects = () => [...store.projects];

export const getProject = (id: string) => store.projects.find((p) => p.id === id);

/** The system manages ONE project (Child Labor Project). */
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

export const listBeneficiaries = (projectId?: string) =>
  projectId
    ? store.beneficiaries.filter((b) => b.projectId === projectId)
    : [...store.beneficiaries];

export const getBeneficiary = (id: string) =>
  store.beneficiaries.find((b) => b.id === id);

/** Next sequential beneficiary code, e.g. CLP-0005. */
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

// -----------------------------------------------------------------------------
// Progress reports
// -----------------------------------------------------------------------------

/** Reports for a beneficiary, newest first. */
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
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

/**
 * Read an uploaded image as a base64 data URL, downscaled so it survives a page
 * refresh inside localStorage. (Blob URLs from URL.createObjectURL do NOT.)
 * Replace with a real multipart upload to /api/.../photo once the backend exists.
 */
export function fileToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
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
