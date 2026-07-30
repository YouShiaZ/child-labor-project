// Child Labor Project — recent activity feed (audit trail: who did what).
// Shown to managers (super admin sees all offices; office admin sees their own).
import { useEffect, useState } from "react";
import { fetchRecentActivity, getOffice, SUPABASE_ENABLED } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ActivityRow } from "@/lib/db";
import { Activity, Plus, Pencil, CheckCircle2, Trash2, LogOut, FileText, Image as ImageIcon } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-3.5 w-3.5" />,
  update: <Pencil className="h-3.5 w-3.5" />,
  approve: <CheckCircle2 className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
  leave: <LogOut className="h-3.5 w-3.5" />,
};
const TINT: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-600",
  update: "bg-blue-50 text-blue-600",
  approve: "bg-emerald-50 text-emerald-600",
  delete: "bg-rose-50 text-rose-600",
  leave: "bg-amber-50 text-amber-600",
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ActivityFeed() {
  const { user, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRecentActivity(60).then((r) => {
      if (active) {
        setRows(r as ActivityRow[]);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  // Office admins only see their office (or office-less) entries.
  const visible = isSuperAdmin
    ? rows
    : rows.filter((r) => !r.officeId || r.officeId === user?.officeId);

  const entityIcon = (r: ActivityRow) =>
    r.entity === "report" || r.entity === "office_report" ? <FileText className="h-3.5 w-3.5" />
    : r.entity === "card" ? <ImageIcon className="h-3.5 w-3.5" />
    : ICONS[r.action] ?? <Activity className="h-3.5 w-3.5" />;

  return (
    <div className="rounded-xl border border-border bg-card card-shadow">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-semibold text-primary">Recent activity</h2>
      </div>
      <div className="max-h-[420px] overflow-y-auto px-2 py-2">
        {!SUPABASE_ENABLED ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Activity tracking is active once the backend is connected.
          </p>
        ) : loading ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {visible.map((r) => (
              <li key={r.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/40">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${TINT[r.action] ?? "bg-slate-100 text-slate-600"}`}>
                  {entityIcon(r)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{r.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{r.actorName}</span>
                    {r.officeId ? ` · ${getOffice(r.officeId)?.city ?? ""}` : ""} · {timeAgo(r.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
