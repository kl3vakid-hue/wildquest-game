import { useRef } from "react";
import { Camera, Trash2, User } from "lucide-react";
import { toast } from "sonner";

const EMOJIS = ["🦁", "🐘", "🦒", "🦓", "🦏", "🐆", "🦛", "🐃", "🦅", "🐊", "🦉", "🐒"];

async function resizeToDataUrl(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarView({ value, className = "size-24" }: { value: string; className?: string }) {
  if (value.startsWith("emoji:")) {
    return (
      <div className={`${className} grid place-items-center rounded-full border-2 border-primary bg-secondary text-5xl`}>
        {value.slice(6)}
      </div>
    );
  }
  if (value) {
    return <img src={value} alt="Profile" className={`${className} rounded-full border-2 border-primary object-cover`} />;
  }
  return (
    <div className={`${className} grid place-items-center rounded-full border-2 border-border bg-secondary text-muted-foreground`}>
      <User className="size-10" />
    </div>
  );
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

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
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            onChange(await resizeToDataUrl(file));
          } catch {
            toast.error("Couldn't read that photo");
          }
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
    </div>
  );
}
