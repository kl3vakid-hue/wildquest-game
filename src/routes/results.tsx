import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Trophy } from "lucide-react";
import { Button } from "@/components/Button";
import { TOTAL_ANIMALS } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { formatPoints } from "@/utils/format";
import { clearSession } from "@/utils/session";

export const Route = createFileRoute("/results")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Final Results — WildQuest" },
      {
        name: "description",
        content: "Final WildQuest standings: winning group, top spotter and the rarest animal of the drive.",
      },
      { property: "og:title", content: "Final Results — WildQuest" },
      {
        property: "og:description",
        content: "See who won your safari and which rare animals were spotted.",
      },
    ],
  }),
  component: Results,
});

function Results() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  const winningGroup = state.groupStandings[0];
  const topPlayer = state.leaderboard[0];
  const rarest = [...state.sightings].sort((a, b) => b.points - a.points)[0];
  const speciesFound = new Set(state.sightings.map((s) => s.animal_id)).size;

  return (
    <main className="bg-veld min-h-screen">
      <div className="mx-auto max-w-md px-5 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Trophy className="mx-auto size-14 text-primary" />
          <h1 className="display mt-3 text-5xl text-gold-gradient">Final Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">{state.game?.name}</p>
        </motion.div>

        <div className="surface mt-8 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Winning group
          </p>
          <p className="display mt-1 text-4xl text-gold-gradient">
            {winningGroup?.group.name ?? "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPoints(winningGroup?.total ?? 0)} points
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="surface p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Top spotter
            </p>
            <p className="mt-1 truncate text-lg font-semibold">{topPlayer?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {formatPoints(topPlayer?.score ?? 0)} pts
            </p>
          </div>
          <div className="surface p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Rarest find
            </p>
            <p className="mt-1 truncate text-lg font-semibold">
              {rarest?.animal_name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">{rarest?.rarity ?? ""}</p>
          </div>
        </div>

        <div className="surface mt-4 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your score{" "}
            <span className="display text-2xl text-gold-gradient">
              {formatPoints(state.myScore)}
            </span>{" "}
            · group spotted {speciesFound} of {TOTAL_ANIMALS} species
          </p>
        </div>

        <ol className="mt-6 space-y-2">
          {state.leaderboard.map((player, index) => (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5 text-sm"
            >
              <span className="truncate">
                {index + 1}. {player.name}
              </span>
              <span className="display text-lg">{formatPoints(player.score)}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Button
            onClick={() => {
              clearSession();
              navigate({ to: "/" });
            }}
          >
            <Home className="size-5" /> Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
}
