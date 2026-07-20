// Child Labor Project — cross-office analytics & monitoring.
// Read-only for everyone (including viewers/sponsors).
import { useMemo } from "react";
import {
  listOffices,
  listBeneficiaries,
  listAllReports,
  computeAge,
} from "@/lib/api";
import { STATUS_LABELS, HEALTH_LABELS } from "@/lib/options";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users2, HeartHandshake, FileText, Coins } from "lucide-react";

const NAVY = "#1B3A6B";
const GREEN = "#3AAA35";
const STATUS_COLORS: Record<string, string> = {
  entry: "#2C5A9E",
  priority: "#D97706",
  sponsored: "#3AAA35",
  leaving: "#DC2626",
};
const HEALTH_COLORS: Record<string, string> = {
  good: "#3AAA35",
  average: "#D97706",
  poor: "#DC2626",
};

export default function Analytics() {
  const offices = listOffices();
  const all = listBeneficiaries();
  const reports = listAllReports();

  const totalSponsorship = all.reduce((s, b) => s + (b.amountSponsored ?? 0), 0);
  const totalTuition = all.reduce((s, b) => s + (b.tuitionFees ?? 0), 0);
  const ages = all.map((b) => computeAge(b.dateOfBirth)).filter((a): a is number => a !== null);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  const byOffice = useMemo(
    () =>
      offices.map((o) => {
        const rows = all.filter((b) => b.officeId === o.id);
        return {
          name: o.city,
          Beneficiaries: rows.length,
          Sponsored: rows.filter((b) => b.status === "sponsored").length,
          Sponsorship: rows.reduce((s, b) => s + (b.amountSponsored ?? 0), 0),
        };
      }),
    [offices, all],
  );

  const byStatus = useMemo(
    () =>
      (["entry", "priority", "sponsored", "leaving"] as const).map((s) => ({
        name: STATUS_LABELS[s],
        key: s,
        value: all.filter((b) => b.status === s).length,
      })),
    [all],
  );

  const byHealth = useMemo(
    () =>
      (["good", "average", "poor"] as const).map((h) => ({
        name: HEALTH_LABELS[h],
        key: h,
        value: all.filter((b) => b.healthSituation === h).length,
      })),
    [all],
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Analytics &amp; Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Program-wide overview across all offices. Track progress, sponsorship and child status.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users2 className="h-5 w-5 text-[var(--color-brand-green)]" />} label="Total beneficiaries" value={all.length} tint="bg-emerald-50" />
        <Kpi icon={<HeartHandshake className="h-5 w-5 text-emerald-600" />} label="Sponsored" value={all.filter((b) => b.status === "sponsored").length} tint="bg-emerald-50" />
        <Kpi icon={<FileText className="h-5 w-5 text-primary" />} label="Progress reports" value={reports.length} tint="bg-primary/10" />
        <Kpi icon={<Coins className="h-5 w-5 text-amber-600" />} label="Avg age (yrs)" value={avgAge} tint="bg-amber-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Beneficiaries by office">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byOffice} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Beneficiaries" fill={NAVY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sponsored" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Status distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byStatus.map((d) => (
                  <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Health situation">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byHealth} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byHealth.map((d) => (
                  <Cell key={d.key} fill={HEALTH_COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Annual sponsorship by office (EGP)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byOffice} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} EGP`} />
              <Bar dataKey="Sponsorship" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total annual sponsorship</div>
          <div className="mt-1 font-display text-2xl font-bold text-primary">{totalSponsorship.toLocaleString()} EGP</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total annual tuition</div>
          <div className="mt-1 font-display text-2xl font-bold text-primary">{totalTuition.toLocaleString()} EGP</div>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-shadow">
      <h3 className="mb-3 font-display text-sm font-semibold text-primary">{title}</h3>
      {children}
    </div>
  );
}
