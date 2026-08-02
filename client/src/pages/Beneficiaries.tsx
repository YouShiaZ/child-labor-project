// Child Labor Project — global beneficiaries list across both offices.
// Rich filtering + sorting. Default order: newest entry first.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { listBeneficiaries, listOffices, computeAge } from "@/lib/api";
import { StatusPill, HealthPill, ApprovalPill, OfficePill } from "@/components/ui-bits";
import { STATUS_LABELS } from "@/lib/options";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["all", "entry", "priority", "sponsored", "leaving"] as const;
type SortKey = "newest" | "oldest" | "youngest" | "oldest_age";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest entry",
  oldest: "Oldest entry",
  youngest: "Youngest child",
  oldest_age: "Oldest child",
};

export default function Beneficiaries() {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [village, setVillage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");

  const offices = listOffices();
  const officeName = (id: string) => offices.find((o) => o.id === id)?.name ?? "—";
  const all = listBeneficiaries();

  // Unique villages for the village filter.
  const villages = useMemo(
    () => Array.from(new Set(all.map((b) => b.village).filter(Boolean))).sort(),
    [all],
  );

  const rows = useMemo(() => {
    let r = all;
    if (officeFilter !== "all") r = r.filter((b) => b.officeId === officeFilter);
    if (statusTab !== "all") r = r.filter((b) => b.status === statusTab);
    if (gender !== "all") r = r.filter((b) => b.gender === gender);
    if (village !== "all") r = r.filter((b) => b.village === village);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (b) =>
          `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
          b.beneficiaryNumber.toLowerCase().includes(q) ||
          (b.village ?? "").toLowerCase().includes(q),
      );
    }
    const byDate = (a: typeof r[number], b: typeof r[number]) =>
      a.createdAt === b.createdAt
        ? b.beneficiaryNumber.localeCompare(a.beneficiaryNumber)
        : a.createdAt < b.createdAt ? 1 : -1; // newest first
    const age = (b: typeof r[number]) => computeAge(b.dateOfBirth) ?? -1;
    const sorted = [...r].sort((a, b) => {
      switch (sortBy) {
        case "newest": return byDate(a, b);
        case "oldest": return -byDate(a, b);
        case "youngest": return age(a) - age(b);
        case "oldest_age": return age(b) - age(a);
      }
    });
    return sorted;
  }, [all, officeFilter, statusTab, gender, village, query, sortBy]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Beneficiaries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All children supported by the Child Labor Project across both offices.
        </p>
      </div>

      {/* Office + status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setOfficeFilter("all")}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", officeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
          >
            All offices
          </button>
          {offices.map((o) => (
            <button
              key={o.id}
              onClick={() => setOfficeFilter(o.id)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", officeFilter === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
            >
              {o.city}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors", statusTab === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Gender + village + sort + search */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={village} onValueChange={setVillage}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Village" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All villages</SelectItem>
            {villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, number or village" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-full pl-8 sm:w-72" />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">{rows.length} result(s)</div>

      <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Office</th>
                <th className="px-5 py-3 font-medium">Village</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Age</th>
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
                  <td className="px-5 py-3 font-medium text-muted-foreground">{b.beneficiaryNumber}</td>
                  <td className="px-5 py-3"><OfficePill name={officeName(b.officeId)} /></td>
                  <td className="px-5 py-3">{b.village}</td>
                  <td className="px-5 py-3 capitalize">{b.gender}</td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-5 py-3"><ApprovalPill status={b.approvalStatus} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No beneficiaries match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
