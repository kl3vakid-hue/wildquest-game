import type { Rarity } from "@/types";

/**
 * Animals identified by the AI camera are not part of the curated 35-species
 * list, so their sightings use a prefixed id and a fixed rarity/points band.
 */
export const AI_ANIMAL_PREFIX = "ai-";
export const AI_ANIMAL_RARITY: Rarity = "Uncommon";
export const AI_ANIMAL_POINTS = 50;

export function aiAnimalId(name: string): string {
  return (
    AI_ANIMAL_PREFIX +
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function isAiAnimalId(id: string): boolean {
  return id.startsWith(AI_ANIMAL_PREFIX);
}
