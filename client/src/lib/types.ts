// Child Labor Project — shared domain types.
// The system runs ONE program across TWO offices (Cairo + Minya).
// Data is office-scoped: users can only edit records in their own office.

// -----------------------------------------------------------------------------
// Offices
// -----------------------------------------------------------------------------
export type OfficeId = string;

export interface Office {
  id: OfficeId;
  name: string; // "Cairo Office"
  city: string; // "Cairo"
  governorate: string; // "Cairo" | "Minya"
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Users & roles
// -----------------------------------------------------------------------------
// super_admin  — oversees BOTH offices, manages all accounts, edits everything.
// office_admin — bound to ONE office: full rights inside it + approves forms.
// editor       — bound to ONE office: creates/edits records (need approval).
// viewer       — read-only across everything; can view analytics + download files.
export type Role = "super_admin" | "office_admin" | "editor" | "viewer";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  officeId: OfficeId | null; // null for super_admin & viewer (not office-bound)
  active: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Project (single program — kept for the API contract / reporting)
// -----------------------------------------------------------------------------
export interface Project {
  id: string;
  projectName: string;
  countryName: string;
  responsibleProjectManager: string;
  responsibleSponsorshipOfficerIO: string;
  responsibleCountryDirector: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Beneficiary (the child)
// -----------------------------------------------------------------------------
export type BeneficiaryStatus = "entry" | "priority" | "sponsored" | "leaving";
export type Gender = "male" | "female";
export type HealthSituation = "good" | "average" | "poor";
export type ParentsAlive = "both" | "father" | "mother";
export type LiveWith = "both" | "father" | "mother" | "others";
export type HouseType = "mud_brick" | "reinforced_concrete";
export type SchoolPerformance = "excellent" | "good" | "average" | "weak";

// Records entered by editors are pending until an admin approves them.
export type ApprovalStatus = "pending" | "approved";

export interface Beneficiary {
  id: string;
  projectId: string;
  officeId: OfficeId; // which office owns / can edit this record
  beneficiaryNumber: string;
  status: BeneficiaryStatus;

  // Approval workflow
  approvalStatus: ApprovalStatus;
  submittedByUserId?: string;
  approvedByUserId?: string;
  approvedAt?: string;

  // --- General ---
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date; age computed on the client
  gender: Gender;
  photoUrl?: string;
  language: string;
  village: string; // aka Community

  // --- Health ---
  healthSituation: HealthSituation;

  // --- Social ---
  hobbies: string[];
  favoriteColor: string;
  character: string[];

  // --- Family ---
  parentsAlive: ParentsAlive;
  liveWithBothParents: boolean;
  liveWith: LiveWith;
  hasSiblings: boolean;
  siblingsCount?: number;
  typeOfHouse: HouseType;
  guardianName: string; // e.g. "Mourice (Father), Martha (Mother)"
  relationToChild: string; // e.g. "Biological Parents"

  // --- Education ---
  schoolName: string; // e.g. "Gabal El-Mokattam School"
  schoolLevel: string; // grade, e.g. "Primary 1"
  schoolPerformance: SchoolPerformance;
  favoriteSubject: string;
  futurePlans: string;

  // --- Scholarship / sponsorship ---
  tuitionFees?: number; // annual, EGP
  amountSponsored?: number; // by the project, EGP
  additionalAid: string; // e.g. "Medical support when needed"
  scholarshipReason: string; // long text
  scholarshipImpact: string; // long text — how the scholarship helps

  // --- Seasonal thank-you card (Christmas / Easter) ---
  seasonalCardUrl?: string; // uploaded drawing/card image
  seasonalCardSeason?: SeasonKind; // which season it was uploaded for
  seasonalCardUpdatedAt?: string;

  createdAt: string;
}

// -----------------------------------------------------------------------------
// Seasonal card
// -----------------------------------------------------------------------------
export type SeasonKind = "christmas" | "easter";

// -----------------------------------------------------------------------------
// Individual progress report
// -----------------------------------------------------------------------------
export type ReportType = "quarterly" | "semi_annual" | "annual";

export interface ProgressReport {
  id: string;
  beneficiaryId: string;
  reportType: ReportType;
  period: string; // Q1..Q4 | H1/H2 | Full Year
  cycleYear: number; // 1..3 (program year)
  date: string;
  updatePhotoUrl?: string;
  messageToSponsor: string;
  beneficiaryUpdate: string;
  authorUserId: string;
}

// -----------------------------------------------------------------------------
// Annual office report (a Word/PDF document uploaded per office, per year)
// -----------------------------------------------------------------------------
export type OfficeReportFileType = "word" | "pdf";

export interface OfficeReport {
  id: string;
  officeId: OfficeId;
  year: number;
  title: string;
  fileName: string;
  fileType: OfficeReportFileType;
  fileUrl: string; // data URL now; object-storage URL after Phase 2
  uploadedByUserId: string;
  uploadedAt: string;
}

// -----------------------------------------------------------------------------
// Leaving record
// -----------------------------------------------------------------------------
export type LeavingReason =
  | "change_of_residence"
  | "death"
  | "joined_another_project"
  | "improved_living_standard";

export interface LeavingRecord {
  id: string;
  beneficiaryId: string;
  reason: LeavingReason;
  explanation?: string;
  date: string;
  authorUserId: string;
}
