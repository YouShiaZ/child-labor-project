// Child Labor Project — approval queue for office admins & super admin.
// Two sections: new beneficiary ENTRIES awaiting approval, and CHANGE REQUESTS
// (edits / leaving / reports / cards) submitted by editors.
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  listBeneficiaries,
  listPendingChangeRequests,
  approveBeneficiary,
  approveChangeRequest,
  rejectChangeRequest,
  getOffice,
  getUser,
  computeAge,
} from "@/lib/api";
import { OfficePill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, X, UserPlus, Pencil, LogOut, FileText, Image as ImageIcon, ClipboardCheck } from "lucide-react";

const KIND_ICON: Record<string, React.ReactNode> = {
  update: <Pencil className="h-4 w-4" />,
  leave: <LogOut className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
  card_add: <ImageIcon className="h-4 w-4" />,
  card_remove: <ImageIcon className="h-4 w-4" />,
};

export default function Approvals() {
  const { user, isSuperAdmin } = useAuth();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const mine = (officeId: string) => isSuperAdmin || officeId === user?.officeId;
  const pendingEntries = listBeneficiaries().filter((b) => b.approvalStatus === "pending" && mine(b.officeId));
  const pendingChanges = listPendingChangeRequests().filter((c) => mine(c.officeId));

  const officeName = (id: string) => getOffice(id)?.name ?? "—";
  const total = pendingEntries.length + pendingChanges.length;

  const approveEntry = (id: string) => { approveBeneficiary(id, user?.id ?? ""); rerender(); toast.success("Beneficiary approved."); };
  const approveChange = (id: string) => { approveChangeRequest(id, user?.id ?? ""); rerender(); toast.success("Change approved and applied."); };
  const rejectChange = (id: string) => { rejectChangeRequest(id, user?.id ?? ""); rerender(); toast.success("Change rejected."); };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve what editors submit. Nothing takes effect until you approve it.
          {total > 0 && <span className="ml-1 font-medium text-amber-600">{total} item(s) waiting.</span>}
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          <ClipboardCheck className="mx-auto mb-2 h-8 w-8" />
          Nothing waiting for approval. You're all caught up.
        </div>
      )}

      {/* New entries */}
      {pendingEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
            <UserPlus className="h-4 w-4" /> New beneficiary entries ({pendingEntries.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
            <table className="w-full text-sm">
              <tbody>
                {pendingEntries.map((b) => (
                  <tr key={b.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/beneficiaries/${b.id}`} className="font-medium text-primary hover:underline">
                        {b.firstName} {b.lastName}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{b.beneficiaryNumber} · {computeAge(b.dateOfBirth)} yrs</span>
                    </td>
                    <td className="px-5 py-3">{isSuperAdmin && <OfficePill name={officeName(b.officeId)} />}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      by {getUser(b.submittedByUserId ?? "")?.fullName ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" onClick={() => approveEntry(b.id)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Change requests */}
      {pendingChanges.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
            <Pencil className="h-4 w-4" /> Change requests ({pendingChanges.length})
          </h2>
          <div className="space-y-2">
            {pendingChanges.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 card-shadow">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {KIND_ICON[c.kind] ?? <Pencil className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{c.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    by {c.requestedByName}
                    {isSuperAdmin ? ` · ${officeName(c.officeId)}` : ""} · {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="bg-card" onClick={() => rejectChange(c.id)}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => approveChange(c.id)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
