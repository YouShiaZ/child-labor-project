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

interface OutboxItem { id: string; op: Op; createdAt: number; }

let outbox: OutboxItem[] = [];
let syncing = false;
let listeners: (() => void)[] = [];

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? "op-" + Math.random().toString(36).slice(2) + Date.now();

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
export function pendingCount(): number { return outbox.length; }
export function isSyncing(): boolean { return syncing; }

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}
function notify() { listeners.forEach((l) => l()); }

// ---------------------------------------------------------------- Persistence
export async function loadOutbox(): Promise<void> {
  try { outbox = (await get(OUTBOX_KEY)) ?? []; } catch { outbox = []; }
  notify();
}
async function saveOutbox(): Promise<void> {
  try { await set(OUTBOX_KEY, outbox); } catch (e) { console.warn("[CLP] outbox save failed", e); }
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
    case "insertBeneficiary": return db.dbInsertBeneficiary(op.data);
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

/** Replay the outbox to Supabase, in order. Safe to call repeatedly. */
export async function flush(onResolved: OnResolved = () => {}): Promise<void> {
  if (!SUPABASE_ENABLED || syncing || !isOnline() || outbox.length === 0) return;
  syncing = true;
  notify();
  try {
    while (outbox.length > 0 && isOnline()) {
      const item = outbox[0];
      const op = await resolveImages(item.op, onResolved);
      await applyOp(op);
      outbox.shift();
      await saveOutbox();
    }
  } catch (e) {
    // Stop on the first failure (likely lost connection); keep the rest queued.
    console.error("[CLP] sync paused, will retry:", e);
  } finally {
    syncing = false;
    notify();
  }
}
