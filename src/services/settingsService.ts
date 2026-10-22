import { db as supabase } from "@/lib/db";
import type { PlayMode } from "@/types";
import { DEFAULT_RARITY_LIMITS, normalizeLimits, type RarityLimits } from "@/lib/scoringRules";

/** Reads the per-game scoring limits, falling back to the defaults. */
export async function fetchRarityLimits(gameId: string): Promise<RarityLimits> {
  const { data, error } = await supabase
    .from("game_settings")
    .select("rarity_limits")
    .eq("game_id", gameId)
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_RARITY_LIMITS };
  return normalizeLimits(data.rarity_limits);
}

/** Host-only: stores new per-species limits for this game. */
export async function saveRarityLimits(
  gameId: string,
  limits: RarityLimits,
): Promise<RarityLimits> {
  const { data, error } = await supabase
    .from("game_settings")
    .upsert(
      { game_id: gameId, rarity_limits: limits as unknown as Record<string, number | null> },
      { onConflict: "game_id" },
    )
    .select("rarity_limits")
    .single();
  if (error) throw error;
  return normalizeLimits(data.rarity_limits);
}

/** Host-only: switches the game between individual scoring and team (group) scoring. */
export async function setPlayMode(gameId: string, mode: PlayMode): Promise<void> {
  const { error } = await supabase.from("games").update({ play_mode: mode }).eq("id", gameId);
  if (error) throw error;
}
