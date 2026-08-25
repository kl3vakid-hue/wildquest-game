import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { useGameSession } from "@/hooks/useGameSession";
import { formatPoints } from "@/utils/format";

export const Route = createFileRoute("/rankings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live Rankings — WildQuest" },
      {
        name: "description",
        content: "Live individual and group leaderboards for your WildQuest game, updating the moment anyone logs a sighting.",
      },
      { property: "og:title", content: "Live Rankings — WildQuest" },
      {
        property: "og:description",
        content: "See who is winning your safari with realtime leaderboards.",
      },
    ],
  }),
  component: Rankings,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function Rankings() {
  const navigate = useNavigate();
  const state = useGameSession();
  const [tab, setTab] = useState<"players" | "groups">("players");

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  return (
    <ScreenShell
      title="Rankings"
      subtitle={state.game?.name}
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <div className="flex gap-2 rounded-2xl bg-secondary p-1">
        {(["players", "groups"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              tab === option
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {tab === "players" ? (
        <ul className="mt-4 space-y-2">
          {state.leaderboard.map((player, index) => (
            <motion.li
              key={player.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`surface flex items-center gap-3 px-4 py-3 ${
                player.id === state.me?.id ? "border-primary/60" : ""
              }`}
            >
              <span className="display w-8 text-center text-2xl">
                {MEDALS[index] ?? index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {player.name}
                  {player.is_host ? (
                    <Crown className="ml-1 inline size-3.5 text-primary" />
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {state.groups.find((g) => g.id === player.group_id)?.name ?? "No group"}
                </p>
              </div>
              <span className="display text-2xl text-gold-gradient">
                {formatPoints(player.id === state.me?.id ? state.myScore : player.score)}
              </span>
            </motion.li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-2">
          {state.groupStandings.map((standing, index) => (
            <motion.li
              key={standing.group.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`surface px-4 py-3 ${
                standing.group.id === state.myGroup?.id ? "border-primary/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="display w-8 text-center text-2xl">
                  {MEDALS[index] ?? index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{standing.group.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" /> {standing.members.length} ·{" "}
                    {standing.animalsFound} species
                  </p>
                </div>
                <span className="display text-2xl text-gold-gradient">
                  {formatPoints(standing.total)}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {state.leaderboard.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No players yet.
        </p>
      ) : null}
    </ScreenShell>
  );
}
