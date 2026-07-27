// Child Labor Project — self-service "change my password" dialog.
// Works in real mode (Supabase Auth); in demo mode it explains it's unavailable.
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { changeOwnPassword, backend } = useAuth();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    const res = await changeOwnPassword(pw);
    setBusy(false);
    if (res.ok) {
      toast.success("Password updated.");
      setPw("");
      setConfirm("");
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "Could not update password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
        {backend === "demo" ? (
          <p className="text-sm text-muted-foreground">
            Password management becomes active once the backend (Supabase) is connected.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          {backend === "supabase" && (
            <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
