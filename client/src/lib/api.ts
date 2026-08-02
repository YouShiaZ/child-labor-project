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
  Role,
  Office,
  OfficeId,
  Project,
  Beneficiary,
  ProgressReport,
  OfficeReport,
  LeavingRecord,
  ChangeRequest,
  ChangeKind,
  SeasonKind,
  SeasonalCard,
} from "./types";
import { SUPABASE_ENABLED, BUCKETS } from "./supabase";
import * as db from "./db";
import * as offline from "./offline";
import { toast } from "sonner";

export {
  isOnline, pendingCount, failedCount, isSyncing, reauthNeeded,
  getPending, getFailed, requeueFailed, discardFailed,
  subscribe as subscribeOffline,
} from "./offline";

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
  changeRequests: ChangeRequest[];
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
  changeRequests: [],
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

let snapTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (SUPABASE_ENABLED) {
    // Cache the whole store on-device so the app opens with data even offline.
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => { offline.saveSnapshot(store); }, 400);
    return;
  }
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

// Fetch everything from Supabase into the store and cache it.
async function refreshFromServer(): Promise<void> {
  const snap = await db.dbFetchAll();
  store = {
    offices: snap.offices,
    users: snap.users,
    projects: snap.projects.length ? snap.projects : seed().projects,
    beneficiaries: snap.beneficiaries,
    reports: snap.reports,
    officeReports: snap.officeReports,
    leaving: snap.leaving,
    changeRequests: snap.changeRequests,
  };
  await offline.saveSnapshot(store);
}

/** Load all data. Online → from Supabase (and cache it). Offline → from the
 *  on-device cache. Call once after login. */
export async function bootstrap(): Promise<void> {
  if (!SUPABASE_ENABLED) return;
  await offline.loadOutbox();

  if (offline.isOnline()) {
    try {
      await refreshFromServer();
    } catch (e) {
      // Lost connection mid-load → fall back to the cached snapshot if we have one.
      const cached = await offline.loadSnapshot<Store>();
      if (cached) store = cached;
      else throw e;
    }
    void flushOutbox();
  } else {
    const cached = await offline.loadSnapshot<Store>();
    if (cached) store = cached;
  }
}

/** Replay queued offline writes to Supabase, then refresh so DB-assigned values
 *  (e.g. per-office codes for records created offline) appear. */
export async function flushOutbox(): Promise<void> {
  if (!SUPABASE_ENABLED) return;
  await offline.flush((oldUrl, newUrl) => rewriteImageUrl(oldUrl, newUrl));
  offline.saveSnapshot(store);
  // Everything uploaded → pull the authoritative rows back (real codes, etc.).
  if (offline.isOnline() && offline.pendingCount() === 0) {
    try { await refreshFromServer(); } catch { /* stay on cache */ }
  }
}

// After an offline-captured image is uploaded on sync, swap its data URL for the
// real storage URL everywhere in the cached store.
function rewriteImageUrl(oldUrl: string, newUrl: string) {
  store.beneficiaries = store.beneficiaries.map((b) => ({
    ...b,
    photoUrl: b.photoUrl === oldUrl ? newUrl : b.photoUrl,
    seasonalCards: (b.seasonalCards ?? []).map((c) => (c.url === oldUrl ? { ...c, url: newUrl } : c)),
  }));
  store.reports = store.reports.map((r) => (r.updatePhotoUrl === oldUrl ? { ...r, updatePhotoUrl: newUrl } : r));
  store.changeRequests = store.changeRequests.map((cr) => {
    const p = cr.payload as Record<string, unknown>;
    let changed = false;
    const np = { ...p };
    for (const k of ["photoUrl", "url", "updatePhotoUrl"]) {
      if (np[k] === oldUrl) { np[k] = newUrl; changed = true; }
    }
    return changed ? { ...cr, payload: np } : cr;
  });
}

// Auto-sync the moment the connection returns.
if (typeof window !== "undefined" && SUPABASE_ENABLED) {
  window.addEventListener("online", () => { void flushOutbox(); });
}

function isNetworkError(e: unknown): boolean {
  const m = (e as { message?: string })?.message ?? "";
  return /fetch|network|failed to fetch|networkerror|load failed/i.test(m);
}

// Write to Supabase. If an `op` is given and we're offline (or the write fails
// on the network), the op is queued to the outbox and replayed when back online.
function push(action: () => Promise<unknown>, op?: offline.Op) {
  if (!SUPABASE_ENABLED) return;
  if (op && !offline.isOnline()) {
    void offline.enqueue(op);
    return;
  }
  action().catch((e: unknown) => {
    if (op && (!offline.isOnline() || isNetworkError(e))) {
      void offline.enqueue(op); // keep it; it'll sync when the connection returns
      return;
    }
    console.error("[CLP] Supabase write failed:", e);
    const err = e as { message?: string; details?: string; hint?: string; code?: string };
    const reason = [err?.message, err?.details, err?.hint].filter(Boolean).join(" — ");
    toast.error(`Could not save: ${reason || "unknown error"}${err?.code ? ` (${err.code})` : ""}`);
  });
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// -----------------------------------------------------------------------------
// Audit trail — record who did what
// -----------------------------------------------------------------------------
let currentActor: { id: string; name: string; officeId: string | null; role: Role } | null = null;

/** Called by AuthContext whenever the signed-in user changes. */
export function setCurrentActor(u: User | null) {
  currentActor = u ? { id: u.id, name: u.fullName, officeId: u.officeId, role: u.role } : null;
}

/** Is the current user an admin (super, or office admin of this office)? */
function actorIsAdminFor(officeId: OfficeId): boolean {
  if (!currentActor) return false;
  if (currentActor.role === "super_admin") return true;
  return currentActor.role === "office_admin" && currentActor.officeId === officeId;
}

/** Write an audit-log entry (real mode only). */
export function logActivity(action: string, entity: string, entityId: string | null, summary: string) {
  if (!SUPABASE_ENABLED || !currentActor) return;
  const actor = currentActor;
  push(() =>
    db.dbLogActivity({
      actorId: actor.id, actorName: actor.name, officeId: actor.officeId,
      action, entity, entityId, summary,
    }),
  );
}

/** Fetch the recent activity feed (real mode). Returns [] in demo mode. */
export async function fetchRecentActivity(limit = 60) {
  if (!SUPABASE_ENABLED) return [];
  try {
    return await db.dbFetchRecentActivity(limit);
  } catch (e) {
    console.error("[CLP] Could not load activity:", e);
    return [];
  }
}

const beneName = (id: string) => {
  const b = getBeneficiary(id);
  return b ? `${b.firstName} ${b.lastName} (${b.beneficiaryNumber})` : id;
};

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

/** Provisional per-office code, e.g. CAI-0005 / MIN-0005. The authoritative
 *  number is assigned by the database on insert (unique per office). */
export function nextBeneficiaryNumber(officeId: OfficeId): string {
  const prefix = store.offices.find((o) => o.id === officeId)?.code || "CLP";
  const nums = store.beneficiaries
    .filter((b) => b.officeId === officeId)
    .map((b) => Number(b.beneficiaryNumber.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export const createBeneficiary = (b: Omit<Beneficiary, "id" | "createdAt">) => {
  const ben: Beneficiary = { ...b, id: uid(), createdAt: today() };
  store.beneficiaries = [...store.beneficiaries, ben];
  persist();
  push(async () => {
    // The DB trigger assigns the authoritative per-office number; adopt it.
    const assigned = await db.dbInsertBeneficiary(ben);
    if (assigned && assigned !== ben.beneficiaryNumber) {
      store.beneficiaries = store.beneficiaries.map((x) =>
        x.id === ben.id ? { ...x, beneficiaryNumber: assigned } : x,
      );
      persist();
    }
  }, { kind: "insertBeneficiary", data: ben });
  logActivity("create", "beneficiary", ben.id, `Added beneficiary ${ben.firstName} ${ben.lastName} (${ben.beneficiaryNumber})`);
  return ben;
};

export const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
  store.beneficiaries = store.beneficiaries.map((b) => (b.id === id ? { ...b, ...patch } : b));
  persist();
  // seasonalCards changes are pushed via addSeasonalCard/removeSeasonalCard.
  const { seasonalCards, ...rest } = patch as Record<string, unknown>;
  if (Object.keys(rest).length) {
    const officeId = store.beneficiaries.find((x) => x.id === id)?.officeId ?? "";
    push(() => db.dbUpdateBeneficiary(id, rest), { kind: "updateBeneficiary", id, patch: rest, officeId });
    // Skip the noisy approval update here; approveBeneficiary logs its own entry.
    if (!("approvalStatus" in rest && Object.keys(rest).length <= 3)) {
      logActivity("update", "beneficiary", id, `Updated ${beneName(id)}`);
    }
  }
  return store.beneficiaries.find((b) => b.id === id)!;
};

export const approveBeneficiary = (id: string, approverUserId: string) => {
  const r = updateBeneficiary(id, { approvalStatus: "approved", approvedByUserId: approverUserId, approvedAt: today() });
  logActivity("approve", "beneficiary", id, `Approved ${beneName(id)}`);
  return r;
};

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
  push(() => db.dbInsertCard(beneficiaryId, card), { kind: "insertCard", beneficiaryId, card, officeId: b.officeId });
  logActivity("create", "card", beneficiaryId, `Added ${card.season} card (${card.year}) for ${beneName(beneficiaryId)}`);
}

export function removeSeasonalCard(beneficiaryId: string, cardId: string) {
  store.beneficiaries = store.beneficiaries.map((x) =>
    x.id === beneficiaryId ? { ...x, seasonalCards: (x.seasonalCards ?? []).filter((c) => c.id !== cardId) } : x,
  );
  persist();
  push(() => db.dbDeleteCard(cardId), { kind: "deleteCard", cardId });
  logActivity("delete", "card", beneficiaryId, `Removed a card from ${beneName(beneficiaryId)}`);
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
  const rOffice = getBeneficiary(rep.beneficiaryId)?.officeId ?? "";
  push(() => db.dbInsertReport(rep), { kind: "insertReport", report: rep, officeId: rOffice });
  logActivity("create", "report", rep.beneficiaryId, `Added ${rep.reportType} report (${rep.period}) for ${beneName(rep.beneficiaryId)}`);
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
  logActivity("create", "office_report", rep.officeId, `Uploaded annual report "${rep.title}" (${rep.year})`);
  return rep;
};

export const deleteOfficeReport = (id: string) => {
  const rep = store.officeReports.find((r) => r.id === id);
  store.officeReports = store.officeReports.filter((r) => r.id !== id);
  persist();
  push(() => db.dbDeleteOfficeReport(id));
  if (rep) logActivity("delete", "office_report", rep.officeId, `Deleted annual report "${rep.title}"`);
};

// -----------------------------------------------------------------------------
// Leaving
// -----------------------------------------------------------------------------
export const getLeaving = (beneficiaryId: string) => store.leaving.find((l) => l.beneficiaryId === beneficiaryId);

export const startLeaving = (l: Omit<LeavingRecord, "id">) => {
  const rec: LeavingRecord = { ...l, id: uid() };
  store.leaving = [...store.leaving, rec];
  persist();
  push(() => db.dbInsertLeaving(rec), { kind: "insertLeaving", leaving: rec });
  logActivity("leave", "beneficiary", l.beneficiaryId, `Started leaving (${l.reason}) for ${beneName(l.beneficiaryId)}`);
  updateBeneficiary(l.beneficiaryId, { status: "leaving" }); // persists + pushes
  return rec;
};

// -----------------------------------------------------------------------------
// Approval queue — every editor action needs an office-admin approval
// -----------------------------------------------------------------------------
export const listChangeRequests = (officeId?: OfficeId) =>
  (officeId ? store.changeRequests.filter((c) => c.officeId === officeId) : [...store.changeRequests])
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const listPendingChangeRequests = (officeId?: OfficeId) =>
  listChangeRequests(officeId).filter((c) => c.status === "pending");

function createChangeRequest(input: {
  officeId: OfficeId; beneficiaryId: string; kind: ChangeKind;
  payload: Record<string, unknown>; summary: string;
}): ChangeRequest {
  const cr: ChangeRequest = {
    ...input,
    id: uid(),
    status: "pending",
    requestedByUserId: currentActor?.id ?? "",
    requestedByName: currentActor?.name ?? "",
    createdAt: now(),
  };
  store.changeRequests = [...store.changeRequests, cr];
  persist();
  push(() => db.dbInsertChangeRequest(cr), { kind: "insertChangeRequest", cr });
  logActivity("request", cr.kind, cr.beneficiaryId, `Requested approval: ${cr.summary}`);
  return cr;
}

function applyChangeRequest(cr: ChangeRequest) {
  switch (cr.kind) {
    case "update":
      updateBeneficiary(cr.beneficiaryId, cr.payload as Partial<Beneficiary>);
      break;
    case "leave":
      startLeaving(cr.payload as unknown as Omit<LeavingRecord, "id">);
      break;
    case "report":
      createReport(cr.payload as unknown as Omit<ProgressReport, "id">);
      break;
    case "card_add":
      addSeasonalCard(cr.beneficiaryId, cr.payload.url as string, cr.payload.season as SeasonKind);
      break;
    case "card_remove":
      removeSeasonalCard(cr.beneficiaryId, cr.payload.cardId as string);
      break;
  }
}

export function approveChangeRequest(id: string, reviewerId: string) {
  const cr = store.changeRequests.find((c) => c.id === id);
  if (!cr || cr.status !== "pending") return;
  applyChangeRequest(cr); // performs the real change (reviewer has the rights)
  store.changeRequests = store.changeRequests.map((c) =>
    c.id === id ? { ...c, status: "approved", reviewedByUserId: reviewerId, reviewedAt: now() } : c,
  );
  persist();
  push(() => db.dbUpdateChangeRequestStatus(id, "approved", reviewerId));
  logActivity("approve", "request", cr.beneficiaryId, `Approved request: ${cr.summary}`);
}

export function rejectChangeRequest(id: string, reviewerId: string) {
  const cr = store.changeRequests.find((c) => c.id === id);
  if (!cr || cr.status !== "pending") return;
  store.changeRequests = store.changeRequests.map((c) =>
    c.id === id ? { ...c, status: "rejected", reviewedByUserId: reviewerId, reviewedAt: now() } : c,
  );
  persist();
  push(() => db.dbUpdateChangeRequestStatus(id, "rejected", reviewerId));
  logActivity("delete", "request", cr.beneficiaryId, `Rejected request: ${cr.summary}`);
}

// --- Wrappers the UI calls. Return { queued:true } when it needs admin approval.
type SubmitResult = { queued: boolean };

/** Edit a beneficiary. Applies now for admins or while the record is still pending; otherwise queues. */
export function submitBeneficiaryEdit(id: string, patch: Partial<Beneficiary>): SubmitResult {
  const b = getBeneficiary(id);
  if (!b) return { queued: false };
  if (actorIsAdminFor(b.officeId) || b.approvalStatus === "pending") {
    updateBeneficiary(id, patch);
    return { queued: false };
  }
  const fields = Object.keys(patch).join(", ");
  createChangeRequest({
    officeId: b.officeId, beneficiaryId: id, kind: "update", payload: patch as Record<string, unknown>,
    summary: `Edit ${beneName(id)} — ${fields}`,
  });
  return { queued: true };
}

export function submitLeaving(l: Omit<LeavingRecord, "id">): SubmitResult {
  const office = getBeneficiary(l.beneficiaryId)?.officeId ?? "";
  if (actorIsAdminFor(office)) {
    startLeaving(l);
    return { queued: false };
  }
  createChangeRequest({
    officeId: office, beneficiaryId: l.beneficiaryId, kind: "leave", payload: l as unknown as Record<string, unknown>,
    summary: `Leaving (${l.reason}) — ${beneName(l.beneficiaryId)}`,
  });
  return { queued: true };
}

export function submitReport(r: Omit<ProgressReport, "id">): SubmitResult {
  const office = getBeneficiary(r.beneficiaryId)?.officeId ?? "";
  if (actorIsAdminFor(office)) {
    createReport(r);
    return { queued: false };
  }
  createChangeRequest({
    officeId: office, beneficiaryId: r.beneficiaryId, kind: "report", payload: r as unknown as Record<string, unknown>,
    summary: `${r.reportType} report (${r.period}) — ${beneName(r.beneficiaryId)}`,
  });
  return { queued: true };
}

export function submitCardAdd(beneficiaryId: string, url: string, season: SeasonKind = getCurrentSeason()): SubmitResult {
  const office = getBeneficiary(beneficiaryId)?.officeId ?? "";
  if (actorIsAdminFor(office)) {
    addSeasonalCard(beneficiaryId, url, season);
    return { queued: false };
  }
  createChangeRequest({
    officeId: office, beneficiaryId, kind: "card_add", payload: { url, season },
    summary: `Add ${season} card — ${beneName(beneficiaryId)}`,
  });
  return { queued: true };
}

export function submitCardRemove(beneficiaryId: string, cardId: string): SubmitResult {
  const office = getBeneficiary(beneficiaryId)?.officeId ?? "";
  if (actorIsAdminFor(office)) {
    removeSeasonalCard(beneficiaryId, cardId);
    return { queued: false };
  }
  createChangeRequest({
    officeId: office, beneficiaryId, kind: "card_remove", payload: { cardId },
    summary: `Remove a card — ${beneName(beneficiaryId)}`,
  });
  return { queued: true };
}

// -----------------------------------------------------------------------------
// File saving (routes to Supabase Storage in real mode, base64 in demo)
// -----------------------------------------------------------------------------
/** Save a cropped/generated image (data URL). Returns a URL to store.
 *  Offline: keeps the base64 image; it's uploaded to Storage on the next sync. */
export async function saveImageDataUrl(dataUrl: string, kind: "photo" | "card", officeId: OfficeId): Promise<string> {
  if (!SUPABASE_ENABLED) return dataUrl;
  if (!offline.isOnline()) return dataUrl; // deferred — resolved during flush()
  const bucket = kind === "card" ? BUCKETS.cards : BUCKETS.photos;
  return db.dbUploadImageDataUrl(dataUrl, bucket, officeId);
}

/** Save a picked image File. Returns a URL to store (deferred when offline). */
export async function saveImageFile(file: File, kind: "photo" | "card", officeId: OfficeId): Promise<string> {
  if (!SUPABASE_ENABLED) return fileToDataUrl(file);
  if (!offline.isOnline()) return fileToDataUrl(file); // deferred — uploaded on sync
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
