import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Binoculars, PlusCircle, UserRound } from "lucide-react";
import heroImage from "@/assets/hero-savanna.jpg";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WildQuest — Turn Your Game Drive Into a Competition" },
      {
        name: "description",
        content:
          "WildQuest is a multiplayer wildlife spotting game for South African game reserves. Create a group, log sightings and climb the leaderboard.",
      },
      { property: "og:title", content: "WildQuest — Wildlife Spotting Game" },
      {
        property: "og:description",
        content:
          "Log Big Five sightings, earn points by rarity and compete with your group on live leaderboards.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={heroImage}
        alt="Acacia tree, elephant and giraffe silhouetted against a golden African sunset"
        width={1280}
        height={1600}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-end px-5 pb-12 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="display text-sm tracking-[0.35em] text-primary">
            SOUTH AFRICAN WILDLIFE
          </p>
          <h1 className="display mt-2 text-6xl leading-none text-gold-gradient">
            WILDQUEST
          </h1>
          <p className="mt-3 max-w-xs text-base text-foreground/80">
            Turn your game drive into a competition.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 space-y-3"
        >
          <Button onClick={() => navigate({ to: "/create" })}>
            <PlusCircle className="size-5" /> Create Game
          </Button>
          <Button variant="secondary" onClick={() => navigate({ to: "/join" })}>
            <Binoculars className="size-5" /> Join Game
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/profile" })}>
            <UserRound className="size-5" /> My Profile
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
