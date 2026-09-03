import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Sliders,
  Trash2,
  UserMinus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/Button";
import { ScreenShell } from "@/components/ScreenShell";
import { SightingPhoto } from "@/components/SightingPhoto";
import { StatusBadge } from "@/components/StatusBadge";
import { ANIMALS, RARITY_ORDER } from "@/data/animals";
import { useGameSession } from "@/hooks/useGameSession";
import type { RarityLimits } from "@/lib/scoringRules";
import {
  createCustomAchievement,
  deleteCustomAchievement,
} from "@/services/achievementService";
import { overrideSighting, removePlayer, resyncAllScores } from "@/services/gameService";
import { saveRarityLimits } from "@/services/settingsService";
import type { Rarity } from "@/types";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Host Dashboard — WildQuest" },
      {
        name: "description",
        content:
          "Review flagged sightings, override AI decisions, manage trackers and tune species scoring limits for your game.",
      },
      { property: "og:title", content: "Host Dashboard — WildQuest" },
      {
        property: "og:description",
        content: "Keep your WildQuest safari fair: review flags, override AI calls and set scoring limits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const state = useGameSession();
  const [limits, setLimits] = useState<RarityLimits | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    icon: "🏅",
    points: 150,
    rarity: "" as "" | Rarity,
    species: [] as string[],
    requiredCount: "" as string,
  });
  const [addingAchievement, setAddingAchievement] = useState(false);

  async function addAchievement() {
    if (!state.session) return;
    if (!draft.name.trim()) {
      toast.error("Give the achievement a name");
      return;
    }
    setAddingAchievement(true);
    try {
      await createCustomAchievement({
        gameId: state.session.gameId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        icon: draft.icon.trim() || "🏅",
        points: Math.max(0, Number(draft.points) || 0),
        rarity: draft.rarity === "" ? null : draft.rarity,
        species: draft.species,
        requiredCount: draft.requiredCount === "" ? null : Math.max(1, Number(draft.requiredCount)),
      });
      setDraft({
        name: "",
        description: "",
        icon: "🏅",
        points: 150,
        rarity: "",
        species: [],
        requiredCount: "",
      });
      await resyncAllScores(state.session.gameId);
      toast.success("Achievement added for everyone");
      state.refresh();
    } catch {
      toast.error("Could not add that achievement");
    } finally {
      setAddingAchievement(false);
    }
  }

  async function removeAchievement(id: string, name: string) {
    if (!state.session) return;
    if (!window.confirm(`Remove the "${name}" achievement?`)) return;
    try {
      await deleteCustomAchievement(id);
      await resyncAllScores(state.session.gameId);
      toast.success("Achievement removed");
      state.refresh();
    } catch {
      toast.error("Could not remove that achievement");
    }
  }

  useEffect(() => {
    if (state.ready && !state.session) navigate({ to: "/" });
  }, [state.ready, state.session, navigate]);

  if (state.ready && state.session && !state.isHost) {
    return (
      <ScreenShell title="Host Dashboard" online={state.online} pendingCount={state.pendingCount}>
        <div className="surface mt-6 p-6 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Only the game host can review sightings and change scoring.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate({ to: "/game" })}>
            Back to dashboard
          </Button>
        </div>
      </ScreenShell>
    );
  }

  const shown = limits ?? state.rarityLimits;

  async function decide(sightingId: string, playerId: string, status: "verified" | "rejected") {
    if (!state.session) return;
    try {
      await overrideSighting({
        sightingId,
        playerId,
        gameId: state.session.gameId,
        status,
        reason: status === "verified" ? null : "Rejected by the host after review",
      });
      toast.success(status === "verified" ? "Sighting approved" : "Sighting rejected");
      state.refresh();
    } catch {
      toast.error("Could not update that sighting");
    }
  }

  async function persistLimits() {
    if (!state.session || !limits) return;
    setSaving(true);
    try {
      await saveRarityLimits(state.session.gameId, limits);
      setLimits(null);
      await resyncAllScores(state.session.gameId);
      toast.success("Scoring limits updated for everyone");
      state.refresh();
    } catch {
      toast.error("Could not save the scoring limits");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell
      title="Host Dashboard"
      subtitle={`${state.flaggedSightings.length} to review · ${state.players.length} trackers`}
      online={state.online}
      pendingCount={state.pendingCount}
    >
      <section>
        <h2 className="display flex items-center gap-2 text-xl tracking-wide">
          <ShieldAlert className="size-5 text-primary" /> Flagged sightings
        </h2>
        <ul className="mt-2 space-y-2">
          {state.flaggedSightings.map((sighting) => {
            const player = state.players.find((p) => p.id === sighting.player_id);
            return (
              <li key={sighting.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {sighting.animal_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player?.name ?? "Unknown tracker"} · {sighting.rarity} · {sighting.points} pts
                    </p>
                  </div>
                  <StatusBadge status={sighting.verification_status} />
                </div>

                <div className="mt-3">
                  <SightingPhoto
                    path={sighting.image_path}
                    alt={`Photo submitted for ${sighting.animal_name}`}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Tap the photo to open it full size.
                  </p>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    <dt className="font-semibold text-foreground">AI species</dt>
                    <dd>{sighting.ai_species ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Confidence</dt>
                    <dd>{sighting.ai_confidence != null ? `${sighting.ai_confidence}%` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">GPS</dt>
                    <dd>
                      {sighting.latitude != null && sighting.longitude != null
                        ? `${sighting.latitude.toFixed(3)}, ${sighting.longitude.toFixed(3)} (±${Math.round(sighting.gps_accuracy ?? 0)}m)`
                        : "none"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Captured</dt>
                    <dd>
                      {sighting.captured_at
                        ? new Date(sighting.captured_at).toLocaleTimeString()
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {sighting.flags.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {sighting.flags.map((flag) => (
                      <li
                        key={flag}
                        className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive"
                      >
                        {flag.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {sighting.ai_verdict ? (
                  <p className="mt-2 text-[11px] italic text-muted-foreground">
                    AI: {sighting.ai_verdict}
                  </p>
                ) : null}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void decide(sighting.id, sighting.player_id, "verified")}
                  >
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void decide(sighting.id, sighting.player_id, "rejected")}
                  >
                    <XCircle className="size-4" /> Reject
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        {state.flaggedSightings.length === 0 ? (
          <p className="surface mt-2 p-4 text-center text-sm text-muted-foreground">
            Nothing needs review — every sighting passed or failed cleanly.
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="display flex items-center gap-2 text-xl tracking-wide">
          <Sliders className="size-5 text-primary" /> Scoring limits
        </h2>
        <div className="surface mt-2 p-4">
          <p className="text-xs text-muted-foreground">
            How many verified sightings of the same species earn points. Leave blank for unlimited.
          </p>
          <div className="mt-3 space-y-2">
            {RARITY_ORDER.map((rarity: Rarity) => (
              <label key={rarity} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{rarity}</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={shown[rarity] ?? ""}
                  placeholder="∞"
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next = raw === "" ? null : Math.max(1, Number(raw));
                    setLimits({ ...shown, [rarity]: Number.isFinite(next as number) ? next : null });
                  }}
                  className="w-24 rounded-xl border border-border bg-input px-3 py-2 text-right text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </label>
            ))}
          </div>
          <Button className="mt-4" onClick={() => void persistLimits()} disabled={saving}>
            {saving ? "Saving…" : "Save & recalculate scores"}
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="display flex items-center gap-2 text-xl tracking-wide">
          <UserMinus className="size-5 text-primary" /> Trackers
        </h2>
        <ul className="mt-2 space-y-2">
          {state.players.map((player) => (
            <li key={player.id} className="surface flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {player.name}
                  {player.is_host ? " · host" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.groups.find((g) => g.id === player.group_id)?.name ?? "No group"} ·{" "}
                  {player.score} pts
                </p>
              </div>
              {player.is_host ? null : (
                <button
                  aria-label={`Remove ${player.name}`}
                  onClick={() => {
                    if (!window.confirm(`Remove ${player.name} from the game?`)) return;
                    removePlayer(player.id)
                      .then(() => {
                        toast.success(`${player.name} removed`);
                        state.refresh();
                      })
                      .catch(() => toast.error("Could not remove that player"));
                  }}
                  className="grid size-9 place-items-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </ScreenShell>
  );
}
