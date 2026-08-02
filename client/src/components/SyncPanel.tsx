// Child Labor Project — sync panel.
// Opened from the connection indicator. Shows what's waiting to upload, lets the
// user sync now, and surfaces anything that permanently failed (with retry/discard).
import { useEffect, useState } from "react";
import {
  isOnline, pendingCount, failedCount, isSyncing, reauthNeeded,
  getPending, getFailed, requeueFailed, discardFailed, flushOutbox, subscribeOffline,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, UploadCloud, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";

export default function SyncPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [, force] = useState(0);
  useEffect(() => subscribeOffline(() => force((n) => n + 1)), []);

  const online = isOnline();
  const pending = getPending();
  const failed = getFailed();
  const syncing = isSyncing();

  const syncNow = async () => {
    if (!online) return toast.error("You're offline — connect to sync.");
    await flushOutbox();
    if (failedCount() > 0) toast.warning("Some items need attention below.");
    else if (pendingCount() === 0) toast.success("Everything is synced.");
  };

  const retryFailed = async () => {
    await requeueFailed();
    await flushOutbox();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" /> Sync
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span>
              {online ? "Connected" : "Offline"} ·{" "}
              <span className="font-medium">{pending.length}</span> waiting
              {failed.length > 0 && <span className="text-rose-600"> · {failed.length} failed</span>}
            </span>
            <Button size="sm" onClick={syncNow} disabled={!online || syncing || pending.length === 0}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>

          {reauthNeeded() && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Your session expired while offline. Please sign out and sign in again to finish syncing.
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waiting to upload</h4>
              <ul className="space-y-1">
                {pending.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/40">
                    <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1">{p.summary}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.at).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed */}
          {failed.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-600">Needs attention</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 bg-card" onClick={retryFailed}>Retry all</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-rose-600" onClick={() => discardFailed()}>Discard all</Button>
                </div>
              </div>
              <ul className="space-y-1">
                {failed.map((f) => (
                  <li key={f.id} className="rounded-md border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span className="flex-1 font-medium">{f.summary}</span>
                      <button onClick={() => discardFailed(f.id)} className="text-rose-500 hover:text-rose-700" title="Discard">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {f.error && <div className="mt-1 pl-5 text-xs text-rose-500">{f.error}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pending.length === 0 && failed.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <span className="text-sm">Everything is synced.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
