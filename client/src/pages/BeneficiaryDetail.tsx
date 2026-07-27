// Child Labor Project — Beneficiary record: Details / Progress Reports / Leaving.
// Editing is gated to users who own the record's office. Approval is shown and
// can be granted by office admins / super admin.
import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  getBeneficiary,
  updateBeneficiary,
  computeAge,
  listReports,
  createReport,
  getLeaving,
  startLeaving,
  getOffice,
  fileToDataUrl,
  downloadFile,
  approveBeneficiary,
  seasonalCardLabel,
  addSeasonalCard,
  removeSeasonalCard,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EditTextField, EditSelectField } from "@/components/EditField";
import ImageCropper from "@/components/ImageCropper";
import { SectionCard, StatusPill, HealthPill, ApprovalPill, OfficePill } from "@/components/ui-bits";
import {
  GENDER_LABELS,
  HEALTH_LABELS,
  PARENTS_ALIVE_LABELS,
  LIVE_WITH_LABELS,
  HOUSE_LABELS,
  PERFORMANCE_LABELS,
  LEAVING_REASON_LABELS,
  SCHOOL_LEVEL_OPTIONS,
  FAVORITE_SUBJECT_OPTIONS,
  REPORT_TYPE_LABELS,
  REPORT_PERIOD_OPTIONS,
  CYCLE_YEAR_OPTIONS,
  SEASON_LABELS,
} from "@/lib/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronLeft,
  UserIcon,
  HeartPulse,
  Smile,
  Users,
  GraduationCap,
  Coins,
  Gift,
  FileText,
  Plus,
  Upload,
  Download,
  LogOut,
  CalendarDays,
  CheckCircle2,
  Lock,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeavingReason, ReportType, Beneficiary } from "@/lib/types";

const TABS = ["details", "reports", "leaving"] as const;
type Tab = (typeof TABS)[number];

export default function BeneficiaryDetail() {
  const { id } = useParams();
  const { user, canEditOffice, canApprove } = useAuth();
  const [tab, setTab] = useState<Tab>("details");
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const b = getBeneficiary(id ?? "");
  if (!b) return <div className="py-24 text-center text-muted-foreground">Beneficiary not found.</div>;
  const office = getOffice(b.officeId);
  const editable = canEditOffice(b.officeId);
  const approver = canApprove(b.officeId);
  const age = computeAge(b.dateOfBirth);
  const reports = listReports(b.id);
  const leaving = getLeaving(b.id);

  const save = (patch: Record<string, unknown>) => {
    updateBeneficiary(b.id, patch);
    rerender();
  };

  const approve = () => {
    approveBeneficiary(b.id, user?.id ?? "");
    rerender();
    toast.success("Beneficiary approved.");
  };

  return (
    <div className="space-y-6">
      <Link href="/beneficiaries" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to beneficiaries
      </Link>

      {/* Approval banner */}
      {b.approvalStatus === "pending" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Lock className="h-4 w-4" />
            This record is pending approval.
          </div>
          {approver && (
            <Button size="sm" onClick={approve}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve record</Button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Header */}
          <div className="overflow-hidden rounded-xl bg-primary text-primary-foreground card-shadow">
            <div className="flex flex-wrap items-center gap-4 px-6 py-5">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-primary-foreground/60">{b.beneficiaryNumber}</div>
                <h1 className="font-display text-2xl font-bold">{b.firstName} {b.lastName}</h1>
                <div className="mt-1 text-sm text-primary-foreground/80">
                  {GENDER_LABELS[b.gender]} · {age} years · {b.village}
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-2">
                <StatusPill status={b.status} />
                {!editable && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary-foreground/70">
                    <Lock className="h-3 w-3" /> Read-only
                  </span>
                )}
              </div>
            </div>
            <div className="flex border-t border-white/10">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "relative px-5 py-3 text-sm font-medium capitalize transition-colors",
                    tab === t ? "text-white" : "text-primary-foreground/60 hover:text-white",
                  )}
                >
                  {t === "details" ? "Details Entry" : t === "reports" ? "Progress Reports" : "Leaving"}
                  {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-green)]" />}
                </button>
              ))}
            </div>
          </div>

          {tab === "details" && (
            <div className="space-y-6">
              <SectionCard title="General Information" icon={<UserIcon className="h-4 w-4" />}>
                <EditTextField canEdit={editable} label="First Name" value={b.firstName} onSave={(v) => save({ firstName: v })} />
                <EditTextField canEdit={editable} label="Last Name" value={b.lastName} onSave={(v) => save({ lastName: v })} />
                <EditTextField canEdit={editable} label="Date of Birth" type="date" value={b.dateOfBirth} onSave={(v) => save({ dateOfBirth: v })} />
                <EditTextField canEdit={false} label="Age" value={String(age ?? "")} display={`${age} years`} onSave={() => {}} />
                <EditSelectField canEdit={editable} label="Gender" value={b.gender} display={GENDER_LABELS[b.gender]} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} onSave={(v) => save({ gender: v })} />
                <EditTextField canEdit={editable} label="Language" value={b.language} onSave={(v) => save({ language: v })} />
                <EditTextField canEdit={editable} label="Village / Community" value={b.village} onSave={(v) => save({ village: v })} />
              </SectionCard>

              <SectionCard title="Health Situation" icon={<HeartPulse className="h-4 w-4" />}>
                <EditSelectField canEdit={editable} label="Health Situation" value={b.healthSituation} display={<HealthPill value={b.healthSituation} />} options={Object.entries(HEALTH_LABELS).map(([value, label]) => ({ value, label }))} onSave={(v) => save({ healthSituation: v })} />
              </SectionCard>

              <SectionCard title="Social Issues" icon={<Smile className="h-4 w-4" />}>
                <EditTextField canEdit={editable} label="Hobbies" value={b.hobbies.join(", ")} display={b.hobbies.join(", ")} onSave={(v) => save({ hobbies: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <EditTextField canEdit={editable} label="Favorite Color" value={b.favoriteColor} onSave={(v) => save({ favoriteColor: v })} />
                <EditTextField canEdit={editable} label="Character" value={b.character.join(", ")} display={b.character.join(", ")} onSave={(v) => save({ character: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </SectionCard>

              <SectionCard title="Family Situation" icon={<Users className="h-4 w-4" />}>
                <EditSelectField canEdit={editable} label="Parents Alive" value={b.parentsAlive} display={PARENTS_ALIVE_LABELS[b.parentsAlive]} options={Object.entries(PARENTS_ALIVE_LABELS).map(([value, label]) => ({ value, label }))} onSave={(v) => save({ parentsAlive: v })} />
                <EditSelectField canEdit={editable} label="Lives With" value={b.liveWith} display={LIVE_WITH_LABELS[b.liveWith]} options={Object.entries(LIVE_WITH_LABELS).map(([value, label]) => ({ value, label }))} onSave={(v) => save({ liveWith: v, liveWithBothParents: v === "both" })} />
                <EditTextField canEdit={editable} label="Siblings" value={b.hasSiblings ? String(b.siblingsCount ?? 0) : "0"} display={b.hasSiblings ? `Yes (${b.siblingsCount ?? 0})` : "No"} onSave={(v) => { const n = Number(v) || 0; save({ hasSiblings: n > 0, siblingsCount: n }); }} />
                <EditTextField canEdit={editable} label="Guardian's Name" value={b.guardianName} onSave={(v) => save({ guardianName: v })} />
                <EditTextField canEdit={editable} label="Relation to Child" value={b.relationToChild} onSave={(v) => save({ relationToChild: v })} />
                <EditSelectField canEdit={editable} label="Type of House" value={b.typeOfHouse} display={HOUSE_LABELS[b.typeOfHouse]} options={Object.entries(HOUSE_LABELS).map(([value, label]) => ({ value, label }))} onSave={(v) => save({ typeOfHouse: v })} />
              </SectionCard>

              <SectionCard title="Child Education" icon={<GraduationCap className="h-4 w-4" />}>
                <EditTextField canEdit={editable} label="School Name" value={b.schoolName} onSave={(v) => save({ schoolName: v })} />
                <EditSelectField canEdit={editable} label="Grade / Level" value={b.schoolLevel} display={b.schoolLevel} options={SCHOOL_LEVEL_OPTIONS.map((s) => ({ value: s, label: s }))} onSave={(v) => save({ schoolLevel: v })} />
                <EditSelectField canEdit={editable} label="School Performance" value={b.schoolPerformance} display={PERFORMANCE_LABELS[b.schoolPerformance]} options={Object.entries(PERFORMANCE_LABELS).map(([value, label]) => ({ value, label }))} onSave={(v) => save({ schoolPerformance: v })} />
                <EditSelectField canEdit={editable} label="Favorite Subject" value={b.favoriteSubject} display={b.favoriteSubject} options={FAVORITE_SUBJECT_OPTIONS.map((s) => ({ value: s, label: s }))} onSave={(v) => save({ favoriteSubject: v })} />
                <EditTextField canEdit={editable} label="Future Plans" value={b.futurePlans} onSave={(v) => save({ futurePlans: v })} />
              </SectionCard>

              <SectionCard title="Scholarship & Sponsorship" icon={<Coins className="h-4 w-4" />}>
                <EditTextField canEdit={editable} type="number" label="Annual Tuition (EGP)" value={String(b.tuitionFees ?? "")} display={b.tuitionFees ? `${b.tuitionFees.toLocaleString()} EGP` : "—"} onSave={(v) => save({ tuitionFees: v ? Number(v) : undefined })} />
                <EditTextField canEdit={editable} type="number" label="Amount Sponsored (EGP)" value={String(b.amountSponsored ?? "")} display={b.amountSponsored ? `${b.amountSponsored.toLocaleString()} EGP` : "—"} onSave={(v) => save({ amountSponsored: v ? Number(v) : undefined })} />
                <EditTextField canEdit={editable} label="Additional Aid" value={b.additionalAid} onSave={(v) => save({ additionalAid: v })} />
                <EditTextField canEdit={editable} label="Reason for Scholarship" value={b.scholarshipReason} onSave={(v) => save({ scholarshipReason: v })} />
                <EditTextField canEdit={editable} label="How It Helps" value={b.scholarshipImpact} onSave={(v) => save({ scholarshipImpact: v })} />
              </SectionCard>
            </div>
          )}

          {tab === "reports" && (
            <ReportsTab beneficiaryId={b.id} canEdit={editable} reports={reports} onChange={rerender} />
          )}

          {tab === "leaving" && (
            <LeavingTab beneficiaryId={b.id} canEdit={editable} leaving={leaving} onChange={rerender} />
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Photo */}
          <div className="rounded-xl border border-border bg-card p-4 card-shadow">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
              {b.photoUrl ? (
                <img src={b.photoUrl} alt={b.firstName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><UserIcon className="h-12 w-12" /></div>
              )}
            </div>
            <div className="mt-1 text-center text-[11px] text-muted-foreground">Entry photo (stays fixed)</div>
            <div className="mt-3 flex gap-2">
              {b.photoUrl && (
                <Button variant="outline" className="flex-1 bg-card" onClick={() => downloadFile(b.photoUrl!, `${b.beneficiaryNumber}-photo.jpg`)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              )}
              {editable && (
                <ImageCropper
                  title="Adjust photo"
                  onCropped={(url) => save({ photoUrl: url })}
                  trigger={
                    <Button variant="outline" className="flex-1 bg-card">
                      <Upload className="mr-2 h-4 w-4" /> Update
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Progress photos over time (entry photo + one per report) */}
          <ProgressPhotos beneficiary={b} reports={reports} />

          {/* Seasonal cards gallery */}
          <SeasonalCards beneficiary={b} canEdit={editable} onChange={rerender} />

          {/* Quick info */}
          <div className="rounded-xl border border-border bg-card p-4 card-shadow">
            <h4 className="mb-3 font-display text-sm font-semibold text-primary">Quick info</h4>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">Office</dt><dd>{office ? <OfficePill name={office.name} /> : "—"}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">Approval</dt><dd><ApprovalPill status={b.approvalStatus} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Number</dt><dd className="font-medium">{b.beneficiaryNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Age</dt><dd className="font-medium">{age} years</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">Health</dt><dd><HealthPill value={b.healthSituation} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">School</dt><dd className="font-medium text-right">{b.schoolName || "—"}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Seasonal cards
// Full history: every uploaded card stays visible. Upload adds a new card
// labelled with the current season; old cards are never overwritten.
function SeasonalCards({
  beneficiary: b,
  canEdit,
  onChange,
}: {
  beneficiary: Beneficiary;
  canEdit: boolean;
  onChange: () => void;
}) {
  const uploadLabel = seasonalCardLabel();
  const cards = [...(b.seasonalCards ?? [])].sort((a, c) =>
    a.uploadedAt < c.uploadedAt ? 1 : -1,
  );

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      addSeasonalCard(b.id, url);
      onChange();
      toast.success(`${uploadLabel} uploaded.`);
    } catch {
      toast.error("Could not read that image.");
    }
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
          <Gift className="h-4 w-4" /> Thank-you Cards
        </h4>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>

      {cards.length === 0 ? (
        <div className="grid aspect-video place-items-center rounded-lg bg-muted text-muted-foreground">
          <Gift className="h-10 w-10" />
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img src={c.url} alt={`${SEASON_LABELS[c.season]} ${c.year}`} className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-xs font-medium text-foreground">
                  {SEASON_LABELS[c.season]} · {c.year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => downloadFile(c.url, `${b.beneficiaryNumber}-${c.season}-${c.year}.jpg`)}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => { removeSeasonalCard(b.id, c.id); onChange(); toast.success("Card removed."); }}
                      className="grid h-7 w-7 place-items-center rounded-md text-rose-600 hover:bg-rose-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-primary hover:bg-muted/40">
          <Upload className="h-4 w-4" /> Add {uploadLabel}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      )}
    </div>
  );
}

// Photo timeline: the fixed entry photo plus each progress report's photo.
function ProgressPhotos({
  beneficiary: b,
  reports,
}: {
  beneficiary: Beneficiary;
  reports: ReturnType<typeof listReports>;
}) {
  const items: { url: string; label: string; date: string }[] = [];
  if (b.photoUrl) items.push({ url: b.photoUrl, label: "Entry", date: b.createdAt });
  reports
    .filter((r) => r.updatePhotoUrl)
    .forEach((r) =>
      items.push({
        url: r.updatePhotoUrl!,
        label: `${REPORT_TYPE_LABELS[r.reportType]} ${r.period}`,
        date: r.date,
      }),
    );

  if (items.length <= 1) return null; // nothing added beyond the entry photo yet

  return (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-primary">
        <ImageIcon className="h-4 w-4" /> Photos over time
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((it, i) => (
          <div key={i} className="w-24 shrink-0">
            <div className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img src={it.url} alt={it.label} className="h-full w-full object-cover" />
            </div>
            <div className="mt-1 truncate text-center text-[11px] font-medium text-foreground">{it.label}</div>
            <div className="truncate text-center text-[10px] text-muted-foreground">{it.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Reports
function ReportsTab({
  beneficiaryId,
  canEdit,
  reports,
  onChange,
}: {
  beneficiaryId: string;
  canEdit: boolean;
  reports: ReturnType<typeof listReports>;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("quarterly");
  const [period, setPeriod] = useState("Q1");
  const [cycleYear, setCycleYear] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [messageToSponsor, setMessageToSponsor] = useState("");
  const [beneficiaryUpdate, setBeneficiaryUpdate] = useState("");
  const [photo, setPhoto] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all");

  const changeType = (v: string) => {
    const t = v as ReportType;
    setReportType(t);
    setPeriod(REPORT_PERIOD_OPTIONS[t][0]);
  };

  const visible = typeFilter === "all" ? reports : reports.filter((r) => r.reportType === typeFilter);

  const submit = () => {
    if (!messageToSponsor.trim() && !beneficiaryUpdate.trim()) {
      toast.error("Please write a message or an update.");
      return;
    }
    const duplicate = reports.some((r) => r.reportType === reportType && r.period === period && r.cycleYear === Number(cycleYear));
    if (duplicate) {
      toast.error(`A ${REPORT_TYPE_LABELS[reportType]} report for ${period} (Year ${cycleYear}) already exists.`);
      return;
    }
    createReport({
      beneficiaryId,
      reportType,
      period,
      cycleYear: Number(cycleYear),
      date,
      updatePhotoUrl: photo || undefined,
      messageToSponsor,
      beneficiaryUpdate,
      authorUserId: user?.id ?? "u-editor",
    });
    setMessageToSponsor("");
    setBeneficiaryUpdate("");
    setPhoto("");
    setOpen(false);
    onChange();
    toast.success("Progress report added.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-base font-semibold text-primary">Individual Progress Reports</h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> New Report</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Progress Report</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Report type</Label>
                    <Select value={reportType} onValueChange={changeType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{REPORT_PERIOD_OPTIONS[reportType].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Program year</Label>
                    <Select value={cycleYear} onValueChange={setCycleYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CYCLE_YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Report date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Update photo</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-muted/40">
                    <Upload className="h-4 w-4" /> {photo ? "Photo selected" : "Choose photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setPhoto(await fileToDataUrl(f)); } catch { toast.error("Could not read that image."); } }} />
                  </label>
                </div>
                <div className="space-y-2"><Label>Message to the sponsor</Label><Textarea rows={3} value={messageToSponsor} onChange={(e) => setMessageToSponsor(e.target.value)} /></div>
                <div className="space-y-2"><Label>Beneficiary update</Label><Textarea rows={3} value={beneficiaryUpdate} onChange={(e) => setBeneficiaryUpdate(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Save Report</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
        {(["all", "quarterly", "semi_annual", "annual"] as const).map((t) => {
          const count = t === "all" ? reports.length : reports.filter((r) => r.reportType === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}>
              {t === "all" ? "All" : REPORT_TYPE_LABELS[t]}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8" /> No progress reports yet.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5 card-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-brand-green)]/12 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-green)]">{REPORT_TYPE_LABELS[r.reportType]}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{r.period}</span>
                  <span className="text-xs text-muted-foreground">Year {r.cycleYear}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {r.date}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                {r.updatePhotoUrl && <img src={r.updatePhotoUrl} alt="Update" className="h-24 w-24 rounded-lg object-cover" />}
                <div className="space-y-3">
                  <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message to sponsor</div><p className="mt-0.5 text-sm">{r.messageToSponsor || "—"}</p></div>
                  <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Beneficiary update</div><p className="mt-0.5 text-sm">{r.beneficiaryUpdate || "—"}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Leaving
function LeavingTab({
  beneficiaryId,
  canEdit,
  leaving,
  onChange,
}: {
  beneficiaryId: string;
  canEdit: boolean;
  leaving: ReturnType<typeof getLeaving>;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<LeavingReason>("change_of_residence");
  const [explanation, setExplanation] = useState("");

  const submit = () => {
    startLeaving({ beneficiaryId, reason, explanation, date: new Date().toISOString().slice(0, 10), authorUserId: user?.id ?? "u-editor" });
    setOpen(false);
    onChange();
    toast.success("Leaving record started.");
  };

  if (leaving) {
    return (
      <SectionCard title="Leaving Record" icon={<LogOut className="h-4 w-4" />}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border/70 pb-3"><span className="text-muted-foreground">Reason</span><span className="font-medium">{LEAVING_REASON_LABELS[leaving.reason]}</span></div>
          <div className="flex justify-between border-b border-border/70 pb-3"><span className="text-muted-foreground">Date</span><span className="font-medium">{leaving.date}</span></div>
          <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Explanation</div><p className="mt-1">{leaving.explanation || "—"}</p></div>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center">
      <LogOut className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="mb-4 text-sm text-muted-foreground">This beneficiary is still active in the program.</p>
      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="destructive"><LogOut className="mr-1.5 h-4 w-4" /> Start Leaving</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Leaving</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Why is the beneficiary leaving?</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as LeavingReason)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(LEAVING_REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Explanation (optional)</Label><Textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="destructive" onClick={submit}>Confirm Leaving</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
