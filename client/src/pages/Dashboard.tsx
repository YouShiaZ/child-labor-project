// Child Labor Project — Dashboard: summary stats + recent beneficiaries.
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { listBeneficiaries, listAllReports, getCurrentProject, computeAge } from "@/lib/api";
import { StatusPill } from "@/components/ui-bits";
import { GENDER_LABELS } from "@/lib/options";
import { Users2, FileText, HeartHandshake, LogOut as LeaveIcon, MapPin } from "lucide-react";

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
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
  const beneficiaries = listBeneficiaries();
  const project = getCurrentProject();
  const reports = listAllReports();
  const sponsored = beneficiaries.filter((b) => b.status === "sponsored").length;
  const leaving = beneficiaries.filter((b) => b.status === "leaving").length;
  const recent = [...beneficiaries].slice(-5).reverse();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Link href="/project" className="font-medium text-primary hover:underline">
            {project?.projectName}
          </Link>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {project?.countryName}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={<Users2 className="h-6 w-6 text-[var(--color-brand-green)]" />}
          label="Beneficiaries"
          value={beneficiaries.length}
          tint="bg-emerald-50"
        />
        <Stat
          icon={<HeartHandshake className="h-6 w-6 text-emerald-600" />}
          label="Sponsored"
          value={sponsored}
          tint="bg-emerald-50"
        />
        <Stat
          icon={<FileText className="h-6 w-6 text-primary" />}
          label="Progress Reports"
          value={reports.length}
          tint="bg-primary/10"
        />
        <Stat
          icon={<LeaveIcon className="h-6 w-6 text-rose-600" />}
          label="Leaving"
          value={leaving}
          tint="bg-rose-50"
        />
      </div>

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
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
                  <td className="px-5 py-3">{GENDER_LABELS[b.gender]}</td>
                  <td className="px-5 py-3">{computeAge(b.dateOfBirth)}</td>
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
