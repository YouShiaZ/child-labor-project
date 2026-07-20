// Child Labor Project — global beneficiaries list across both offices.
// Read-only overview; office/status/approval filters + search.
import { useState } from "react";
import { Link } from "wouter";
import { listBeneficiaries, listOffices, computeAge } from "@/lib/api";
import { StatusPill, HealthPill, ApprovalPill, OfficePill } from "@/components/ui-bits";
import { STATUS_LABELS } from "@/lib/options";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["all", "entry", "priority", "sponsored", "leaving"] as const;

export default function Beneficiaries() {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const offices = listOffices();
  const officeName = (id: string) => offices.find((o) => o.id === id)?.name ?? "—";

  let rows = listBeneficiaries();
  if (officeFilter !== "all") rows = rows.filter((b) => b.officeId === officeFilter);
  if (statusTab !== "all") rows = rows.filter((b) => b.status === statusTab);
  if (query.trim()) {
    const q = query.toLowerCase();
    rows = rows.filter(
      (b) =>
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
        b.beneficiaryNumber.toLowerCase().includes(q),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Beneficiaries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All children supported by the Child Labor Project across both offices.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Office filter */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setOfficeFilter("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                officeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              All offices
            </button>
            {offices.map((o) => (
              <button
                key={o.id}
                onClick={() => setOfficeFilter(o.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  officeFilter === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
                )}
              >
                {o.city}
              </button>
            ))}
          </div>
          {/* Status filter */}
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
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or number" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-full pl-8 sm:w-64" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Office</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Health</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Approval</th>
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
                  <td className="px-5 py-3"><OfficePill name={officeName(b.officeId)} /></td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3"><HealthPill value={b.healthSituation} /></td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-5 py-3"><ApprovalPill status={b.approvalStatus} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No beneficiaries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
