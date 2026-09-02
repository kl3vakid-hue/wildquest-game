import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Gauge, Lock, Target } from "lucide-react";

import { ScreenShell } from "@/components/ScreenShell";
import { RARITY_ORDER } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import { formatPoints } from "@/utils/format";

export const Route = createFileRoute("/progress")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Progress & Achievements — WildQuest" },
      {
        name: "description",
        content:
          "Track species scoring progress, unlock achievements like the Big Five, and see your tracker reputation score.",
      },
      { property: "og:title", content: "Progress & Achievements — WildQuest" },
      {
        property: "og:description",
        content: "Species limits, achievements and reputation for your WildQuest safari.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Progress,
});

function Progress() {
  const navigate = useNavigate();
  const state = useGameSession();

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  const rep = state.reputation;
  const unlocked = state.achievements.filter((a) => a.unlocked).length;

  return (
    <ScreenShell
      title="Progress"
      subtitle={`${unlocked}/${state.achievements.length} achievements · ${formatPoints(state.myScore)} pts`}
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <section className="surface p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Gauge className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{rep.tier}</p>
            <p className="text-xs text-muted-foreground">
              {rep.verified} verified · {rep.rejected} rejected · {rep.flagged} flagged
            </p>
          </div>
          <span className="display text-3xl text-gold-gradient">{rep.score}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${rep.score}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Reputation rises with verified sightings and falls when submissions are rejected or
          flagged by the anti-cheat checks.
        </p>
      </section>

      {state.mySightings.length ? (
        <section className="surface mt-6 divide-y divide-border p-0">
          <h2 className="display px-4 py-3 text-lg tracking-wide">Sighting status</h2>
          {state.mySightings.slice(0, 8).map((sighting) => (
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

      <section className="mt-6">
        <h2 className="display flex items-center gap-2 text-xl tracking-wide">
          <Award className="size-5 text-primary" /> Achievements
        </h2>
        <ul className="mt-2 space-y-2">
          {state.achievements.map(({ achievement, have, need, unlocked: done, missing }) => (
            <li
              key={achievement.id}
              className={`surface p-4 ${done ? "border-primary/60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{done ? achievement.icon : "🔒"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {Math.min(have, need)}/{need}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (have / need) * 100)}%` }}
                />
              </div>
              {!done && missing.length ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Still needed: {missing.slice(0, 4).join(", ")}
                  {missing.length > 4 ? "…" : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="display flex items-center gap-2 text-xl tracking-wide">
          <Target className="size-5 text-primary" /> Species progress
        </h2>
        <div className="surface mt-2 p-4">
          <p className="text-xs text-muted-foreground">
            Point limits per species in this game:
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {RARITY_ORDER.map((rarity) => (
              <li
                key={rarity}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {rarity}: {state.rarityLimits[rarity] ?? "∞"}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-3 space-y-2">
          {state.speciesProgress.map((row) => (
            <li key={row.animalId} className="surface flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{row.animalName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.rarity} · {row.verified} verified
                  {row.limit != null ? ` of ${row.limit} scoring` : " · unlimited"}
                </p>
                {row.limit != null ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (row.verified / row.limit) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <span className="display text-xl text-gold-gradient">
                {formatPoints(row.points)}
              </span>
              {row.full ? <Lock className="size-4 text-muted-foreground" /> : null}
            </li>
          ))}
        </ul>

        {state.speciesProgress.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No verified sightings yet — spot an animal to start your progress.
          </p>
        ) : null}
      </section>
    </ScreenShell>
  );
}
