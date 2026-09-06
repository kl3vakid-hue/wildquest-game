import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, Search, ShieldCheck } from "lucide-react";

import { toast } from "sonner";
import { AnimalCard } from "@/components/AnimalCard";
import { CaptureSheet, type CaptureSubmission } from "@/components/CaptureSheet";
import { PointsBurst } from "@/components/PointsBurst";
import { ScreenShell } from "@/components/ScreenShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ANIMALS, RARITY_ORDER } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { STATUS_HINT, type VerificationStatus } from "@/lib/verificationRules";
import { enqueueSighting } from "@/services/offlineQueue";
import { submitSighting } from "@/services/verificationService";
import type { Animal, Rarity } from "@/types";

export const Route = createFileRoute("/spot")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Spot an Animal — WildQuest" },
      {
        name: "description",
        content:
          "Log a verified wildlife sighting. Take a live photo, let AI confirm the species, and earn rarity-based points.",
      },
      { property: "og:title", content: "Spot an Animal — WildQuest" },
      {
        property: "og:description",
        content: "Photograph an animal and let AI verify your sighting before points are awarded.",
      },
    ],
  }),
  component: Spot,
});

function Spot() {
  const navigate = useNavigate();
  const state = useGameSession();
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [rarity, setRarity] = useState<Rarity | "All">("All");
  const [burst, setBurst] = useState<Animal | null>(null);
  const [target, setTarget] = useState<Animal | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<
    { animal: Animal; status: VerificationStatus; reason: string | null; verdict: string | null } | null
  >(null);

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  const visible = useMemo(
    () =>
      ANIMALS.filter(
        (animal) =>
          (rarity === "All" || animal.rarity === rarity) &&
          animal.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, rarity],
  );

  /** How many times this tracker has logged each species (rejected ones don't count). */
  const spottedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sighting of state.mySightings) {
      if (sighting.verification_status === "rejected") continue;
      counts.set(sighting.animal_id, (counts.get(sighting.animal_id) ?? 0) + 1);
    }
    return counts;
  }, [state.mySightings]);

  function handleSelect(animal: Animal) {
    if (!state.session || !state.me) return;
    const count = spottedCounts.get(animal.id) ?? 0;
    const limit = limitFor(state.rarityLimits, animal.rarity);
    if (limit != null && count >= limit) {
      toast.info(
        `You've already logged ${animal.name} ${limit} ${limit === 1 ? "time" : "times"} — that's the limit for ${animal.rarity} animals in this game.`,
      );
      return;
    }
    setOutcome(null);
    setTarget(animal);
  }

  async function handleSubmit({ photo, geo }: CaptureSubmission) {
    if (!state.session || !target) return;
    const animal = target;

    if (!state.online) {
      enqueueSighting({
        localId: `${animal.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        gameId: state.session.gameId,
        playerId: state.session.playerId,
        animalId: animal.id,
        animalName: animal.name,
        rarity: animal.rarity,
        points: animal.points,
        imageDataUrl: photo.dataUrl,
        imageHash: photo.hash,
        capturedAt: photo.capturedAt,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        gpsAccuracy: geo?.accuracy ?? null,
        deviceId: state.session.deviceId,
      });
      setTarget(null);
      setOutcome({ animal, status: "pending", reason: null, verdict: null });
      toast.success(`${animal.name} saved — it will be verified when you have signal`);
      state.refresh();
      return;
    }

    setBusy(true);
    try {
      const result = await submitSighting({
        gameId: state.session.gameId,
        playerId: state.session.playerId,
        deviceId: state.session.deviceId,
        animalId: animal.id,
        animalName: animal.name,
        rarity: animal.rarity,
        points: animal.points,
        photo,
        geo,
      });
      setTarget(null);
      setOutcome({
        animal,
        status: result.status,
        reason: result.reason,
        verdict: result.outcome.aiVerdict,
      });
      if (result.status === "verified") {
        setBurst(animal);
        window.setTimeout(() => setBurst(null), 1600);
        toast.success(`${animal.name} verified — +${result.pointsAwarded} pts`);
      } else if (result.status === "rejected") {
        toast.error(result.reason ?? "That sighting could not be verified");
      } else {
        toast.info("Sighting logged — it needs community verification");
      }
      state.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell
      title="Spot Animal"
      subtitle={`${state.verifiedAnimalIds.size} verified · ${state.myAnimalIds.size} logged`}
      online={state.online}
      pendingCount={state.pendingCount}
      lastSynced={state.lastSynced}
    >
      <PointsBurst animal={burst} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search animals…"
          className="w-full rounded-2xl border border-border bg-input py-3 pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["All", ...RARITY_ORDER] as const).map((option) => (
          <button
            key={option}
            onClick={() => setRarity(option)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              rarity === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {outcome ? (
        <div className="surface mt-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{outcome.animal.name}</p>
            <StatusBadge status={outcome.status} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {outcome.reason ?? STATUS_HINT[outcome.status]}
          </p>
          {outcome.verdict ? (
            <p className="mt-1 text-xs italic text-muted-foreground">AI: {outcome.verdict}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-secondary/50 p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Tap a species, then take a live photo. Only AI-verified sightings score points on the
            leaderboard.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {visible.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            spotted={state.myAnimalIds.has(animal.id)}
            mode="spot"
            onSelect={handleSelect}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No animals match that search.
        </p>
      ) : null}

      <Link
        to="/identify"
        className="surface mt-6 flex items-center gap-3 p-4 text-left transition active:brightness-110"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Camera className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">Can&apos;t find your animal?</span>
          <span className="block text-xs text-muted-foreground">
            Take a photo and let AI identify the species.
          </span>
        </span>
      </Link>

      {target ? (
        <CaptureSheet
          animal={target}
          busy={busy}
          onClose={() => (busy ? null : setTarget(null))}
          onSubmit={(submission) => void handleSubmit(submission)}
        />
      ) : null}
    </ScreenShell>
  );
}
