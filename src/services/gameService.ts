import { db as supabase } from "@/lib/db";
import { achievementBonus } from "@/lib/achievements";
import { scoreSightings } from "@/lib/scoringRules";
import { countsForScore, type VerificationStatus } from "@/lib/verificationRules";
import { fetchCustomAchievements, toAchievement } from "@/services/achievementService";
import { fetchRarityLimits } from "@/services/settingsService";
import type { Game, Group, Player, Rarity, Sighting } from "@/types";
import { generateGameCode } from "@/utils/format";

/** Creates a game with its first group and the host player. */
export async function createGame(input: {
  playerName: string;
  groupName: string;
  gameName: string;
  deviceId: string;
}): Promise<{ game: Game; player: Player; group: Group }> {
  let game: Game | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5 && !game; attempt += 1) {
    const { data, error } = await supabase
      .from("games")
      .insert({ code: generateGameCode(), name: input.gameName, status: "lobby" })
      .select()
      .single();
    if (error) {
      lastError = error;
      continue;
    }
    game = data as Game;
  }
  if (!game) throw lastError ?? new Error("Could not create the game");

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ game_id: game.id, name: input.groupName })
    .select()
    .single();
  if (groupError) throw groupError;

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      game_id: game.id,
      group_id: group.id,
      name: input.playerName,
      device_id: input.deviceId,
      is_host: true,
      is_ready: true,
    })
    .select()
    .single();
  if (playerError) throw playerError;

  const { data: updated, error: updateError } = await supabase
    .from("games")
    .update({ host_player_id: player.id })
    .eq("id", game.id)
    .select()
    .single();
  if (updateError) throw updateError;

  return { game: updated as Game, player: player as Player, group: group as Group };
}

/** Joins an existing game by code, creating the group if it does not exist yet. */
export async function joinGame(input: {
  playerName: string;
  code: string;
  groupName: string;
  deviceId: string;
}): Promise<{ game: Game; player: Player }> {
  const code = input.code.trim().toUpperCase();
  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!game) throw new Error("No game found with that code");
  if (game.status === "ended") throw new Error("That game has already finished");

  const wantedGroup = input.groupName.trim() || "Solo Trackers";

  // The player row is created first: group creation is only allowed for people
  // who are already part of the game.
  const { data: existing } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game.id)
    .eq("device_id", input.deviceId)
    .maybeSingle();

  let player = existing as Player | null;
  if (!player) {
    const { data: created, error: playerError } = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name: input.playerName,
        device_id: input.deviceId,
      })
      .select()
      .single();
    if (playerError) throw playerError;
    player = created as Player;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("game_id", game.id);
  if (groupsError) throw groupsError;

  let group = (groups ?? []).find(
    (g) => g.name.toLowerCase() === wantedGroup.toLowerCase(),
  );
  if (!group) {
    const { data: created, error: createError } = await supabase
      .from("groups")
      .insert({ game_id: game.id, name: wantedGroup })
      .select()
      .single();
    if (createError) throw createError;
    group = created;
  }

  const { data: updated, error: updateError } = await supabase
    .from("players")
    .update({ name: input.playerName, group_id: group.id })
    .eq("id", player.id)
    .select()
    .single();
  if (updateError) throw updateError;

  return { game: game as Game, player: updated as Player };
}

export async function fetchGame(gameId: string): Promise<Game> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (error) throw error;
  return data as Game;
}

export async function fetchGroups(gameId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Group[];
}

export async function fetchPlayers(gameId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function fetchSightings(gameId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sighting[];
}

export async function recordSighting(input: {
  gameId: string;
  playerId: string;
  animalId: string;
  animalName: string;
  rarity: Rarity;
  points: number;
  createdAt?: string;
  verificationStatus?: VerificationStatus;
  source?: string;
  deviceId?: string;
  aiConfidence?: number | null;
  aiSpecies?: string | null;
  imagePath?: string | null;
}): Promise<void> {
  const status = input.verificationStatus ?? "verified";
  const { error } = await supabase.from("sightings").insert({
    game_id: input.gameId,
    player_id: input.playerId,
    animal_id: input.animalId,
    animal_name: input.animalName,
    rarity: input.rarity,
    points: input.points,
    verification_status: status,
    source: input.source ?? "camera",
    device_id: input.deviceId ?? null,
    ai_confidence: input.aiConfidence ?? null,
    ai_species: input.aiSpecies ?? null,
    image_path: input.imagePath ?? null,
    verified_at: status === "verified" ? new Date().toISOString() : null,
    ...(input.createdAt ? { created_at: input.createdAt } : {}),
  });
  if (error) throw error;
  await syncPlayerScore(input.playerId, input.gameId);
}

/**
 * Recomputes a player's score from VERIFIED sightings only, applying the
 * game's per-species rarity limits, then adds achievement bonus points.
 */
export async function syncPlayerScore(playerId: string, gameId: string): Promise<void> {
  const [{ data, error }, limits, customRows] = await Promise.all([
    supabase
      .from("sightings")
      .select("*")
      .eq("game_id", gameId)
      .eq("player_id", playerId),
    fetchRarityLimits(gameId),
    fetchCustomAchievements(gameId).catch(() => []),
  ]);
  if (error) throw error;
  const sightings = (data ?? []) as Sighting[];
  const { total } = scoreSightings(sightings, limits);
  const verifiedIds = new Set(
    sightings.filter((s) => countsForScore(s.verification_status)).map((s) => s.animal_id),
  );
  const bonus = achievementBonus(verifiedIds, customRows.map(toAchievement));
  const { error: updateError } = await supabase
    .from("players")
    .update({ score: total + bonus })
    .eq("id", playerId);
  if (updateError) throw updateError;
}

/** Host override of an AI decision from the admin dashboard. */
export async function overrideSighting(input: {
  sightingId: string;
  playerId: string;
  gameId: string;
  status: VerificationStatus;
  reason?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from("sightings")
    .update({
      verification_status: input.status,
      reject_reason: input.reason ?? (input.status === "verified" ? null : "Overridden by the host"),
      verified_at: input.status === "verified" ? new Date().toISOString() : null,
      ...(input.status === "verified" ? { flags: [] } : {}),
    })
    .eq("id", input.sightingId);
  if (error) throw error;
  await syncPlayerScore(input.playerId, input.gameId);
}

/** Recomputes every player's score, e.g. after the host changes the limits. */
export async function resyncAllScores(gameId: string): Promise<void> {
  const players = await fetchPlayers(gameId);
  for (const player of players) {
    await syncPlayerScore(player.id, gameId);
  }
}

export async function setReady(playerId: string, ready: boolean): Promise<void> {
  const { error } = await supabase
    .from("players")
    .update({ is_ready: ready })
    .eq("id", playerId);
  if (error) throw error;
}

export async function startGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ status: "active" })
    .eq("id", gameId);
  if (error) throw error;
}

export async function endGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", gameId);
  if (error) throw error;
}

export async function removePlayer(playerId: string): Promise<void> {
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw error;
}
