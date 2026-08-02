// Child Labor Project — connection / sync indicator.
// Shows only when it matters: offline, or there are unsynced changes, or syncing.
import { useEffect, useState } from "react";
import { isOnline, pendingCount, isSyncing, subscribeOffline } from "@/lib/api";
import { SUPABASE_ENABLED } from "@/lib/supabase";
import { WifiOff, RefreshCw, UploadCloud } from "lucide-react";

export default function OfflineStatus() {
  const [, force] = useState(0);

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
  const syncing = isSyncing();

  // All good and nothing pending → show nothing.
  if (online && pending === 0 && !syncing) return null;

  let icon = <WifiOff className="h-3.5 w-3.5" />;
  let label = "Offline";
  let cls = "bg-amber-400/90 text-amber-950";

  if (online && syncing) {
    icon = <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    label = "Syncing…";
    cls = "bg-white/15 text-white";
  } else if (online && pending > 0) {
    icon = <UploadCloud className="h-3.5 w-3.5" />;
    label = `${pending} to sync`;
    cls = "bg-white/15 text-white";
  } else if (!online) {
    label = pending > 0 ? `Offline · ${pending} pending` : "Offline";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
      title={online ? "Changes are being uploaded" : "Working offline — changes save on this device and upload when you're back online"}
    >
      {icon}
      {label}
    </span>
  );
}
