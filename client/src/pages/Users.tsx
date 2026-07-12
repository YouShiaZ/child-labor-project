// Child Labor Project — Admin-only user management: create Editor/Viewer accounts.
import { useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, Pencil, Eye } from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-primary/10 text-primary ring-primary/20",
  editor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  viewer: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function Users() {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const users = listUsers();

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please enter a full name and email.");
      return;
    }
    createUser({ fullName, email, role, active: true });
    setFullName(""); setEmail(""); setRole("editor"); setPassword("");
    setOpen(false);
    rerender();
    toast.success("User account created.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create accounts and assign access. <span className="font-medium text-foreground">Editors</span> enter and update data; <span className="font-medium text-foreground">Viewers</span> have read-only access.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-1.5 h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add User Account</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Temporary password</Label>
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set an initial password" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor — can enter & edit data</SelectItem>
                    <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={submit}>Create Account</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Active</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium text-primary">
                    <span className="flex items-center gap-2">
                      {u.role === "admin" && <ShieldCheck className="h-4 w-4 text-primary" />}
                      {u.role === "editor" && <Pencil className="h-4 w-4 text-emerald-600" />}
                      {u.role === "viewer" && <Eye className="h-4 w-4 text-slate-500" />}
                      {u.fullName}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", ROLE_BADGE[u.role])}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Switch
                      checked={u.active}
                      disabled={u.role === "admin"}
                      onCheckedChange={(v) => { updateUser(u.id, { active: v }); rerender(); }}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => { deleteUser(u.id); rerender(); toast.success("User removed."); }}
                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
