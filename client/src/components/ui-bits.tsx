// Child Labor Project — small shared presentational helpers.
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { STATUS_LABELS, HEALTH_LABELS } from "@/lib/options";

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    entry: "bg-blue-50 text-blue-700 ring-blue-600/20",
    priority: "bg-amber-50 text-amber-700 ring-amber-600/20",
    sponsored: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    leaving: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[status] ?? "bg-slate-100 text-slate-700 ring-slate-600/20",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function HealthPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    average: "bg-amber-50 text-amber-700 ring-amber-600/20",
    poor: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[value] ?? "bg-slate-100 text-slate-700 ring-slate-600/20",
      )}
    >
      {HEALTH_LABELS[value] ?? value}
    </span>
  );
}

export function ApprovalPill({ status }: { status: string }) {
  const approved = status === "approved";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        approved
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-amber-50 text-amber-700 ring-amber-600/20",
      )}
    >
      {approved ? "Approved" : "Pending approval"}
    </span>
  );
}

export function OfficePill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {name}
    </span>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-56 sm:shrink-0">
        {label}
      </div>
      <div className="text-sm text-foreground">{children || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card card-shadow">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
