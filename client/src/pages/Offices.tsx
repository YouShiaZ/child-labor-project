// Child Labor Project — Offices list (Cairo + Minya). Each card opens that
// office's dashboard. The user's own office is highlighted.
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { listOffices, listBeneficiaries } from "@/lib/api";
import { Building2, ChevronRight, MapPin, Users2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Offices() {
  const { user } = useAuth();
  const offices = listOffices();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Offices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The program is delivered across two governorate offices. Open an office to
          manage its beneficiaries and reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {offices.map((o) => {
          const all = listBeneficiaries(o.id);
          const sponsored = all.filter((b) => b.status === "sponsored").length;
          const pending = all.filter((b) => b.approvalStatus === "pending").length;
          const mine = user?.officeId === o.id;
          return (
            <Link
              key={o.id}
              href={`/offices/${o.id}`}
              className={cn(
                "group flex flex-col rounded-xl border bg-card p-5 card-shadow transition-shadow hover:card-shadow-lg",
                mine ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </span>
                <div className="flex items-center gap-2">
                  {mine && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <ShieldCheck className="h-3 w-3" /> Your office
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-primary">{o.name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {o.governorate} Governorate
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                <Stat label="Beneficiaries" value={all.length} icon={<Users2 className="h-3.5 w-3.5" />} />
                <Stat label="Sponsored" value={sponsored} />
                <Stat label="Pending" value={pending} tint={pending ? "text-amber-600" : undefined} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tint?: string;
}) {
  return (
    <div>
      <div className={cn("flex items-center justify-center gap-1 font-display text-xl font-bold text-primary", tint)}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
