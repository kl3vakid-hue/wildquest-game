import { AnimatePresence, motion } from "framer-motion";
import { ANIMAL_PHOTOS } from "@/data/animalPhotos";
import type { Animal } from "@/types";

interface PointsBurstProps {
  animal: Animal | null;
}

/** Celebration overlay shown right after a sighting is recorded. */
export function PointsBurst({ animal }: PointsBurstProps) {
  const legendary = animal?.rarity === "Legendary";
  const rare =
    animal?.rarity === "Rare" || animal?.rarity === "Very Rare" || legendary;

  return (
    <AnimatePresence>
      {animal ? (
        <motion.div
          key={animal.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 12 }}
            className={`overflow-hidden rounded-full border-4 shadow-2xl ${
              legendary ? "size-44 border-legendary/70" : "size-36 border-primary/60"
            }`}
          >
            {ANIMAL_PHOTOS[animal.id] ? (
              <img
                src={ANIMAL_PHOTOS[animal.id]}
                alt={animal.name}
                className="size-full object-cover"
              />
            ) : (
              <span aria-hidden className="grid size-full place-items-center bg-secondary text-7xl">
                {animal.image}
              </span>
            )}
          </motion.div>

          <motion.p
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="display mt-6 text-5xl text-gold-gradient"
          >
            +{animal.points} XP
          </motion.p>

          {rare ? (
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
              className="display mt-2 text-2xl text-primary"
            >
              {legendary ? "★ LEGENDARY DISCOVERY! ★" : "RARE DISCOVERY!"}
            </motion.p>
          ) : null}

          <p className="mt-2 text-sm text-muted-foreground">{animal.name} logged</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
