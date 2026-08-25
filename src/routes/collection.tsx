import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AnimalCard } from "@/components/AnimalCard";
import { ScreenShell } from "@/components/ScreenShell";
import { ANIMALS, RARITY_ORDER, TOTAL_ANIMALS } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { formatPoints } from "@/utils/format";

export const Route = createFileRoute("/collection")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Collection — WildQuest" },
      {
        name: "description",
        content: "Your personal wildlife checklist: every South African species you have spotted, grouped by rarity.",
      },
      { property: "og:title", content: "My Collection — WildQuest" },
      {
        property: "og:description",
        content: "Unlock all 34 species and complete your safari checklist.",
      },
    ],
  }),
  component: Collection;
});

function Collection() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  const found = state.myAnimalIds.size;

  return (
    <ScreenShell
      title="Collection"
      subtitle={`${found} of ${TOTAL_ANIMALS} species · ${formatPoints(state.myScore)} pts`}
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

      {RARITY_ORDER.map((rarity) => {
        const animals = ANIMALS.filter((animal) => animal.rarity === rarity);
        const unlocked = animals.filter((a) => state.myAnimalIds.has(a.id)).length;
        return (
          <section key={rarity} className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="display text-xl tracking-wide">{rarity}</h2>
              <span className="text-xs text-muted-foreground">
                {unlocked}/{animals.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {animals.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  spotted={state.myAnimalIds.has(animal.id)}
                  mode="collection"
                />
              ))}
            </div>
          </section>
        );
      })}
    </ScreenShell>
  );
}
