import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AvatarView } from "@/components/AvatarPicker";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Binoculars, BookMarked, Camera, Flag, ShieldAlert, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ScreenShell } from "@/components/ScreenShell";
import { StatusBadge, toStatus } from "@/components/StatusBadge";
import { TOTAL_ANIMALS } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { endGame } from "@/services/gameService";
import { formatPoints, formatTime } from "@/utils/format";

export const Route = createFileRoute("/game")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "WildQuest Dashboard — Your Safari Score" },
      {
        name: "description",
        content: "Your live WildQuest dashboard: current score, animals spotted and quick access to spotting, rankings and your group.",
      },
      { property: "og:title", content: "WildQuest Dashboard" },
      {
        property: "og:description",
        content: "Track your score and animals spotted while out on the drive.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  useEffect(() => {
    if (state.game?.status === "ended") navigate({ to: "/results" });
    if (state.game?.status === "lobby") navigate({ to: "/lobby" });
  }, [state.game?.status, navigate]);

  const found = state.myAnimalIds.size;

  return (
    <ScreenShell
      title={state.game?.name ?? "WildQuest"}
      subtitle={`${state.myGroup?.name ?? "No group"} · Code ${state.game?.code ?? "—"}`}
      online={state.online}
      pendingCount={state.pendingCount}
      lastSynced={state.lastSynced}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="surface p-6 text-center"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Your Score
        </p>
        <p className="display mt-1 text-7xl leading-none text-gold-gradient">
          {formatPoints(state.myScore)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Animals spotted: {found} / {TOTAL_ANIMALS}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(found / TOTAL_ANIMALS) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </motion.section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm text-muted-foreground">Safari feed</h2>
        {(() => {
          const feed = [...state.sightings]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 15);
          if (feed.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">
                No sightings yet — be the first to spot something.
              </p>
            );
          }
          return (
            <ul className="space-y-2">
              {feed.map((sighting) => {
                const player = state.players.find((p) => p.id === sighting.player_id);
                return (
                  <li
                    key={sighting.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-2.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <AvatarView value={player?.avatar} className="size-8" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{sighting.animal_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {player?.name ?? "someone"}
                          {player?.id === state.me?.id ? " (you)" : ""} ·{" "}
                          {formatTime(sighting.created_at)}
                        </span>
                      </span>
                    </span>
                    <StatusBadge status={toStatus(sighting.verification_status)} />
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </section>

      <div className="mt-5 space-y-3">
        <Button onClick={() => navigate({ to: "/spot" })}>
          <Binoculars className="size-6" /> Spot Animal
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate({ to: "/rankings" })}>
            <Trophy className="size-5" /> Ranks
          </Button>
          <Button variant="secondary" onClick={() => navigate({ to: "/collection" })}>
            <BookMarked className="size-5" /> Collection
          </Button>
        </div>
        <Button variant="ghost" onClick={() => navigate({ to: "/group" })}>
          <Users className="size-5" /> Group
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/progress" })}>
          <Award className="size-5" /> Progress & Achievements
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/identify" })}>
          <Camera className="size-5" /> Can't find your animal?
        </Button>

        {state.isHost ? (
          <Button variant="ghost" onClick={() => navigate({ to: "/admin" })}>
            <ShieldAlert className="size-5" /> Host Dashboard
          </Button>
        ) : null}

        {state.isHost && state.game ? (
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm("End the game for everyone?")) return;
              endGame(state.game!.id)
                .then(() => navigate({ to: "/results" }))
                .catch(() => toast.error("Could not end the game"));
            }}
          >
            <Flag className="size-5" /> End Game
          </Button>
        ) : null}
      </div>
    </ScreenShell>
  );
}
