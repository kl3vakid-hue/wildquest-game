import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { useGameSession } from "@/hooks/useGameSession";
import { setReady, startGame } from "@/services/gameService";

export const Route = createFileRoute("/lobby")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "WildQuest Lobby — Waiting for Players" },
      {
        name: "description",
        content: "See who has joined your WildQuest game, mark yourself ready and let the host start the drive.",
      },
      { property: "og:title", content: "WildQuest Lobby" },
      {
        property: "og:description",
        content: "Live lobby showing every player who has joined your safari.",
      },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  useEffect(() => {
    if (state.game?.status === "active") navigate({ to: "/game" });
    if (state.game?.status === "ended") navigate({ to: "/results" });
  }, [state.game?.status, navigate]);

  const { game, players, me, groups } = state;

  return (
    <main className="bg-veld min-h-screen">
      <div className="mx-auto max-w-md px-5 py-8">
        <p className="display text-sm tracking-[0.3em] text-muted-foreground">GAME</p>
        <h1 className="display text-4xl text-gold-gradient">{game?.name ?? "Loading…"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Code <span className="display tracking-[0.2em] text-primary">{game?.code}</span>
        </p>

        <div className="surface mt-6 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> Players ({players.length})
          </div>
          <ul className="space-y-2">
            {players.map((player) => (
              <motion.li
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {player.is_host ? <Crown className="size-4 text-primary" /> : null}
                  {player.name}
                  <span className="text-xs text-muted-foreground">
                    {groups.find((g) => g.id === player.group_id)?.name}
                  </span>
                </span>
                {player.is_ready ? (
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-accent">
                    <Check className="size-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Waiting…</span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-3">
          {me && !me.is_ready ? (
            <Button
              onClick={() =>
                setReady(me.id, true).catch(() => toast.error("Could not mark ready"))
              }
            >
              <Check className="size-5" /> Ready
            </Button>
          ) : null}

          {state.isHost ? (
            <Button
              variant={me?.is_ready ? "primary" : "secondary"}
              onClick={() =>
                game &&
                startGame(game.id)
                  .then(() => navigate({ to: "/game" }))
                  .catch(() => toast.error("Could not start the game"))
              }
            >
              <Play className="size-5" /> Start Game
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for the host to start the game…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
