// Child Labor Project — the single Project record page: Details + Beneficiaries tabs.
import { useState } from "react";
import { Link } from "wouter";
import {
  getCurrentProject,
  listBeneficiaries,
  updateProject,
  computeAge,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EditTextField } from "@/components/EditField";
import { SectionCard, StatusPill, HealthPill } from "@/components/ui-bits";
import { GENDER_LABELS, STATUS_LABELS } from "@/lib/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Info,
  Users2,
  MapPin,
  Plus,
  Search,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["all", "entry", "priority", "sponsored", "leaving"] as const;

export default function ProjectDetail() {
  const { canEdit } = useAuth();
  const [tab, setTab] = useState<"details" | "beneficiaries">("details");
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [query, setQuery] = useState("");
  const [, force] = useState(0);

  const project = getCurrentProject();
  if (!project) {
    return (
      <div className="py-24 text-center text-muted-foreground">Project not found.</div>
    );
  }

  let beneficiaries = listBeneficiaries(project.id);
  if (statusTab !== "all") beneficiaries = beneficiaries.filter((b) => b.status === statusTab);
  if (query.trim()) {
    const q = query.toLowerCase();
    beneficiaries = beneficiaries.filter(
      (b) =>
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
        b.beneficiaryNumber.toLowerCase().includes(q),
    );
  }

  const save = (patch: Record<string, string>) => {
    updateProject(project.id, patch);
    force((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header band */}
      <div className="overflow-hidden rounded-xl bg-primary text-primary-foreground card-shadow">
        <div className="px-6 py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-primary-foreground/60">Project</div>
          <h1 className="font-display text-2xl font-bold">{project.projectName}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/80">
            <MapPin className="h-4 w-4" /> {project.countryName}
          </div>
        </div>
        <div className="flex border-t border-white/10">
          {(["details", "beneficiaries"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-6 py-3 text-sm font-medium capitalize transition-colors",
                tab === t ? "text-white" : "text-primary-foreground/60 hover:text-white",
              )}
            >
              {t === "details" ? "Project Details" : "Beneficiaries"}
              {tab === t && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-green)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard title="General Project Information" icon={<Info className="h-4 w-4" />}>
              <EditTextField label="Project Name" value={project.projectName} onSave={(v) => save({ projectName: v })} />
              <EditTextField label="Country Name" value={project.countryName} onSave={(v) => save({ countryName: v })} />
              <EditTextField label="Responsible Project Manager" value={project.responsibleProjectManager} onSave={(v) => save({ responsibleProjectManager: v })} />
              <EditTextField label="Responsible Sponsorship Officer IO" value={project.responsibleSponsorshipOfficerIO} onSave={(v) => save({ responsibleSponsorshipOfficerIO: v })} />
              <EditTextField label="Responsible Country Director" value={project.responsibleCountryDirector} onSave={(v) => save({ responsibleCountryDirector: v })} />
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Beneficiary Count" icon={<Users2 className="h-4 w-4" />}>
              <div className="space-y-3">
                {(["entry", "priority", "sponsored", "leaving"] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{STATUS_LABELS[s]}</span>
                    <span className="font-semibold text-primary">
                      {listBeneficiaries(project.id).filter((b) => b.status === s).length}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-[var(--color-brand-green)]">
                    {listBeneficiaries(project.id).length}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "beneficiaries" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusTab(s)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    statusTab === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or number"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-56 pl-8"
                />
              </div>
              {canEdit && (
                <Link href="/project/new-beneficiary">
                  <Button className="h-9">
                    <Plus className="mr-1.5 h-4 w-4" /> New Entry
                  </Button>
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
                    <th className="px-5 py-3 font-medium">Gender</th>
                    <th className="px-5 py-3 font-medium">Age</th>
                    <th className="px-5 py-3 font-medium">Village</th>
                    <th className="px-5 py-3 font-medium">Health</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((b) => (
                    <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link href={`/beneficiaries/${b.id}`} className="font-medium text-primary hover:underline">
                          {b.firstName} {b.lastName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{b.beneficiaryNumber}</td>
                      <td className="px-5 py-3">{GENDER_LABELS[b.gender]}</td>
                      <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                      <td className="px-5 py-3">{b.village}</td>
                      <td className="px-5 py-3"><HealthPill value={b.healthSituation} /></td>
                      <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                    </tr>
                  ))}
                  {beneficiaries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        No beneficiaries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
