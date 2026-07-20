// Child Labor Project — option lists & label maps for selects

export const HOBBY_OPTIONS = [
  "Football",
  "Drawing",
  "Reading",
  "Singing",
  "Dancing",
  "Swimming",
  "Cycling",
  "Cooking",
  "Playing instruments",
  "Gardening",
];

export const FAVORITE_COLOR_OPTIONS = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Pink",
  "White",
  "Black",
  "Brown",
];

export const CHARACTER_OPTIONS = [
  "Calm",
  "Shy",
  "Active",
  "Kind",
  "Curious",
  "Confident",
  "Helpful",
  "Hardworking",
  "Cheerful",
  "Quiet",
];

export const LANGUAGE_OPTIONS = [
  "Arabic",
  "English",
  "French",
  "Other",
];

export const SCHOOL_LEVEL_OPTIONS = [
  "Kindergarten",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "Preparatory 1",
  "Preparatory 2",
  "Preparatory 3",
  "Secondary 1",
  "Secondary 2",
  "Secondary 3",
  "Not enrolled",
];

export const FAVORITE_SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "Arabic",
  "English",
  "History",
  "Geography",
  "Art",
  "Physical Education",
  "Religion",
  "Computer",
];

export const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
};

export const HEALTH_LABELS: Record<string, string> = {
  good: "Good",
  average: "Average",
  poor: "Poor",
};

export const PARENTS_ALIVE_LABELS: Record<string, string> = {
  both: "Both alive",
  father: "Father alive",
  mother: "Mother alive",
};

export const LIVE_WITH_LABELS: Record<string, string> = {
  both: "With both parents",
  father: "With father",
  mother: "With mother",
  others: "With others",
};

export const HOUSE_LABELS: Record<string, string> = {
  mud_brick: "Mud brick",
  reinforced_concrete: "Reinforced concrete",
};

export const PERFORMANCE_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  weak: "Weak",
};

export const STATUS_LABELS: Record<string, string> = {
  entry: "Entry",
  priority: "Priority",
  sponsored: "Sponsored",
  leaving: "Leaving",
};

export const LEAVING_REASON_LABELS: Record<string, string> = {
  change_of_residence: "Change of residence",
  death: "Death",
  joined_another_project: "Joined another project",
  improved_living_standard: "Improved living standard",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  office_admin: "Office Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Oversees both offices, manages all accounts, full access.",
  office_admin: "Full rights within their office; approves submitted forms.",
  editor: "Enters and edits records in their office (pending approval).",
  viewer: "Read-only access to everything; can view analytics and downloads.",
};

export const APPROVAL_LABELS: Record<string, string> = {
  pending: "Pending approval",
  approved: "Approved",
};

// --- Seasonal thank-you card ---
export const SEASON_LABELS: Record<string, string> = {
  christmas: "Christmas Card",
  easter: "Easter Card",
};

// --- Annual office report ---
export const OFFICE_REPORT_TYPE_LABELS: Record<string, string> = {
  word: "Word",
  pdf: "PDF",
};

// --- Progress report periodicity ---
export const REPORT_TYPE_LABELS: Record<string, string> = {
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
};

export const REPORT_PERIOD_OPTIONS: Record<string, string[]> = {
  quarterly: ["Q1", "Q2", "Q3", "Q4"],
  semi_annual: ["H1", "H2"],
  annual: ["Full Year"],
};

export const CYCLE_YEAR_OPTIONS = [1, 2, 3];
