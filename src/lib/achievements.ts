import { ANIMALS } from "@/data/animals";
import type { Rarity } from "@/types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Bonus points awarded to the tracker (and their group) on unlock. */
  points: number;
  /** Species ids required, or null when the goal is a count. */
  species?: string[];
  /** Number of verified species of a rarity required. */
  rarity?: Rarity;
  count?: number;
  /** True for achievements the host created for this game. */
  custom?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [

  {
    id: "big-five",
    name: "The Big Five",
    description: "Lion, leopard, elephant, buffalo and rhino — all verified.",
    icon: "🏆",
    species: ["lion", "leopard", "elephant", "buffalo", "white-rhino"],
  },
  {
    id: "cats",
    name: "Cat Tracker",
    description: "Spot every wild cat: lion, leopard, cheetah, caracal and serval.",
    icon: "🐆",
    species: ["lion", "leopard", "cheetah", "caracal", "serval"],
  },
  {
    id: "night-shift",
    name: "Night Shift",
    description: "Find the elusive nocturnals: aardvark, pangolin, porcupine and honey badger.",
    icon: "🌙",
    species: ["aardvark", "pangolin", "porcupine", "honey-badger"],
  },
  {
    id: "antelope",
    name: "Antelope Expert",
    description: "Verify five different antelope species.",
    icon: "🦌",
    species: ["kudu", "impala", "nyala", "eland", "sable", "roan", "bushbuck", "duiker", "waterbuck", "klipspringer"],
    count: 5,
  },
  {
    id: "legend-hunter",
    name: "Legend Hunter",
    description: "Verify two Legendary species.",
    icon: "✨",
    rarity: "Legendary",
    count: 2,
  },
  {
    id: "rare-collector",
    name: "Rare Collector",
    description: "Verify four Rare species.",
    icon: "💎",
    rarity: "Rare",
    count: 4,
  },
  {
    id: "curator",
    name: "Curator",
    description: "Verify 15 different species in one game.",
    icon: "📚",
    count: 15,
  },
];

export interface AchievementProgress {
  achievement: Achievement;
  have: number;
  need: number;
  unlocked: boolean;
  /** Species still missing, when the goal is a named set. */
  missing: string[];
}

export function achievementProgress(verifiedIds: Set<string>): AchievementProgress[] {
  return ACHIEVEMENTS.map((achievement) => {
    if (achievement.species) {
      const owned = achievement.species.filter((id) => verifiedIds.has(id));
      const need = achievement.count ?? achievement.species.length;
      return {
        achievement,
        have: owned.length,
        need,
        unlocked: owned.length >= need,
        missing: achievement.species
          .filter((id) => !verifiedIds.has(id))
          .map((id) => ANIMALS.find((a) => a.id === id)?.name ?? id),
      };
    }

    if (achievement.rarity) {
      const owned = ANIMALS.filter(
        (a) => a.rarity === achievement.rarity && verifiedIds.has(a.id),
      ).length;
      const need = achievement.count ?? 1;
      return { achievement, have: owned, need, unlocked: owned >= need, missing: [] };
    }

    const need = achievement.count ?? 1;
    const have = verifiedIds.size;
    return { achievement, have, need, unlocked: have >= need, missing: [] };
  });
}
