import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AnimalCard } from "@/components/AnimalCard";
import { PointsBurst } from "@/components/PointsBurst";
import { ScreenShell } from "@/components/ScreenShell";
import { ANIMALS, RARITY_ORDER } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { recordSighting } from "@/services/gameService";
import { enqueueSighting } from "@/services/offlineQueue";
import type { Animal, Rarity } from "@/types";

export const Route = createFileRoute("/spot")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Spot an Animal — WildQuest" },
      {
        name: "description",
        content: "Log a wildlife sighting in seconds. Search 34 South African species and earn points based on rarity.",
      },
      { property: "og:title", content: "Spot an Animal — WildQuest" },
      {
        property: "og:description",
        content: "Tap an animal to log your sighting and earn rarity-based points.",
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

  async function handleSpot(animal: Animal) {
    if (!state.session || !state.me) return;
    if (state.myAnimalIds.has(animal.id)) {
      toast.info(`${animal.name} is already in your collection`);
      return;
    }

    setBurst(animal);
    window.setTimeout(() => setBurst(null), 1600);

    const payload = {
      gameId: state.session.gameId,
      playerId: state.session.playerId,
      animalId: animal.id,
      animalName: animal.name,
      rarity: animal.rarity,
      points: animal.points,
    };

    if (!state.online) {
      enqueueSighting({
        localId: `${animal.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload,
      });
      toast.success(`${animal.name} saved offline`);
      state.refresh();
      return;
    }

    try {
      await recordSighting(payload);
      state.refresh();
    } catch {
      enqueueSighting({
        localId: `${animal.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload,
      });
      toast.error("Saved offline — will sync when you have signal");
    }
  }

  return (
    <ScreenShell
      title="Spot Animal"
      subtitle={`${state.myAnimalIds.size} species logged`}
      online={state.online}
      pendingCount={state.pendingCount}
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

      <div className="mt-4 grid grid-cols-3 gap-3">
        {visible.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            spotted={state.myAnimalIds.has(animal.id)}
            mode="spot"
            onSelect={handleSpot}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No animals match that search.
        </p>
      ) : null}
    </ScreenShell>
  );
}
