// Child Labor Project — square image cropper dialog.
// Lets the user pick an image, then pan + zoom to frame it so nothing important
// is cut off. Exports a fixed-size square JPEG data URL (default 512x512).
// No external dependency — pure canvas + pointer events.
import { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, ZoomIn } from "lucide-react";

const VIEW = 320; // on-screen crop viewport (square, px)

export default function ImageCropper({
  trigger,
  title = "Adjust photo",
  outputSize = 512,
  onCropped,
}: {
  trigger: React.ReactNode;
  title?: string;
  outputSize?: number;
  onCropped: (dataUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string>("");
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = () => {
    setSrc(""); setNat(null); setZoom(1); setOff({ x: 0, y: 0 }); drag.current = null;
  };

  const baseScale = nat ? VIEW / Math.min(nat.w, nat.h) : 1;
  const scale = baseScale * zoom;

  const clamp = useCallback(
    (x: number, y: number) => {
      if (!nat) return { x, y };
      const w = nat.w * scale, h = nat.h * scale;
      return {
        x: Math.min(0, Math.max(VIEW - w, x)),
        y: Math.min(0, Math.max(VIEW - h, y)),
      };
    },
    [nat, scale],
  );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setNat({ w: img.naturalWidth, h: img.naturalHeight });
        const bs = VIEW / Math.min(img.naturalWidth, img.naturalHeight);
        // Center the image in the viewport at zoom = 1.
        setOff({
          x: (VIEW - img.naturalWidth * bs) / 2,
          y: (VIEW - img.naturalHeight * bs) / 2,
        });
        setZoom(1);
        setSrc(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOff(clamp(nx, ny));
  };
  const onPointerUp = () => { drag.current = null; };

  const changeZoom = (z: number) => {
    // Zoom around the viewport center to keep framing stable.
    if (!nat) { setZoom(z); return; }
    const cx = VIEW / 2, cy = VIEW / 2;
    const ratio = (baseScale * z) / scale;
    setOff((o) => clampWith(nat, baseScale * z, {
      x: cx - (cx - o.x) * ratio,
      y: cy - (cy - o.y) * ratio,
    }));
    setZoom(z);
  };

  const save = () => {
    if (!src || !nat) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize; canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const sx = -off.x / scale;
      const sy = -off.y / scale;
      const sSize = VIEW / scale;
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
      onCropped(canvas.toDataURL("image/jpeg", 0.85));
      setOpen(false);
      reset();
    };
    img.src = src;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>

        {!src ? (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 py-12 text-muted-foreground hover:border-primary/40">
            <Upload className="h-8 w-8" />
            <span className="text-sm">Click to choose an image</span>
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        ) : (
          <div className="space-y-4">
            <div
              className="relative mx-auto touch-none overflow-hidden rounded-full border bg-muted"
              style={{ width: VIEW, height: VIEW }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {nat && (
                <img
                  src={src}
                  alt="crop"
                  draggable={false}
                  className="pointer-events-none absolute max-w-none select-none"
                  style={{
                    width: nat.w * scale,
                    height: nat.h * scale,
                    left: off.x,
                    top: off.y,
                  }}
                />
              )}
              {/* square guide over the round preview */}
              <div className="pointer-events-none absolute inset-0 ring-2 ring-white/60" />
            </div>

            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => changeZoom(Number(e.target.value))}
                className="w-full accent-[var(--color-brand-green)]"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Drag to reposition · use the slider to zoom
            </p>
          </div>
        )}

        <DialogFooter>
          {src && (
            <>
              <Button variant="outline" className="bg-card" onClick={reset}>Choose another</Button>
              <Button onClick={save}>Save photo</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Clamp helper used by zoom (kept outside to avoid stale closures).
function clampWith(nat: { w: number; h: number }, scale: number, p: { x: number; y: number }) {
  const w = nat.w * scale, h = nat.h * scale;
  return {
    x: Math.min(0, Math.max(VIEW - w, p.x)),
    y: Math.min(0, Math.max(VIEW - h, p.y)),
  };
}
