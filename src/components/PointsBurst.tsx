import { AnimatePresence, motion } from "framer-motion";
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
          <motion.span
            aria-hidden
            initial={{ scale: 0.3, rotate: -12 }}
            animate={{ scale: legendary ? 1.5 : 1.2, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 12 }}
            className="text-8xl"
          >
            {animal.image}
          </motion.span>

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
