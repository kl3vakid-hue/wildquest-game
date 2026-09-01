import type { Sighting } from "@/types";

export interface Reputation {
  score: number;
  tier: "Trusted Guide" | "Reliable Tracker" | "Building Trust" | "Under Review";
  verified: number;
  rejected: number;
  flagged: number;
  submissions: number;
}

/**
 * Reputation rewards clean, verified submissions and penalises rejected or
 * flagged ones. It starts neutral (70) so a new tracker is not punished.
 */
export function reputationFor(sightings: Sighting[]): Reputation {
  const submissions = sightings.length;
  const verified = sightings.filter((s) => s.verification_status === "verified").length;
  const rejected = sightings.filter((s) => s.verification_status === "rejected").length;
  const flagged = sightings.filter((s) => (s.flags ?? []).length > 0).length;

  const raw = 70 + verified * 4 - rejected * 12 - Math.max(0, flagged - rejected) * 3;
  const score = Math.max(0, Math.min(100, Math.round(submissions === 0 ? 70 : raw)));

  const tier: Reputation["tier"] =
    score >= 90
      ? "Trusted Guide"
      : score >= 70
        ? "Reliable Tracker"
        : score >= 45
          ? "Building Trust"
          : "Under Review";

  return { score, tier, verified, rejected, flagged, submissions };
}
