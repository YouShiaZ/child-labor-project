// Child Labor Project — connection / sync indicator (click to open the Sync panel).
import { useEffect, useState } from "react";
import { isOnline, pendingCount, failedCount, isSyncing, subscribeOffline } from "@/lib/api";
import { SUPABASE_ENABLED } from "@/lib/supabase";
import { WifiOff, RefreshCw, UploadCloud, Check, AlertTriangle } from "lucide-react";
import SyncPanel from "./SyncPanel";

export default function OfflineStatus() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    const unsub = subscribeOffline(rerender);
    window.addEventListener("online", rerender);
    window.addEventListener("offline", rerender);
    return () => {
      unsub();
      window.removeEventListener("online", rerender);
      window.removeEventListener("offline", rerender);
    };
  }, []);

  if (!SUPABASE_ENABLED) return null;

  const online = isOnline();
  const pending = pendingCount();
  const failed = failedCount();
  const syncing = isSyncing();

  let icon = <Check className="h-3.5 w-3.5" />;
  let label = "Synced";
  let cls = "bg-white/10 text-primary-foreground/80 hover:bg-white/20";

  if (!online) {
    icon = <WifiOff className="h-3.5 w-3.5" />;
    label = pending > 0 ? `Offline · ${pending}` : "Offline";
    cls = "bg-amber-400/90 text-amber-950 hover:bg-amber-400";
  } else if (failed > 0) {
    icon = <AlertTriangle className="h-3.5 w-3.5" />;
    label = `${failed} failed`;
    cls = "bg-rose-500/90 text-white hover:bg-rose-500";
  } else if (syncing) {
    icon = <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    label = "Syncing…";
    cls = "bg-white/15 text-white hover:bg-white/25";
  } else if (pending > 0) {
    icon = <UploadCloud className="h-3.5 w-3.5" />;
    label = `${pending} to sync`;
    cls = "bg-white/15 text-white hover:bg-white/25";
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${cls}`}
        title="Open sync panel"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
      <SyncPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
