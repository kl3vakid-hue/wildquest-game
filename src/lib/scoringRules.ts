import { RARITY_ORDER } from "@/data/animals";
import type { Rarity, Sighting } from "@/types";
import { countsForScore } from "./verificationRules";

/**
 * How many verified sightings of the SAME species may earn points, per rarity.
 * `null` means unlimited. Hosts can change these per game from the admin
 * dashboard, so no code change is needed to rebalance a safari.
 */
export type RarityLimits = Record<Rarity, number | null>;

export const DEFAULT_RARITY_LIMITS: RarityLimits = {
  Common: 3,
  Uncommon: 5,
  Rare: null,
  "Very Rare": null,
  Legendary: null,
};

export function normalizeLimits(raw: unknown): RarityLimits {
  const source = (raw ?? {}) as Record<string, unknown>;
  const limits = { ...DEFAULT_RARITY_LIMITS };
  for (const rarity of RARITY_ORDER) {
    const value = source[rarity];
    if (value === null) limits[rarity] = null;
    else if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      limits[rarity] = Math.floor(value);
    }
  }
  return limits;
}

export function limitFor(limits: RarityLimits, rarity: Rarity | string): number | null {
  return limits[rarity as Rarity] ?? null;
}

export interface ScoredSighting {
  sighting: Sighting;
  /** Points this sighting actually contributes after species limits. */
  awarded: number;
  /** 1-based position of this sighting within its species. */
  index: number;
  cappedOut: boolean;
}

/**
 * Applies the per-species rarity limits to a player's sightings. Oldest
 * verified sightings of a species count first, so limits are never retroactive.
 */
export function scoreSightings(
  sightings: Sighting[],
  limits: RarityLimits,
): { total: number; scored: ScoredSighting[] } {
  const ordered = [...sightings].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const counts = new Map<string, number>();
  const scored: ScoredSighting[] = [];
  let total = 0;

  for (const sighting of ordered) {
    if (!countsForScore(sighting.verification_status)) {
      scored.push({ sighting, awarded: 0, index: 0, cappedOut: false });
      continue;
    }
    const index = (counts.get(sighting.animal_id) ?? 0) + 1;
    counts.set(sighting.animal_id, index);
    const limit = limitFor(limits, sighting.rarity);
    const cappedOut = limit != null && index > limit;
    const awarded = cappedOut ? 0 : sighting.points;
    total += awarded;
    scored.push({ sighting, awarded, index, cappedOut });
  }

  return { total, scored };
}

export interface SpeciesProgress {
  animalId: string;
  animalName: string;
  rarity: Rarity;
  verified: number;
  limit: number | null;
  points: number;
  full: boolean;
}

/** Per-species scoring progress for the progress screen. */
export function speciesProgress(
  sightings: Sighting[],
  limits: RarityLimits,
): SpeciesProgress[] {
  const { scored } = scoreSightings(sightings, limits);
  const map = new Map<string, SpeciesProgress>();

  for (const entry of scored) {
    if (!countsForScore(entry.sighting.verification_status)) continue;
    const key = entry.sighting.animal_id;
    const rarity = (entry.sighting.rarity as Rarity) ?? "Common";
    const existing = map.get(key);
    if (existing) {
      existing.verified += 1;
      existing.points += entry.awarded;
      existing.full = existing.limit != null && existing.verified >= existing.limit;
      continue;
    }
    const limit = limitFor(limits, rarity);
    map.set(key, {
      animalId: key,
      animalName: entry.sighting.animal_name,
      rarity,
      verified: 1,
      limit,
      points: entry.awarded,
      full: limit != null && 1 >= limit,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
      a.animalName.localeCompare(b.animalName),
  );
}
