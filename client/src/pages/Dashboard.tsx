// Child Labor Project — global dashboard across both offices.
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { listBeneficiaries, listOffices, listAllReports, computeAge } from "@/lib/api";
import { StatusPill, ApprovalPill, OfficePill } from "@/components/ui-bits";
import { Users2, Building2, HeartHandshake, Clock, ArrowRight } from "lucide-react";

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 card-shadow">
      <span className={`grid h-12 w-12 place-items-center rounded-lg ${tint}`}>{icon}</span>
      <div>
        <div className="font-display text-2xl font-bold text-primary">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const offices = listOffices();
  const beneficiaries = listBeneficiaries();
  const reports = listAllReports();
  const sponsored = beneficiaries.filter((b) => b.status === "sponsored").length;
  const pending = beneficiaries.filter((b) => b.approvalStatus === "pending").length;
  const officeName = (id: string) => offices.find((o) => o.id === id)?.name ?? "—";
  const recent = [...beneficiaries].slice(-6).reverse();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Child Labor Project — program overview across Cairo and Minya offices.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Building2 className="h-6 w-6 text-primary" />} label="Offices" value={offices.length} tint="bg-primary/10" />
        <Stat icon={<Users2 className="h-6 w-6 text-[var(--color-brand-green)]" />} label="Beneficiaries" value={beneficiaries.length} tint="bg-emerald-50" />
        <Stat icon={<HeartHandshake className="h-6 w-6 text-emerald-600" />} label="Sponsored" value={sponsored} tint="bg-emerald-50" />
        <Stat icon={<Clock className="h-6 w-6 text-amber-600" />} label="Pending approval" value={pending} tint="bg-amber-50" />
      </div>

      {/* Office cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {offices.map((o) => {
          const rows = listBeneficiaries(o.id);
          const p = rows.filter((b) => b.approvalStatus === "pending").length;
          const mine = user?.officeId === o.id;
          return (
            <Link
              key={o.id}
              href={`/offices/${o.id}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 card-shadow transition-shadow hover:card-shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-primary">{o.name}</span>
                    {mine && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Your office</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rows.length} beneficiaries{p ? ` · ${p} pending` : ""}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>

      {/* Recent */}
      <div className="rounded-xl border border-border bg-card card-shadow">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold text-primary">Recent beneficiaries</h2>
          <Link href="/beneficiaries" className="text-sm font-medium text-[var(--color-brand-green)] hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Office</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Approval</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/beneficiaries/${b.id}`} className="font-medium text-primary hover:underline">
                      {b.firstName} {b.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{b.beneficiaryNumber}</td>
                  <td className="px-5 py-3"><OfficePill name={officeName(b.officeId)} /></td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-5 py-3"><ApprovalPill status={b.approvalStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
