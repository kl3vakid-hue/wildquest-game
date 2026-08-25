import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Crown, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ScreenShell } from "@/components/ScreenShell";
import { useGameSession } from "@/hooks/useGameSession";
import { formatPoints, formatTime } from "@/utils/format";
import { clearSession } from "@/utils/session";

export const Route = createFileRoute("/group")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Group — WildQuest" },
      {
        name: "description",
        content: "See your WildQuest group members, their scores and the latest sightings from your vehicle.",
      },
      { property: "og:title", content: "My Group — WildQuest" },
      {
        property: "og:description",
        content: "Track your group's combined score and recent wildlife sightings.",
      },
    ],
  }),
  component: GroupScreen,
});

function GroupScreen() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  const memberIds = new Set(state.myGroupMembers.map((m) => m.id));
  const recent = state.sightings.filter((s) => memberIds.has(s.player_id)).slice(0, 12);
  const groupTotal = state.myGroupMembers.reduce((sum, m) => sum + m.score, 0);

  return (
    <ScreenShell
      title={state.myGroup?.name ?? "My Group"}
      subtitle={`${state.myGroupMembers.length} members · ${formatPoints(groupTotal)} pts`}
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <div className="surface flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Game code
          </p>
          <p className="display text-3xl tracking-[0.2em] text-gold-gradient">
            {state.game?.code ?? "—"}
          </p>
        </div>
        <button
          onClick={() => {
            if (!state.game) return;
            navigator.clipboard
              ?.writeText(state.game.code)
              .then(() => toast.success("Code copied"))
              .catch(() => toast.error("Copy not available"));
          }}
          className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-foreground"
        >
          <Copy className="size-4" /> Copy
        </button>
      </div>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" /> Members
        </h2>
        <ul className="space-y-2">
          {state.myGroupMembers.map((member) => (
            <motion.li
              key={member.id}
              layout
              className="surface flex items-center justify-between px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {member.is_host ? <Crown className="size-4 text-primary" /> : null}
                {member.name}
                {member.id === state.me?.id ? (
                  <span className="text-xs text-muted-foreground">(you)</span>
                ) : null}
              </span>
              <span className="display text-xl text-gold-gradient">
                {formatPoints(member.id === state.me?.id ? state.myScore : member.score)}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm text-muted-foreground">Recent sightings</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sightings yet — go find something.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((sighting) => (
              <li
                key={sighting.id}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5 text-sm"
              >
                <span className="truncate">
                  <span className="font-semibold">{sighting.animal_name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    by{" "}
                    {state.players.find((p) => p.id === sighting.player_id)?.name ??
                      "someone"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatTime(sighting.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (!window.confirm("Leave this game on this device?")) return;
            clearSession();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="size-5" /> Leave Game
        </Button>
      </div>
    </ScreenShell>
  );
}
