// Child Labor Project — Supabase data access (REAL mode only).
//
// Maps between database rows (snake_case) and app types (camelCase), provides
// CRUD for every table, and uploads files to Supabase Storage. All of this is
// only used when SUPABASE_ENABLED; in demo mode api.ts uses localStorage.
import { supabase, BUCKETS } from "./supabase";
import type {
  User,
  Office,
  Project,
  Beneficiary,
  SeasonalCard,
  ProgressReport,
  OfficeReport,
  LeavingRecord,
  OfficeId,
} from "./types";

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const uuid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));

// -----------------------------------------------------------------------------
// Row <-> type mappers
// -----------------------------------------------------------------------------
const toOffice = (r: any): Office => ({
  id: r.id, name: r.name, city: r.city, governorate: r.governorate, createdAt: r.created_at,
});

const toUser = (r: any): User => ({
  id: r.id, fullName: r.full_name, email: r.email, role: r.role,
  officeId: r.office_id ?? null, active: r.active, createdAt: r.created_at,
});

const toProject = (r: any): Project => ({
  id: r.id, projectName: r.project_name, countryName: r.country_name,
  responsibleProjectManager: r.responsible_project_manager ?? "",
  responsibleSponsorshipOfficerIO: r.responsible_sponsorship_officer_io ?? "",
  responsibleCountryDirector: r.responsible_country_director ?? "",
  createdAt: r.created_at,
});

const toCard = (r: any): SeasonalCard => ({
  id: r.id, url: r.url, season: r.season, year: r.year, uploadedAt: r.uploaded_at,
});

const toBeneficiary = (r: any, cards: SeasonalCard[]): Beneficiary => ({
  id: r.id,
  projectId: r.project_id,
  officeId: r.office_id,
  beneficiaryNumber: r.beneficiary_number,
  status: r.status,
  approvalStatus: r.approval_status,
  submittedByUserId: r.submitted_by ?? undefined,
  approvedByUserId: r.approved_by ?? undefined,
  approvedAt: r.approved_at ?? undefined,
  firstName: r.first_name,
  lastName: r.last_name,
  dateOfBirth: r.date_of_birth,
  gender: r.gender,
  photoUrl: r.photo_url ?? undefined,
  language: r.language ?? "Arabic",
  village: r.village ?? "",
  healthSituation: r.health_situation,
  hobbies: r.hobbies ?? [],
  favoriteColor: r.favorite_color ?? "",
  character: r.character ?? [],
  parentsAlive: r.parents_alive,
  liveWithBothParents: r.live_with_both_parents,
  liveWith: r.live_with,
  hasSiblings: r.has_siblings,
  siblingsCount: r.siblings_count ?? undefined,
  typeOfHouse: r.type_of_house,
  guardianName: r.guardian_name ?? "",
  relationToChild: r.relation_to_child ?? "",
  schoolName: r.school_name ?? "",
  schoolLevel: r.school_level ?? "",
  schoolPerformance: r.school_performance,
  favoriteSubject: r.favorite_subject ?? "",
  futurePlans: r.future_plans ?? "",
  tuitionFees: r.tuition_fees ?? undefined,
  amountSponsored: r.amount_sponsored ?? undefined,
  additionalAid: r.additional_aid ?? "",
  scholarshipReason: r.scholarship_reason ?? "",
  scholarshipImpact: r.scholarship_impact ?? "",
  seasonalCards: cards,
  createdAt: r.created_at,
});

// camelCase Beneficiary field -> snake_case column (for partial updates)
const BENE_COLS: Record<string, string> = {
  status: "status", approvalStatus: "approval_status",
  submittedByUserId: "submitted_by", approvedByUserId: "approved_by", approvedAt: "approved_at",
  firstName: "first_name", lastName: "last_name", dateOfBirth: "date_of_birth",
  gender: "gender", photoUrl: "photo_url", language: "language", village: "village",
  healthSituation: "health_situation", hobbies: "hobbies", favoriteColor: "favorite_color",
  character: "character", parentsAlive: "parents_alive", liveWithBothParents: "live_with_both_parents",
  liveWith: "live_with", hasSiblings: "has_siblings", siblingsCount: "siblings_count",
  typeOfHouse: "type_of_house", guardianName: "guardian_name", relationToChild: "relation_to_child",
  schoolName: "school_name", schoolLevel: "school_level", schoolPerformance: "school_performance",
  favoriteSubject: "favorite_subject", futurePlans: "future_plans", tuitionFees: "tuition_fees",
  amountSponsored: "amount_sponsored", additionalAid: "additional_aid",
  scholarshipReason: "scholarship_reason", scholarshipImpact: "scholarship_impact",
};

const beneficiaryToRow = (b: Beneficiary) => ({
  id: b.id, project_id: b.projectId, office_id: b.officeId,
  beneficiary_number: b.beneficiaryNumber, status: b.status,
  approval_status: b.approvalStatus, submitted_by: b.submittedByUserId ?? null,
  approved_by: b.approvedByUserId ?? null, approved_at: b.approvedAt ?? null,
  first_name: b.firstName, last_name: b.lastName, date_of_birth: b.dateOfBirth,
  gender: b.gender, photo_url: b.photoUrl ?? null, language: b.language, village: b.village,
  health_situation: b.healthSituation, hobbies: b.hobbies, favorite_color: b.favoriteColor,
  character: b.character, parents_alive: b.parentsAlive, live_with_both_parents: b.liveWithBothParents,
  live_with: b.liveWith, has_siblings: b.hasSiblings, siblings_count: b.siblingsCount ?? null,
  type_of_house: b.typeOfHouse, guardian_name: b.guardianName, relation_to_child: b.relationToChild,
  school_name: b.schoolName, school_level: b.schoolLevel, school_performance: b.schoolPerformance,
  favorite_subject: b.favoriteSubject, future_plans: b.futurePlans,
  tuition_fees: b.tuitionFees ?? null, amount_sponsored: b.amountSponsored ?? null,
  additional_aid: b.additionalAid, scholarship_reason: b.scholarshipReason,
  scholarship_impact: b.scholarshipImpact, created_at: b.createdAt,
});

const toReport = (r: any): ProgressReport => ({
  id: r.id, beneficiaryId: r.beneficiary_id, reportType: r.report_type, period: r.period,
  cycleYear: r.cycle_year, date: r.date, updatePhotoUrl: r.update_photo_url ?? undefined,
  messageToSponsor: r.message_to_sponsor ?? "", beneficiaryUpdate: r.beneficiary_update ?? "",
  authorUserId: r.author_id ?? "",
});

const toOfficeReport = (r: any): OfficeReport => ({
  id: r.id, officeId: r.office_id, year: r.year, title: r.title, fileName: r.file_name,
  fileType: r.file_type, fileUrl: r.file_url, uploadedByUserId: r.uploaded_by ?? "",
  uploadedAt: r.uploaded_at,
});

const toLeaving = (r: any): LeavingRecord => ({
  id: r.id, beneficiaryId: r.beneficiary_id, reason: r.reason,
  explanation: r.explanation ?? undefined, date: r.date, authorUserId: r.author_id ?? "",
});

// -----------------------------------------------------------------------------
// Snapshot (loaded once on startup, kept in memory by api.ts)
// -----------------------------------------------------------------------------
export interface DbSnapshot {
  offices: Office[];
  users: User[];
  projects: Project[];
  beneficiaries: Beneficiary[];
  reports: ProgressReport[];
  officeReports: OfficeReport[];
  leaving: LeavingRecord[];
}

export async function dbFetchAll(): Promise<DbSnapshot> {
  const sb = client();
  const [offices, users, projects, benes, cards, reports, officeReports, leaving] =
    await Promise.all([
      sb.from("offices").select("*"),
      sb.from("app_users").select("*"),
      sb.from("projects").select("*"),
      sb.from("beneficiaries").select("*"),
      sb.from("seasonal_cards").select("*"),
      sb.from("progress_reports").select("*"),
      sb.from("office_reports").select("*"),
      sb.from("leaving_records").select("*"),
    ]);
  for (const r of [offices, users, projects, benes, cards, reports, officeReports, leaving]) {
    if (r.error) throw r.error;
  }
  const cardsByBene = new Map<string, SeasonalCard[]>();
  (cards.data ?? []).forEach((c: any) => {
    const arr = cardsByBene.get(c.beneficiary_id) ?? [];
    arr.push(toCard(c));
    cardsByBene.set(c.beneficiary_id, arr);
  });
  return {
    offices: (offices.data ?? []).map(toOffice),
    users: (users.data ?? []).map(toUser),
    projects: (projects.data ?? []).map(toProject),
    beneficiaries: (benes.data ?? []).map((b: any) => toBeneficiary(b, cardsByBene.get(b.id) ?? [])),
    reports: (reports.data ?? []).map(toReport),
    officeReports: (officeReports.data ?? []).map(toOfficeReport),
    leaving: (leaving.data ?? []).map(toLeaving),
  };
}

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------
export async function dbInsertBeneficiary(b: Beneficiary) {
  const sb = client();
  const { error } = await sb.from("beneficiaries").insert(beneficiaryToRow(b));
  if (error) throw error;
  if (b.seasonalCards.length) {
    const rows = b.seasonalCards.map((c) => ({
      id: c.id, beneficiary_id: b.id, season: c.season, year: c.year, url: c.url, uploaded_at: c.uploadedAt,
    }));
    const { error: e2 } = await sb.from("seasonal_cards").insert(rows);
    if (e2) throw e2;
  }
}

export async function dbUpdateBeneficiary(id: string, patch: Record<string, unknown>) {
  const sb = client();
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "seasonalCards") continue; // cards handled via their own table
    const col = BENE_COLS[k];
    if (col) row[col] = v ?? null;
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("beneficiaries").update(row).eq("id", id);
  if (error) throw error;
}

export async function dbInsertCard(beneficiaryId: string, c: SeasonalCard) {
  const sb = client();
  const { error } = await sb.from("seasonal_cards").insert({
    id: c.id, beneficiary_id: beneficiaryId, season: c.season, year: c.year, url: c.url, uploaded_at: c.uploadedAt,
  });
  if (error) throw error;
}

export async function dbDeleteCard(cardId: string) {
  const sb = client();
  const { error } = await sb.from("seasonal_cards").delete().eq("id", cardId);
  if (error) throw error;
}

export async function dbInsertReport(r: ProgressReport) {
  const sb = client();
  const { error } = await sb.from("progress_reports").insert({
    id: r.id, beneficiary_id: r.beneficiaryId, report_type: r.reportType, period: r.period,
    cycle_year: r.cycleYear, date: r.date, update_photo_url: r.updatePhotoUrl ?? null,
    message_to_sponsor: r.messageToSponsor, beneficiary_update: r.beneficiaryUpdate, author_id: r.authorUserId,
  });
  if (error) throw error;
}

export async function dbInsertOfficeReport(r: OfficeReport) {
  const sb = client();
  const { error } = await sb.from("office_reports").insert({
    id: r.id, office_id: r.officeId, year: r.year, title: r.title, file_name: r.fileName,
    file_type: r.fileType, file_url: r.fileUrl, uploaded_by: r.uploadedByUserId, uploaded_at: r.uploadedAt,
  });
  if (error) throw error;
}

export async function dbDeleteOfficeReport(id: string) {
  const sb = client();
  const { error } = await sb.from("office_reports").delete().eq("id", id);
  if (error) throw error;
}

export async function dbInsertLeaving(l: LeavingRecord) {
  const sb = client();
  const { error } = await sb.from("leaving_records").insert({
    id: l.id, beneficiary_id: l.beneficiaryId, reason: l.reason,
    explanation: l.explanation ?? null, date: l.date, author_id: l.authorUserId,
  });
  if (error) throw error;
}

export async function dbUpdateProject(id: string, patch: Partial<Project>) {
  const sb = client();
  const row: Record<string, unknown> = {};
  if (patch.projectName !== undefined) row.project_name = patch.projectName;
  if (patch.countryName !== undefined) row.country_name = patch.countryName;
  if (patch.responsibleProjectManager !== undefined) row.responsible_project_manager = patch.responsibleProjectManager;
  if (patch.responsibleSponsorshipOfficerIO !== undefined) row.responsible_sponsorship_officer_io = patch.responsibleSponsorshipOfficerIO;
  if (patch.responsibleCountryDirector !== undefined) row.responsible_country_director = patch.responsibleCountryDirector;
  const { error } = await sb.from("projects").update(row).eq("id", id);
  if (error) throw error;
}

// Non-auth profile fields a super admin can change directly (RLS-guarded).
export async function dbUpdateUserProfile(id: string, patch: Partial<User>) {
  const sb = client();
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.officeId !== undefined) row.office_id = patch.officeId;
  if (patch.active !== undefined) row.active = patch.active;
  const { error } = await sb.from("app_users").update(row).eq("id", id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Activity log (audit trail: who did what)
// -----------------------------------------------------------------------------
export interface ActivityRow {
  id: string;
  actorId: string | null;
  actorName: string;
  officeId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

export async function dbLogActivity(e: {
  actorId: string | null;
  actorName: string;
  officeId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
}) {
  const sb = client();
  const { error } = await sb.from("activity_log").insert({
    actor_id: e.actorId,
    actor_name: e.actorName,
    office_id: e.officeId,
    action: e.action,
    entity: e.entity,
    entity_id: e.entityId,
    summary: e.summary,
  });
  if (error) throw error;
}

export async function dbFetchRecentActivity(limit = 60): Promise<ActivityRow[]> {
  const sb = client();
  const { data, error } = await sb
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, actorId: r.actor_id, actorName: r.actor_name, officeId: r.office_id,
    action: r.action, entity: r.entity, entityId: r.entity_id, summary: r.summary, createdAt: r.created_at,
  }));
}

// -----------------------------------------------------------------------------
// Storage
// -----------------------------------------------------------------------------
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function uploadBlob(bucket: string, officeId: OfficeId, blob: Blob, ext: string): Promise<string> {
  const sb = client();
  const path = `${officeId}/${uuid()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, blob, {
    contentType: blob.type, upsert: false,
  });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a cropped/generated image (data URL) → returns the public URL. */
export async function dbUploadImageDataUrl(dataUrl: string, bucket: string, officeId: OfficeId): Promise<string> {
  return uploadBlob(bucket, officeId, dataUrlToBlob(dataUrl), "jpg");
}

/** Upload a picked File (image or document) → returns the public URL. */
export async function dbUploadFile(file: File, bucket: string, officeId: OfficeId): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  return uploadBlob(bucket, officeId, file, ext);
}

export { BUCKETS };
