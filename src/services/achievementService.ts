import { supabase } from "@/integrations/supabase/client";
import type { Achievement } from "@/lib/achievements";
import type { Rarity } from "@/types";

export interface CustomAchievementRow {
  id: string;
  game_id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string | null;
  species: string[];
  required_count: number | null;
  created_at: string;
}

export function toAchievement(row: CustomAchievementRow): Achievement {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon || "🏅",
    points: row.points,
    ...(row.species.length ? { species: row.species } : {}),
    ...(row.rarity ? { rarity: row.rarity as Rarity } : {}),
    ...(row.required_count != null ? { count: row.required_count } : {}),
    custom: true,
  };
}

/** Achievements the host created for this game, on top of the built-in set. */
export async function fetchCustomAchievements(gameId: string): Promise<CustomAchievementRow[]> {
  const { data, error } = await supabase
    .from("game_achievements")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as CustomAchievementRow[];
}

export async function createCustomAchievement(input: {
  gameId: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: Rarity | null;
  species: string[];
  requiredCount: number | null;
}): Promise<void> {
  const { error } = await supabase.from("game_achievements").insert({
    game_id: input.gameId,
    name: input.name,
    description: input.description,
    icon: input.icon || "🏅",
    points: input.points,
    rarity: input.rarity,
    species: input.species,
    required_count: input.requiredCount,
  });
  if (error) throw error;
}

export async function deleteCustomAchievement(id: string): Promise<void> {
  const { error } = await supabase.from("game_achievements").delete().eq("id", id);
  if (error) throw error;
}
