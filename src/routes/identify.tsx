import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  Loader2,
  MapPin,
  PawPrint,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ScreenShell } from "@/components/ScreenShell";
import { ANIMALS } from "@/data/animals";
import {
  AI_ANIMAL_POINTS,
  AI_ANIMAL_RARITY,
  aiAnimalId,
} from "@/data/discovered";
import { useGameSession } from "@/hooks/useGameSession";
import type { IdentificationResult } from "@/lib/identify.functions";
import { identifyAnimal } from "@/lib/identify.functions";
import { recordSighting } from "@/services/gameService";
import { enqueueSighting } from "@/services/offlineQueue";
import {
  deleteIdentification,
  getPhotoUrl,
  listMyIdentifications,
  saveIdentification,
  uploadPhoto,
  type StoredIdentification,
} from "@/services/identifyService";
import { getDeviceId } from "@/utils/session";


export const Route = createFileRoute("/identify")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Identify an Animal — WildQuest" },
      {
        name: "description",
        content:
          "Snap or upload a photo of an animal you don't recognise and let WildQuest's AI suggest the species, habitat and interesting facts.",
      },
      { property: "og:title", content: "Identify an Animal — WildQuest" },
      {
        property: "og:description",
        content: "Photo-based AI animal identification for South African game reserves.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Identify,
});

const MAX_EDGE = 1280;

async function toCompressedDataUrl(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process that photo."))), "image/jpeg", 0.82),
  );
  return { dataUrl, blob };
}

function findKnownAnimal(result: IdentificationResult) {
  const candidates = [result.matchesKnownAnimal, result.animalName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  return ANIMALS.find((animal) =>
    candidates.some(
      (candidate) =>
        candidate === animal.name.toLowerCase() ||
        candidate.includes(animal.name.toLowerCase()) ||
        animal.name.toLowerCase().includes(candidate),
    ),
  );
}

function Identify() {
  const navigate = useNavigate();
  const state = useGameSession();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [known, setKnown] = useState<ReturnType<typeof findKnownAnimal>>(undefined);
  const [savePhoto, setSavePhoto] = useState(true);
  const [history, setHistory] = useState<StoredIdentification[]>([]);
  const [historyUrls, setHistoryUrls] = useState<Record<string, string>>({});

  const deviceId = typeof window === "undefined" ? "server" : getDeviceId();

  async function refreshHistory() {
    try {
      const rows = await listMyIdentifications(deviceId);
      setHistory(rows);
      const urls: Record<string, string> = {};
      await Promise.all(
        rows.map(async (row) => {
          if (!row.image_path) return;
          const url = await getPhotoUrl(row.image_path);
          if (url) urls[row.id] = url;
        }),
      );
      setHistoryUrls(urls);
    } catch {
      /* history is non-critical */
    }
  }

  useEffect(() => {
    void refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      setResult(null);
      setKnown(undefined);
      setPreview(await toCompressedDataUrl(file));
    } catch {
      toast.error("That photo could not be read. Try another one.");
    }
  }

  function clearPhoto() {
    setPreview(null);
    setResult(null);
    setKnown(undefined);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  async function handleIdentify() {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    setKnown(undefined);
    try {
      const identification = await identifyAnimal({
        data: {
          imageDataUrl: preview.dataUrl,
          knownAnimals: ANIMALS.map((a) => a.name),
        },
      });
      setResult(identification);

      if (identification.status === "low_confidence") return;

      const match = findKnownAnimal(identification);
      setKnown(match);
      if (match) return;

      let imagePath: string | null = null;
      if (savePhoto) {
        try {
          imagePath = await uploadPhoto(preview.blob, deviceId);
        } catch {
          toast.error("Photo could not be saved, but the identification worked.");
        }
      }

      try {
        await saveIdentification({
          result: identification,
          deviceId,
          gameId: state.session?.gameId ?? null,
          playerId: state.session?.playerId ?? null,
          imagePath,
        });
        void refreshHistory();
      } catch {
        toast.error("Identification saved on screen only — the database was unavailable.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Identification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSpotDiscovery(name: string) {
    if (!state.session || !state.me) {
      toast.info("Join or create a game first to earn points.");
      return;
    }
    const animalId = aiAnimalId(name);
    if (state.myAnimalIds.has(animalId)) {
      toast.info(`${name} is already in your collection`);
      return;
    }
    const payload = {
      gameId: state.session.gameId,
      playerId: state.session.playerId,
      animalId,
      animalName: name,
      rarity: AI_ANIMAL_RARITY,
      points: AI_ANIMAL_POINTS,
    };

    if (!state.online) {
      enqueueSighting({ localId: `${animalId}-${Date.now()}`, createdAt: new Date().toISOString(), ...payload });
      toast.success(`${name} saved offline · +${AI_ANIMAL_POINTS} pts`);
      state.refresh();
      return;
    }

    try {
      await recordSighting(payload);
      toast.success(`${name} spotted · +${AI_ANIMAL_POINTS} pts`);
      state.refresh();
    } catch {
      enqueueSighting({ localId: `${animalId}-${Date.now()}`, createdAt: new Date().toISOString(), ...payload });
      toast.error("Saved offline — will sync when you have signal");
    }
  }


  async function handleDelete(row: StoredIdentification) {
    if (!window.confirm(`Delete your ${row.animal_name} identification and its photo?`)) return;
    try {
      await deleteIdentification(row.id, row.image_path);
      toast.success("Identification deleted");
      void refreshHistory();
    } catch {
      toast.error("Could not delete that identification");
    }
  }

  return (
    <ScreenShell
      title="Identify an Animal"
      subtitle="Photograph an animal that isn't on the Spot list"
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="surface overflow-hidden p-0">
          <div className="relative">
            <img src={preview.dataUrl} alt="Photo of the animal to identify" className="w-full object-cover" />
            <button
              onClick={clearPhoto}
              aria-label="Remove photo"
              className="absolute right-3 top-3 rounded-full border border-border bg-popover/90 p-2 text-foreground backdrop-blur"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="surface flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Camera className="size-10 text-primary" strokeWidth={1.6} />
          <p className="text-sm text-muted-foreground">
            Take a clear photo of the animal, or upload one from your phone.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => cameraRef.current?.click()}>
            <Camera className="size-5" /> {preview ? "Retake" : "Take Photo"}
          </Button>
          <Button variant="secondary" onClick={() => uploadRef.current?.click()}>
            <ImageUp className="size-5" /> Upload
          </Button>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={savePhoto}
            onChange={(e) => setSavePhoto(e.target.checked)}
            className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
          />
          <span>
            Save my photo with the identification. Leave this unticked and only the text result is stored. You can
            delete saved photos below at any time.
          </span>
        </label>

        <Button onClick={() => void handleIdentify()} disabled={!preview || loading}>
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          {loading ? "Analyzing your animal…" : "Identify Animal"}
        </Button>
      </div>

      {loading ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Analyzing your animal… this usually takes a few seconds.
        </p>
      ) : null}

      {result?.status === "low_confidence" ? (
        <div className="surface mt-5 space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-5 text-primary" /> Not confident enough
          </div>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t identify this animal with enough confidence. Try taking another photo with the animal
            clearly visible.
          </p>
          <Button variant="secondary" onClick={() => cameraRef.current?.click()}>
            <Camera className="size-5" /> Take Another Photo
          </Button>
        </div>
      ) : null}

      {result?.status === "identified" && known ? (
        <div className="surface mt-5 space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="size-5 text-primary" /> {known.image} {known.name}
          </div>
          <p className="text-sm text-muted-foreground">This animal is already in our Spot an Animal list!</p>
          <Button onClick={() => navigate({ to: "/spot", search: { q: known.name } })}>
            View {known.name} in Spot an Animal
          </Button>
        </div>
      ) : null}

      {result?.status === "identified" && !known ? (
        <div className="surface mt-5 space-y-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Likely species</p>
            <h2 className="display mt-1 text-3xl leading-none text-gold-gradient">{result.animalName}</h2>
            {result.scientificName ? (
              <p className="text-sm italic text-muted-foreground">{result.scientificName}</p>
            ) : null}
          </div>

          {result.confidence !== null ? (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>AI confidence</span>
                <span className="font-semibold text-foreground">{Math.round(result.confidence)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${result.confidence}%` }} />
              </div>
            </div>
          ) : null}

          {result.description ? <p className="text-sm text-foreground/90">{result.description}</p> : null}

          {result.habitat ? (
            <div className="flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{result.habitat}</span>
            </div>
          ) : null}

          {result.interestingFacts.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interesting facts</p>
              <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                {result.interestingFacts.map((fact) => (
                  <li key={fact} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.inSouthAfrica !== null ? (
            <p className="rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {result.inSouthAfrica
                ? "Likely found in South Africa."
                : "Not typically found in South Africa."}
            </p>
          ) : null}

          <p className="flex gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              AI identification can be incorrect. Please verify with a guide or field guide book if the
              identification matters.
            </span>
          </p>
        </div>
      ) : null}

      {history.length ? (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Your identifications</h2>
          <ul className="mt-3 space-y-3">
            {history.map((row) => (
              <li key={row.id} className="surface flex items-center gap-3 p-3">
                {historyUrls[row.id] ? (
                  <img
                    src={historyUrls[row.id]}
                    alt={row.animal_name}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Camera className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{row.animal_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.confidence !== null ? `${Math.round(row.confidence)}% · ` : ""}
                    {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => void handleDelete(row)}
                  aria-label={`Delete ${row.animal_name} identification`}
                  className="rounded-xl border border-border p-2 text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ScreenShell>
  );
}
