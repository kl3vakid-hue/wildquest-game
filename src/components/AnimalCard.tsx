import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { RARITY_RING, RARITY_TOKEN } from "@/data/animals";
import type { Animal } from "@/types";
import { cn } from "@/lib/utils";

interface AnimalCardProps {
  animal: Animal;
  spotted: boolean;
  /** Collection mode shows unspotted animals as dark silhouettes. */
  mode?: "spot" | "collection";
  onSelect?: (animal: Animal) => void;
}

export function AnimalCard({ animal, spotted, mode = "spot", onSelect }: AnimalCardProps) {
  const locked = mode === "collection" && !spotted;
  const disabled = mode === "spot" && spotted && !animal.repeatable;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      onClick={() => !disabled && onSelect?.(animal)}
      disabled={disabled || mode === "collection"}
      className={cn(
        "surface relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 border-2 p-2 text-center transition-opacity",
        RARITY_RING[animal.rarity],
        disabled && "opacity-60",
        mode === "collection" && "cursor-default",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "text-5xl transition-all",
          locked && "brightness-0 opacity-35 grayscale",
        )}
      >
        {animal.image}
      </span>
      <span className="mt-1 text-xs font-semibold leading-tight">
        {locked ? "?" : animal.name}
      </span>
      <span className="text-[11px] font-bold text-primary">{animal.points} pts</span>
      <span className={cn("text-[10px] uppercase tracking-wide", RARITY_TOKEN[animal.rarity])}>
        {animal.rarity}
      </span>

      {spotted ? (
        <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">
          <Check className="size-3" /> Spotted
        </span>
      ) : null}
      {locked ? (
        <Lock className="absolute right-1.5 top-1.5 size-3.5 text-muted-foreground" />
      ) : null}
    </motion.button>
  );
}
