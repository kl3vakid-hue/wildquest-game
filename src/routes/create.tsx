import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { createGame, startGame } from "@/services/gameService";
import type { Game } from "@/types";
import { getDeviceId, rememberName, saveSession } from "@/utils/session";

export const Route = createFileRoute("/create")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create a WildQuest Game" },
      {
        name: "description",
        content: "Start a new WildQuest safari, name your group and share your 6-character game code.",
      },
      { property: "og:title", content: "Create a WildQuest Game" },
      {
        property: "og:description",
        content: "Start a new WildQuest safari and invite your group with a game code.",
      },
    ],
  }),
  component: CreateGame,
});

const field =
  "w-full rounded-2xl border border-border bg-input px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

function CreateGame() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [gameName, setGameName] = useState("");
  const [busy, setBusy] = useState(false);
  const [game, setGame] = useState<Game | null>(null);

  async function handleCreate() {
    if (!playerName.trim() || !groupName.trim() || !gameName.trim()) {
      toast.error("Fill in your name, group name and game name");
      return;
    }
    setBusy(true);
    try {
      const result = await createGame({
        playerName: playerName.trim(),
        groupName: groupName.trim(),
        gameName: gameName.trim(),
        deviceId: getDeviceId(),
      });
      rememberName(playerName.trim());
      saveSession({
        gameId: result.game.id,
        playerId: result.player.id,
        deviceId: getDeviceId(),
      });
      setGame(result.game);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the game");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    if (!game) return;
    setBusy(true);
    try {
      await startGame(game.id);
      navigate({ to: "/game" });
    } catch {
      toast.error("Could not start the game");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-veld min-h-screen">
      <div className="mx-auto max-w-md px-5 py-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="display text-4xl text-gold-gradient">Create Game</h1>

        {!game ? (
          <div className="mt-6 space-y-3">
            <input
              className={field}
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              className={field}
              placeholder="Group name (e.g. Bakkie Crew)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <input
              className={field}
              placeholder="Game name (e.g. Kruger Adventure)"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={busy}>
              {busy ? "Creating…" : "Create Game"}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-5"
          >
            <div className="surface p-6 text-center">
              <p className="display text-sm tracking-[0.3em] text-muted-foreground">
                GAME CODE
              </p>
              <p className="display mt-2 text-6xl tracking-[0.15em] text-gold-gradient">
                {game.code}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(game.code)
                    .then(() => toast.success("Code copied"))
                    .catch(() => toast.error("Copy not available"));
                }}
                className="mx-auto mt-4 flex items-center gap-2 text-sm text-primary"
              >
                <Copy className="size-4" /> Copy code
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Give this code to the other players.
            </p>

            <Button onClick={handleStart} disabled={busy}>
              <Play className="size-5" /> Start Game
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/lobby" })}>
              View lobby
            </Button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
