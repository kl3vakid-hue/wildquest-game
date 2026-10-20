import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";

const EMOJIS = ["🦁", "🐘", "🦒", "🦓", "🦏", "🐆", "🦛", "🐃", "🦅", "🐊", "🦉", "🐒"];

async function cropToDataUrl(src: string, area: Area, size = 256): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function AvatarView({ value, className = "size-24" }: { value?: string | null | undefined; className?: string }) {
  const small = !className.includes("size-24");
  if (value?.startsWith("emoji:")) {
    return (
      <div
        className={`${className} grid shrink-0 place-items-center rounded-full border-2 border-primary bg-secondary ${small ? "text-base" : "text-5xl"}`}
      >
        {value.slice(6)}
      </div>
    );
  }
  if (value) {
    return (
      <img src={value} alt="" className={`${className} shrink-0 rounded-full border-2 border-primary object-cover`} />
    );
  }
  return (
    <div className={`${className} grid shrink-0 place-items-center rounded-full border-2 border-border bg-secondary text-muted-foreground`}>
      <User className={small ? "size-4" : "size-10"} />
    </div>
  );
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  return (
    <div className="flex flex-col items-center gap-4">
      <AvatarView value={value} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-foreground"
        >
          <Camera className="size-4" /> Photo
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
          >
            <Trash2 className="size-4" /> Remove
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setSource(reader.result as string);
          };
          reader.onerror = () => toast.error("Couldn't read that photo");
          reader.readAsDataURL(file);
        }}
      />
      <div className="grid grid-cols-6 gap-2">
        {EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => onChange(`emoji:${em}`)}
            className={`grid size-11 place-items-center rounded-full border text-2xl ${
              value === `emoji:${em}` ? "border-primary bg-primary/20" : "border-border bg-secondary"
            }`}
          >
            {em}
          </button>
        ))}
      </div>

      {source ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="relative flex-1">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          </div>
          <div className="space-y-4 p-5 pb-safe">
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Zoom"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSource(null)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm"
              >
                <X className="size-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!area) return;
                  try {
                    onChange(await cropToDataUrl(source, area));
                    setSource(null);
                  } catch {
                    toast.error("Couldn't crop that photo");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                <Check className="size-4" /> Use Photo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
