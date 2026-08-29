import type { Rarity } from "@/types";

/** Lifecycle of a sighting from submission to a final fair decision. */
export type VerificationStatus =
  | "pending"
  | "verified"
  | "needs_community"
  | "rejected";

export const VERIFY_THRESHOLD = 85;
export const REVIEW_THRESHOLD = 60;
/** GPS readings looser than this (metres) are treated as weak evidence. */
export const GPS_ACCURACY_LIMIT = 300;
/** A photo must have been captured within this many minutes of submission. */
export const CAPTURE_FRESHNESS_MINUTES = 30;

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Pending AI review",
  verified: "Verified",
  needs_community: "Needs community verification",
  rejected: "Rejected",
};

export const STATUS_HINT: Record<VerificationStatus, string> = {
  pending: "Waiting for signal — your photo will be checked when you reconnect.",
  verified: "AI confirmed the species. Points count towards the leaderboard.",
  needs_community:
    "The evidence was not strong enough on its own. Your group can confirm this sighting.",
  rejected: "This sighting did not pass verification, so it earns no points.",
};

export interface VerifyChecks {
  speciesMatch: boolean;
  confidence: number | null;
  hasGps: boolean;
  gpsAccuracy: number | null;
  accuracyOk: boolean;
  timestampFresh: boolean;
  locationPlausible: boolean;
  duplicatePhoto: boolean;
  fromCamera: boolean;
}

export interface VerifyDecision {
  status: VerificationStatus;
  flags: string[];
  reason: string | null;
}

/**
 * The single source of truth for how the anti-cheat layers combine into a
 * status. Runs on the server so a client cannot promote its own sighting.
 */
export function decideVerification(checks: VerifyChecks): VerifyDecision {
  const flags: string[] = [];
  if (checks.duplicatePhoto) flags.push("duplicate_photo");
  if (!checks.fromCamera) flags.push("not_live_capture");
  if (!checks.speciesMatch) flags.push("species_mismatch");
  if (!checks.hasGps) flags.push("no_gps");
  else if (!checks.accuracyOk) flags.push("weak_gps_accuracy");
  if (!checks.timestampFresh) flags.push("stale_timestamp");
  if (!checks.locationPlausible) flags.push("species_out_of_range");
  if ((checks.confidence ?? 0) < REVIEW_THRESHOLD) flags.push("low_confidence");

  if (checks.duplicatePhoto) {
    return {
      status: "rejected",
      flags,
      reason: "This photo has already been used for a sighting in this game.",
    };
  }
  if (!checks.fromCamera) {
    return {
      status: "rejected",
      flags,
      reason: "Only live camera photos can be submitted — gallery uploads are not allowed.",
    };
  }
  if (!checks.speciesMatch) {
    return {
      status: "rejected",
      flags,
      reason: "The photo does not appear to show the species you claimed.",
    };
  }
  if ((checks.confidence ?? 0) < REVIEW_THRESHOLD) {
    return {
      status: "needs_community",
      flags,
      reason: "The AI was not confident enough about this species.",
    };
  }

  const strong =
    (checks.confidence ?? 0) >= VERIFY_THRESHOLD &&
    checks.hasGps &&
    checks.accuracyOk &&
    checks.timestampFresh &&
    checks.locationPlausible;

  if (strong) return { status: "verified", flags, reason: null };

  return {
    status: "needs_community",
    flags,
    reason: !checks.hasGps
      ? "No location was available, so your group needs to confirm this sighting."
      : "Some checks were inconclusive, so your group needs to confirm this sighting.",
  };
}

/** Only verified sightings ever contribute to scores and leaderboards. */
export function countsForScore(status: string | null | undefined): boolean {
  return status === "verified";
}

export const RARITY_DIFFICULTY: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.1,
  Rare: 1.2,
  "Very Rare": 1.3,
  Legendary: 1.4,
};
