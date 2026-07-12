// Child Labor Project — shared TypeScript types (mirrors STRUCTURE.md)

export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  projectName: string;
  countryName: string;
  responsibleProjectManager: string;
  responsibleSponsorshipOfficerIO: string;
  responsibleCountryDirector: string;
  createdAt: string;
}

export type BeneficiaryStatus = "entry" | "priority" | "sponsored" | "leaving";
export type Gender = "male" | "female";
export type HealthSituation = "good" | "average" | "poor";
export type ParentsAlive = "both" | "father" | "mother";
export type LiveWith = "both" | "father" | "mother" | "others";
export type HouseType = "mud_brick" | "reinforced_concrete";
export type SchoolPerformance = "excellent" | "good" | "average" | "weak";

export interface Beneficiary {
  id: string;
  projectId: string;
  beneficiaryNumber: string;
  status: BeneficiaryStatus;

  // General
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date; age computed on client
  gender: Gender;
  photoUrl?: string;
  language: string;
  village: string;

  // Health
  healthSituation: HealthSituation;

  // Social
  hobbies: string[];
  favoriteColor: string;
  character: string[];

  // Family
  parentsAlive: ParentsAlive;
  liveWithBothParents: boolean;
  liveWith: LiveWith;
  hasSiblings: boolean;
  siblingsCount?: number;
  typeOfHouse: HouseType;

  // Education
  schoolLevel: string;
  schoolPerformance: SchoolPerformance;
  favoriteSubject: string;
  futurePlans: string;

  createdAt: string;
}

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
