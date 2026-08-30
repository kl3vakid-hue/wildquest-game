import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, MapPin, RotateCcw, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/Button";
import { getGeoFix, preparePhoto, type CapturedPhoto, type GeoFix } from "@/services/capture";
import type { Animal } from "@/types";

export interface CaptureSubmission {
  photo: CapturedPhoto;
  geo: GeoFix | null;
}

/**
 * Live-capture-only proof sheet. Gallery uploads are deliberately not offered:
 * the file input is camera-backed and every photo is fingerprinted and stamped
 * with a fresh location fix before it goes to the verifier.
 */
export function CaptureSheet({
  animal,
  busy,
  onClose,
  onSubmit,
}: {
  animal: Animal;
  busy: boolean;
  onClose: () => void;
  onSubmit: (submission: CaptureSubmission) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [geo, setGeo] = useState<GeoFix | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGeoState("locating");
    getGeoFix().then((fix) => {
      if (cancelled) return;
      setGeo(fix);
      setGeoState(fix ? "ok" : "denied");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setPhoto(await preparePhoto(file, true));
    } catch {
      setError("That photo could not be processed. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm">
      <div className="surface max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proof required
            </p>
            <h2 className="font-display text-2xl text-foreground">{animal.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Take a live photo of the {animal.name.toLowerCase()}. AI verifies the species before any
          points are awarded.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-secondary">
          {photo ? (
            <img src={photo.dataUrl} alt={`Your photo of a ${animal.name}`} className="w-full" />
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 px-4 py-12 text-muted-foreground"
            >
              <Camera className="size-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Open camera</span>
              <span className="text-xs">Live capture only — gallery uploads are not accepted</span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        <div className="mt-3 flex items-center gap-2 text-xs">
          <MapPin
            className={`size-3.5 ${geoState === "ok" ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-muted-foreground">
            {geoState === "locating"
              ? "Getting your location…"
              : geoState === "ok" && geo
                ? `Location locked (±${Math.round(geo.accuracy)}m)`
                : "No location — the sighting will need community verification"}
          </span>
        </div>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          {photo ? (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onClick={() => {
                setPhoto(null);
                inputRef.current?.click();
              }}
            >
              <RotateCcw className="size-4" /> Retake
            </Button>
          ) : null}
          <Button
            className="flex-1"
            disabled={!photo || busy || geoState === "locating"}
            onClick={() => photo && onSubmit({ photo, geo })}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" /> Submit for verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
