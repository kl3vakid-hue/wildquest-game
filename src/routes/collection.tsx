import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AnimalCard } from "@/components/AnimalCard";
import { ScreenShell } from "@/components/ScreenShell";
import { StatusBadge, toStatus } from "@/components/StatusBadge";
import { ANIMALS, RARITY_ORDER, TOTAL_ANIMALS } from "@/data/animals";
import { AI_ANIMAL_RARITY, isAiAnimalId } from "@/data/discovered";
import { useGameSession } from "@/hooks/useGameSession";
import { STATUS_HINT } from "@/lib/verificationRules";
import { getPhotoUrl, listMyIdentifications } from "@/services/identifyService";
import type { Animal, Rarity } from "@/types";
import { formatPoints } from "@/utils/format";
import { getDeviceId } from "@/utils/session";

export const Route = createFileRoute("/collection")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Collection — WildQuest" },
      {
        name: "description",
        content:
          "Your personal wildlife checklist: every South African species you have spotted, grouped by rarity.",
      },
      { property: "og:title", content: "My Collection — WildQuest" },
      {
        property: "og:description",
        content: "Unlock all 34 species and complete your safari checklist.",
      },
    ],
  }),
  component: Collection,
});

function Collection() {
  const navigate = useNavigate();
  const state = useGameSession();
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  // Photos the player took for their AI-identified animals, keyed by animal name.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMyIdentifications(getDeviceId());
        const map: Record<string, string> = {};
        await Promise.all(
          rows.map(async (row) => {
            if (!row.image_path) return;
            const key = row.animal_name.toLowerCase();
            if (map[key]) return;
            const url = await getPhotoUrl(row.image_path);
            if (url) map[key] = url;
          }),
        );
        if (!cancelled) setPhotos(map);
      } catch {
        /* photos are non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** AI-identified animals become collection cards in their own rarity band. */
  const discovered = useMemo<Animal[]>(() => {
    const byId = new Map<string, Animal>();
    for (const sighting of state.mySightings) {
      if (!isAiAnimalId(sighting.animal_id) || byId.has(sighting.animal_id)) continue;
      byId.set(sighting.animal_id, {
        id: sighting.animal_id,
        name: sighting.animal_name,
        points: sighting.points,
        rarity: (sighting.rarity as Rarity) ?? AI_ANIMAL_RARITY,
        image: "📸",
      });
    }
    return Array.from(byId.values());
  }, [state.mySightings]);

  const found = ANIMALS.filter((a) => state.verifiedAnimalIds.has(a.id)).length;
  const recent = state.mySightings.slice(0, 8);

  return (
    <ScreenShell
      title="Collection"
      subtitle={`${found} of ${TOTAL_ANIMALS} verified${
        discovered.length ? ` · ${discovered.length} AI finds` : ""
      } · ${formatPoints(state.myScore)} pts`}
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(found / TOTAL_ANIMALS) * 100}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {recent.length ? (
        <section className="surface mt-4 divide-y divide-border p-0">
          <h2 className="display px-4 py-3 text-lg tracking-wide">Sighting status</h2>
          {recent.map((sighting) => (
            <div key={sighting.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {sighting.animal_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sighting.verification_status === "verified"
                    ? `+${sighting.points} pts`
                    : (sighting.reject_reason ?? STATUS_HINT[toStatus(sighting.verification_status)])}
                </p>
              </div>
              <StatusBadge status={sighting.verification_status} />
            </div>
          ))}
        </section>
      ) : null}


      {RARITY_ORDER.map((rarity) => {
        const animals = ANIMALS.filter((animal) => animal.rarity === rarity);
        const extras = discovered.filter((animal) => animal.rarity === rarity);
        const unlocked = animals.filter((a) => state.verifiedAnimalIds.has(a.id)).length;
        return (
          <section key={rarity} className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="display text-xl tracking-wide">{rarity}</h2>
              <span className="text-xs text-muted-foreground">
                {unlocked + extras.length}/{animals.length + extras.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {animals.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  spotted={state.verifiedAnimalIds.has(animal.id)}
                  mode="collection"
                />
              ))}
              {extras.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  spotted
                  mode="collection"
                  photoUrl={photos[animal.name.toLowerCase()]}
                />
              ))}
            </div>
          </section>
        );
      })}
    </ScreenShell>
  );
}
