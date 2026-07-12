// Child Labor Project — global Beneficiaries list with status sub-tabs + search.
import { useState } from "react";
import { Link } from "wouter";
import { listBeneficiaries, computeAge } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StatusPill, HealthPill } from "@/components/ui-bits";
import { GENDER_LABELS, STATUS_LABELS } from "@/lib/options";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["all", "entry", "priority", "sponsored", "leaving"] as const;

export default function Beneficiaries() {
  const { canEdit } = useAuth();
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [query, setQuery] = useState("");

  let rows = listBeneficiaries();
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Beneficiaries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All children supported by the Child Labor Project.
          </p>
        </div>
        {canEdit && (
          <Link href="/project/new-beneficiary">
            <Button><Plus className="mr-1.5 h-4 w-4" /> New Entry</Button>
          </Link>
        )}
      </div>

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
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full pl-8 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Village</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Health</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
                  <td className="px-5 py-3">{b.village}</td>
                  <td className="px-5 py-3">{GENDER_LABELS[b.gender]}</td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3"><HealthPill value={b.healthSituation} /></td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
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
