// Child Labor Project — offline support.
//
// Field workers enter data in villages with no internet. This module lets the
// app keep working offline and sync everything when the connection returns.
//
// How it works:
//   • A SNAPSHOT of all data is cached in IndexedDB, so the app opens with data
//     even offline (after the first online login).
//   • Every write also becomes a serializable OP appended to an OUTBOX in
//     IndexedDB. When offline, ops just queue. When back online, flush() replays
//     them to Supabase in order (uploading any images that were captured offline).
import { get, set } from "idb-keyval";
import { SUPABASE_ENABLED, BUCKETS } from "./supabase";
import * as db from "./db";

const SNAPSHOT_KEY = "clp_snapshot_v1";
const OUTBOX_KEY = "clp_outbox_v1";

// ---------------------------------------------------------------- Op types
export type Op =
  | { kind: "insertBeneficiary"; data: any }
  | { kind: "updateBeneficiary"; id: string; patch: any; officeId: string }
  | { kind: "insertCard"; beneficiaryId: string; card: any; officeId: string }
  | { kind: "deleteCard"; cardId: string }
  | { kind: "insertReport"; report: any; officeId: string }
  | { kind: "insertOfficeReport"; report: any }
  | { kind: "deleteOfficeReport"; id: string }
  | { kind: "insertLeaving"; leaving: any }
  | { kind: "updateProject"; id: string; patch: any }
  | { kind: "updateUserProfile"; id: string; patch: any }
  | { kind: "insertChangeRequest"; cr: any }
  | { kind: "updateChangeRequestStatus"; id: string; status: string; reviewerId: string }
  | { kind: "logActivity"; entry: any };

interface OutboxItem { id: string; op: Op; createdAt: number; attempts?: number; error?: string; }

const FAILED_KEY = "clp_failed_v1";

let outbox: OutboxItem[] = [];
let failed: OutboxItem[] = [];
let syncing = false;
let needsReauth = false;
let listeners: (() => void)[] = [];

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? "op-" + Math.random().toString(36).slice(2) + Date.now();

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
export function pendingCount(): number { return outbox.length; }
export function failedCount(): number { return failed.length; }
export function isSyncing(): boolean { return syncing; }
export function reauthNeeded(): boolean { return needsReauth; }

export function describeOp(op: Op): string {
  switch (op.kind) {
    case "insertBeneficiary": return `New beneficiary: ${op.data.firstName} ${op.data.lastName}`;
    case "updateBeneficiary": return "Beneficiary edit";
    case "insertCard": return "Add thank-you card";
    case "deleteCard": return "Remove card";
    case "insertReport": return "Add progress report";
    case "insertLeaving": return "Start leaving";
    case "insertChangeRequest": return `Approval request: ${op.cr.summary}`;
    case "insertOfficeReport": return "Annual report upload";
    default: return op.kind;
  }
}

export function getPending() {
  return outbox.map((i) => ({ id: i.id, summary: describeOp(i.op), at: i.createdAt }));
}
export function getFailed() {
  return failed.map((i) => ({ id: i.id, summary: describeOp(i.op), error: i.error ?? "", at: i.createdAt }));
}
/** Move failed items back to the front of the outbox so a retry re-sends them. */
export async function requeueFailed(): Promise<void> {
  outbox = [...failed, ...outbox];
  failed = [];
  await saveOutbox();
  await saveFailed();
}
export async function discardFailed(id?: string): Promise<void> {
  failed = id ? failed.filter((f) => f.id !== id) : [];
  await saveFailed();
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}
function notify() { listeners.forEach((l) => l()); }

// ---------------------------------------------------------------- Persistence
export async function loadOutbox(): Promise<void> {
  try { outbox = (await get(OUTBOX_KEY)) ?? []; } catch { outbox = []; }
  try { failed = (await get(FAILED_KEY)) ?? []; } catch { failed = []; }
  notify();
}
async function saveOutbox(): Promise<void> {
  try { await set(OUTBOX_KEY, outbox); } catch (e) { console.warn("[CLP] outbox save failed", e); }
  notify();
}
async function saveFailed(): Promise<void> {
  try { await set(FAILED_KEY, failed); } catch (e) { console.warn("[CLP] failed-list save failed", e); }
  notify();
}

export async function saveSnapshot(snap: unknown): Promise<void> {
  try { await set(SNAPSHOT_KEY, snap); } catch (e) { console.warn("[CLP] snapshot save failed", e); }
}
export async function loadSnapshot<T = unknown>(): Promise<T | null> {
  try { return ((await get(SNAPSHOT_KEY)) as T) ?? null; } catch { return null; }
}

export async function enqueue(op: Op): Promise<void> {
  outbox.push({ id: uid(), op, createdAt: Date.now() });
  await saveOutbox();
}

// ---------------------------------------------------------------- Sync / flush
const isDataUrl = (v: unknown): v is string => typeof v === "string" && v.startsWith("data:");

type OnResolved = (oldUrl: string, newUrl: string) => void;

async function uploadIfDeferred(url: unknown, bucket: string, officeId: string, onResolved: OnResolved): Promise<any> {
  if (!isDataUrl(url)) return url;
  const newUrl = await db.dbUploadImageDataUrl(url, bucket, officeId);
  onResolved(url, newUrl);
  return newUrl;
}

// Upload any offline-captured images inside an op, then return the resolved op.
async function resolveImages(op: Op, onResolved: OnResolved): Promise<Op> {
  switch (op.kind) {
    case "insertBeneficiary": {
      const d = op.data;
      d.photoUrl = await uploadIfDeferred(d.photoUrl, BUCKETS.photos, d.officeId, onResolved);
      if (Array.isArray(d.seasonalCards)) {
        for (const c of d.seasonalCards) c.url = await uploadIfDeferred(c.url, BUCKETS.cards, d.officeId, onResolved);
      }
      return op;
    }
    case "updateBeneficiary":
      op.patch.photoUrl = await uploadIfDeferred(op.patch.photoUrl, BUCKETS.photos, op.officeId, onResolved);
      return op;
    case "insertCard":
      op.card.url = await uploadIfDeferred(op.card.url, BUCKETS.cards, op.officeId, onResolved);
      return op;
    case "insertReport":
      op.report.updatePhotoUrl = await uploadIfDeferred(op.report.updatePhotoUrl, BUCKETS.photos, op.officeId, onResolved);
      return op;
    case "insertChangeRequest": {
      // change requests may carry deferred images inside their payload
      const p = op.cr.payload ?? {};
      if (isDataUrl(p.photoUrl)) p.photoUrl = await uploadIfDeferred(p.photoUrl, BUCKETS.photos, op.cr.officeId, onResolved);
      if (isDataUrl(p.url)) p.url = await uploadIfDeferred(p.url, BUCKETS.cards, op.cr.officeId, onResolved);
      if (isDataUrl(p.updatePhotoUrl)) p.updatePhotoUrl = await uploadIfDeferred(p.updatePhotoUrl, BUCKETS.photos, op.cr.officeId, onResolved);
      return op;
    }
    default:
      return op;
  }
}

async function applyOp(op: Op): Promise<void> {
  switch (op.kind) {
    case "insertBeneficiary": { await db.dbInsertBeneficiary(op.data); return; }
    case "updateBeneficiary": return db.dbUpdateBeneficiary(op.id, op.patch);
    case "insertCard": return db.dbInsertCard(op.beneficiaryId, op.card);
    case "deleteCard": return db.dbDeleteCard(op.cardId);
    case "insertReport": return db.dbInsertReport(op.report);
    case "insertOfficeReport": return db.dbInsertOfficeReport(op.report);
    case "deleteOfficeReport": return db.dbDeleteOfficeReport(op.id);
    case "insertLeaving": return db.dbInsertLeaving(op.leaving);
    case "updateProject": return db.dbUpdateProject(op.id, op.patch);
    case "updateUserProfile": return db.dbUpdateUserProfile(op.id, op.patch);
    case "insertChangeRequest": return db.dbInsertChangeRequest(op.cr);
    case "updateChangeRequestStatus": return db.dbUpdateChangeRequestStatus(op.id, op.status, op.reviewerId);
    case "logActivity": return db.dbLogActivity(op.entry);
  }
}

const isNetErr = (e: unknown) =>
  /fetch|network|failed to fetch|networkerror|load failed|timeout/i.test((e as { message?: string })?.message ?? "");
const isAuthErr = (e: unknown) => {
  const s = ((e as { message?: string })?.message ?? "") + " " + ((e as { code?: string })?.code ?? "");
  return /jwt|token|expired|not authenticated|unauthorized|401|pgrst301|pgrst303/i.test(s);
};
const errMsg = (e: unknown) => {
  const x = e as { message?: string; details?: string; hint?: string };
  return [x?.message, x?.details, x?.hint].filter(Boolean).join(" — ") || "unknown error";
};

/** Replay the outbox to Supabase, in order. Safe to call repeatedly.
 *  - network error → stop and retry later (keeps everything queued)
 *  - session expired → stop and flag re-auth
 *  - permanent error → move that one op to the failed list and keep going */
export async function flush(onResolved: OnResolved = () => {}): Promise<void> {
  if (!SUPABASE_ENABLED || syncing || !isOnline() || outbox.length === 0) return;
  syncing = true;
  needsReauth = false;
  notify();
  try {
    while (outbox.length > 0 && isOnline()) {
      const item = outbox[0];
      try {
        const op = await resolveImages(item.op, onResolved);
        await applyOp(op);
        outbox.shift();
        await saveOutbox();
      } catch (e) {
        if (isNetErr(e)) break; // lost connection — keep queued, retry later
        if (isAuthErr(e)) { needsReauth = true; break; } // session expired — ask re-login
        // Permanent error (e.g. validation/permission) → dead-letter and continue.
        console.error("[CLP] op failed permanently, moving to failed list:", e);
        item.attempts = (item.attempts ?? 0) + 1;
        item.error = errMsg(e);
        failed.push(item);
        outbox.shift();
        await saveOutbox();
        await saveFailed();
      }
    }
  } finally {
    syncing = false;
    notify();
  }
}
