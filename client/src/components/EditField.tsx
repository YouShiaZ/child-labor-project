// Inline-editable field row (Salesforce-style pencil edit), role-gated to editors/admins.
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BaseProps {
  label: string;
  value: string;
  display?: React.ReactNode;
  onSave: (value: string) => void;
}

interface TextProps extends BaseProps {
  type?: "text" | "date";
}
interface SelectProps extends BaseProps {
  options: { value: string; label: string }[];
}

export function EditTextField({ label, value, display, onSave, type = "text" }: TextProps) {
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="group flex flex-col gap-1 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-56 sm:shrink-0">
        {label}
      </div>
      <div className="flex flex-1 items-center gap-2 text-sm text-foreground">
        {editing ? (
          <>
            <Input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 max-w-xs"
              autoFocus
            />
            <button onClick={() => { onSave(draft); setEditing(false); }} className="text-emerald-600">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setDraft(value); setEditing(false); }} className="text-rose-500">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span>{display ?? (value || <span className="text-muted-foreground">—</span>)}</span>
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function EditSelectField({ label, value, display, onSave, options }: SelectProps) {
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState(false);

  return (
    <div className="group flex flex-col gap-1 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-56 sm:shrink-0">
        {label}
      </div>
      <div className="flex flex-1 items-center gap-2 text-sm text-foreground">
        {editing ? (
          <Select
            defaultValue={value}
            onValueChange={(v) => { onSave(v); setEditing(false); }}
          >
            <SelectTrigger className="h-8 max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <span>{display ?? (value || <span className="text-muted-foreground">—</span>)}</span>
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
