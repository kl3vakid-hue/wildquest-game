import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { joinGame } from "@/services/gameService";
import { getDeviceId, recalledName, rememberName, saveSession } from "@/utils/session";

export const Route = createFileRoute("/join")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a WildQuest Game" },
      {
        name: "description",
        content: "Enter your name and a 6-character game code to join your group's WildQuest safari.",
      },
      { property: "og:title", content: "Join a WildQuest Game" },
      {
        property: "og:description",
        content: "Enter a game code and start spotting wildlife with your group.",
      },
    ],
  }),
  component: JoinGame,
});

const field =
  "w-full rounded-2xl border border-border bg-input px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

function JoinGame() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(recalledName());
  const [code, setCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    if (!playerName.trim() || code.trim().length < 4) {
      toast.error("Enter your name and the game code");
      return;
    }
    setBusy(true);
    try {
      const result = await joinGame({
        playerName: playerName.trim(),
        code: code.trim(),
        groupName: groupName.trim(),
        deviceId: getDeviceId(),
      });
      rememberName(playerName.trim());
      saveSession({
        gameId: result.game.id,
        playerId: result.player.id,
        deviceId: getDeviceId(),
      });
      navigate({ to: result.game.status === "active" ? "/game" : "/lobby" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the game");
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

        <h1 className="display text-4xl text-gold-gradient">Join Game</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask the host for the 6-character code.
        </p>

        <div className="mt-6 space-y-3">
          <input
            className={field}
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className={`${field} display text-center text-3xl tracking-[0.3em] uppercase`}
            placeholder="CODE"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <input
            className={field}
            placeholder="Group name (optional — join or create)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button onClick={handleJoin} disabled={busy}>
            {busy ? "Joining…" : "Join Game"}
          </Button>
        </div>
      </div>
    </main>
  );
}
