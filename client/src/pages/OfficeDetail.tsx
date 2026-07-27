// Child Labor Project — single office record: Overview + Beneficiaries + Annual Reports.
// Editing is gated per office: users who don't own this office see it read-only.
import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  getOffice,
  listBeneficiaries,
  computeAge,
  listOfficeReports,
  createOfficeReport,
  deleteOfficeReport,
  saveDocumentFile,
  downloadFile,
  approveBeneficiary,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StatusPill, HealthPill, ApprovalPill } from "@/components/ui-bits";
import { STATUS_LABELS, GENDER_LABELS, OFFICE_REPORT_TYPE_LABELS } from "@/lib/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Users2,
  Plus,
  Search,
  ChevronLeft,
  Lock,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  HeartHandshake,
  LogOut as LeaveIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OfficeReportFileType } from "@/lib/types";

const STATUS_TABS = ["all", "entry", "priority", "sponsored", "leaving"] as const;
type MainTab = "overview" | "beneficiaries" | "reports";

export default function OfficeDetail() {
  const { officeId = "" } = useParams();
  const { user, canEditOffice, canApprove } = useAuth();
  const [tab, setTab] = useState<MainTab>("overview");
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const office = getOffice(officeId);
  if (!office) {
    return <div className="py-24 text-center text-muted-foreground">Office not found.</div>;
  }

  const editable = canEditOffice(office.id);
  const approver = canApprove(office.id);
  const all = listBeneficiaries(office.id);
  const pending = all.filter((b) => b.approvalStatus === "pending");

  return (
    <div className="space-y-6">
      <Link href="/offices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to offices
      </Link>

      {/* Header band */}
      <div className="overflow-hidden rounded-xl bg-primary text-primary-foreground card-shadow">
        <div className="flex flex-wrap items-center gap-3 px-6 py-5">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/10">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{office.name}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-primary-foreground/80">
              <MapPin className="h-4 w-4" /> {office.governorate} Governorate
            </div>
          </div>
          {!editable && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Lock className="h-3.5 w-3.5" /> Read-only (not your office)
            </span>
          )}
        </div>
        <div className="flex border-t border-white/10">
          {(["overview", "beneficiaries", "reports"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-5 py-3 text-sm font-medium capitalize transition-colors",
                tab === t ? "text-white" : "text-primary-foreground/60 hover:text-white",
              )}
            >
              {t === "reports" ? "Annual Reports" : t}
              {t === "beneficiaries" && pending.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-[11px] font-semibold text-amber-950">
                  {pending.length}
                </span>
              )}
              {tab === t && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-green)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <OverviewTab officeId={office.id} pendingCount={pending.length} />
      )}

      {tab === "beneficiaries" && (
        <BeneficiariesTab
          officeId={office.id}
          editable={editable}
          approver={approver}
          approverId={user?.id ?? ""}
          onChange={rerender}
        />
      )}

      {tab === "reports" && (
        <ReportsTab officeId={office.id} editable={editable} uploaderId={user?.id ?? ""} onChange={rerender} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Overview
function OverviewTab({ officeId, pendingCount }: { officeId: string; pendingCount: number }) {
  const all = listBeneficiaries(officeId);
  const sponsored = all.filter((b) => b.status === "sponsored").length;
  const leaving = all.filter((b) => b.status === "leaving").length;
  const totalSponsorship = all.reduce((s, b) => s + (b.amountSponsored ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users2 className="h-5 w-5 text-[var(--color-brand-green)]" />} label="Beneficiaries" value={all.length} tint="bg-emerald-50" />
        <Kpi icon={<HeartHandshake className="h-5 w-5 text-emerald-600" />} label="Sponsored" value={sponsored} tint="bg-emerald-50" />
        <Kpi icon={<Clock className="h-5 w-5 text-amber-600" />} label="Pending approval" value={pendingCount} tint="bg-amber-50" />
        <Kpi icon={<LeaveIcon className="h-5 w-5 text-rose-600" />} label="Leaving" value={leaving} tint="bg-rose-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 card-shadow lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-primary">Status breakdown</h3>
          <div className="mt-4 space-y-3">
            {(["entry", "priority", "sponsored", "leaving"] as const).map((s) => {
              const n = all.filter((b) => b.status === s).length;
              const pct = all.length ? Math.round((n / all.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{STATUS_LABELS[s]}</span>
                    <span className="font-medium text-foreground">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <h3 className="font-display text-sm font-semibold text-primary">Sponsorship</h3>
          <div className="mt-4">
            <div className="font-display text-2xl font-bold text-primary">
              {totalSponsorship.toLocaleString()} EGP
            </div>
            <div className="text-xs text-muted-foreground">Total annual amount sponsored by the project</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 card-shadow">
      <span className={`grid h-11 w-11 place-items-center rounded-lg ${tint}`}>{icon}</span>
      <div>
        <div className="font-display text-2xl font-bold text-primary">{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Beneficiaries
function BeneficiariesTab({
  officeId,
  editable,
  approver,
  approverId,
  onChange,
}: {
  officeId: string;
  editable: boolean;
  approver: boolean;
  approverId: string;
  onChange: () => void;
}) {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [query, setQuery] = useState("");

  let rows = listBeneficiaries(officeId);
  if (statusTab !== "all") rows = rows.filter((b) => b.status === statusTab);
  if (query.trim()) {
    const q = query.toLowerCase();
    rows = rows.filter(
      (b) =>
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
        b.beneficiaryNumber.toLowerCase().includes(q),
    );
  }

  const approve = (id: string) => {
    approveBeneficiary(id, approverId);
    onChange();
    toast.success("Beneficiary approved.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                statusTab === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or number" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-56 pl-8" />
          </div>
          {editable && (
            <Link href={`/offices/${officeId}/new-beneficiary`}>
              <Button className="h-9"><Plus className="mr-1.5 h-4 w-4" /> New Entry</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Village</th>
                <th className="px-5 py-3 font-medium">Health</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Approval</th>
                {approver && <th className="px-5 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/beneficiaries/${b.id}`} className="font-medium text-primary hover:underline">
                      {b.firstName} {b.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{b.beneficiaryNumber}</td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3">{b.village}</td>
                  <td className="px-5 py-3"><HealthPill value={b.healthSituation} /></td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-5 py-3"><ApprovalPill status={b.approvalStatus} /></td>
                  {approver && (
                    <td className="px-5 py-3 text-right">
                      {b.approvalStatus === "pending" && (
                        <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => approve(b.id)}>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={approver ? 8 : 7} className="px-5 py-10 text-center text-muted-foreground">
                    No beneficiaries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Annual reports
function ReportsTab({
  officeId,
  editable,
  uploaderId,
  onChange,
}: {
  officeId: string;
  editable: boolean;
  uploaderId: string;
  onChange: () => void;
}) {
  const reports = listOfficeReports(officeId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);

  const detectType = (f: File): OfficeReportFileType | null => {
    const n = f.name.toLowerCase();
    if (f.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
    if (n.endsWith(".doc") || n.endsWith(".docx") || f.type.includes("word") || f.type.includes("officedocument.wordprocessing"))
      return "word";
    return null;
  };

  const submit = async () => {
    if (!title.trim()) return toast.error("Please enter a report title.");
    if (!file) return toast.error("Please choose a Word or PDF file.");
    const fileType = detectType(file);
    if (!fileType) return toast.error("Only Word (.doc/.docx) or PDF files are allowed.");
    if (file.size > 25 * 1024 * 1024)
      return toast.error("File is too large (max 25 MB).");
    try {
      const fileUrl = await saveDocumentFile(file, officeId);
      createOfficeReport({
        officeId,
        year: Number(year) || new Date().getFullYear(),
        title: title.trim(),
        fileName: file.name,
        fileType,
        fileUrl,
        uploadedByUserId: uploaderId,
      });
      setTitle("");
      setFile(null);
      setOpen(false);
      onChange();
      toast.success("Annual report uploaded.");
    } catch {
      toast.error("Could not read that file.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-primary">Comprehensive Annual Reports</h3>
          <p className="text-sm text-muted-foreground">
            Office-wide yearly report covering all beneficiaries (Word / PDF). Everyone can download.
          </p>
        </div>
        {editable && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="mr-1.5 h-4 w-4" /> Upload Report</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Comprehensive Annual Report</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cairo Office — Annual Report 2025" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-40" />
                </div>
                <div className="space-y-2">
                  <Label>File (Word or PDF)</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-muted/40">
                    <Upload className="h-4 w-4" /> {file ? file.name : "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8" />
          No annual reports uploaded yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-shadow">
              <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", r.fileType === "pdf" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600")}>
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.year} · {OFFICE_REPORT_TYPE_LABELS[r.fileType]} · {r.fileName}
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => downloadFile(r.fileUrl, r.fileName)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              {editable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-rose-600 hover:text-rose-700"
                  onClick={() => {
                    deleteOfficeReport(r.id);
                    onChange();
                    toast.success("Report removed.");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
