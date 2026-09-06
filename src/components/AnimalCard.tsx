import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { RARITY_RING, RARITY_TOKEN } from "@/data/animals";
import { ANIMAL_PHOTOS } from "@/data/animalPhotos";
import type { Animal } from "@/types";
import { cn } from "@/lib/utils";

interface AnimalCardProps {
  animal: Animal;
  spotted: boolean;
  /** Collection mode shows unspotted animals as dark silhouettes. */
  mode?: "spot" | "collection";
  /** How many times this player has logged this species (spot mode badge). */
  spottedCount?: number;
  /** How many logged sightings of this species can still earn points, null = unlimited. */
  limit?: number | null;
  /** Overrides the built-in photo, e.g. the user's own AI-identified photo. */
  photoUrl?: string | undefined;
  onSelect?: (animal: Animal) => void;
}

export function AnimalCard({
  animal,
  spotted,
  mode = "spot",
  spottedCount,
  limit,
  photoUrl,
  onSelect,
}: AnimalCardProps) {
  const locked = mode === "collection" && !spotted;
  const count = spottedCount ?? (spotted ? 1 : 0);
  // A species can be logged again until the host's per-rarity limit is reached.
  const atLimit = limit != null && count >= limit;
  const disabled = mode === "spot" && atLimit;
  const photo = photoUrl ?? ANIMAL_PHOTOS[animal.id];

  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      onClick={() => !disabled && onSelect?.(animal)}
      disabled={disabled || mode === "collection"}
      className={cn(
        "surface relative flex aspect-[3/4] w-full flex-col overflow-hidden border-2 text-center transition-opacity",
        RARITY_RING[animal.rarity],
        disabled && "opacity-60",
        mode === "collection" && "cursor-default",
      )}
    >
      <div className="relative h-[58%] w-full overflow-hidden bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt={locked ? "Undiscovered species" : animal.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "size-full object-cover transition-all duration-300",
              locked && "brightness-[0.15] grayscale contrast-200",
            )}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "flex size-full items-center justify-center text-4xl",
              locked && "brightness-0 opacity-35 grayscale",
            )}
          >
            {animal.image}
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-1.5 pb-1.5">
        <span className="text-xs font-semibold leading-tight">{locked ? "?" : animal.name}</span>
        <span className="text-[11px] font-bold text-primary">{animal.points} pts</span>
        <span className={cn("text-[10px] uppercase tracking-wide", RARITY_TOKEN[animal.rarity])}>
          {animal.rarity}
        </span>
      </div>

      {spotted ? (
        <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">
          <Check className="size-3" />
          {mode === "spot" && count > 0
            ? limit != null
              ? `${count}/${limit}`
              : `${count}×`
            : "Spotted"}
        </span>
      ) : null}
      {locked ? (
        <Lock className="absolute right-1.5 top-1.5 size-3.5 text-muted-foreground" />
      ) : null}
    </motion.button>
  );
}
