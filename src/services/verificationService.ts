import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { verifySighting } from "@/lib/verify.functions";
import type { VerificationOutcome } from "@/lib/verify.functions";
import type { VerificationStatus } from "@/lib/verificationRules";
import { syncPlayerScore } from "@/services/gameService";
import type { CapturedPhoto, GeoFix } from "@/services/capture";
import { PHOTO_BUCKET } from "@/services/identifyService";
import type { QueuedSighting, Rarity } from "@/types";

export interface SubmitInput {
  gameId: string;
  playerId: string;
  deviceId: string;
  animalId: string;
  animalName: string;
  rarity: Rarity;
  points: number;
  photo: CapturedPhoto;
  geo: GeoFix | null;
  offline?: boolean;
}

export interface SubmitResult {
  status: VerificationStatus;
  reason: string | null;
  outcome: VerificationOutcome;
  pointsAwarded: number;
}

async function uploadSightingPhoto(blob: Blob, deviceId: string): Promise<string | null> {
  const path = `${deviceId}/sightings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  return error ? null : path;
}

/**
 * Runs the full verification pipeline for a claimed sighting: AI species check,
 * anti-cheat layers, then persists the sighting plus its complete audit trail.
 * Points are only awarded when the AI verdict is "verified".
 */
export async function submitSighting(input: SubmitInput): Promise<SubmitResult> {
  const outcome = await verifySighting({
    data: {
      imageDataUrl: input.photo.dataUrl,
      gameId: input.gameId,
      claimedAnimalName: input.animalName,
      imageHash: input.photo.hash,
      fromCamera: input.photo.fromCamera,
      capturedAt: input.photo.capturedAt,
      latitude: input.geo?.latitude ?? null,
      longitude: input.geo?.longitude ?? null,
      gpsAccuracy: input.geo?.accuracy ?? null,
      offline: input.offline ?? false,
    },
  });

  const imagePath = await uploadSightingPhoto(input.photo.blob, input.deviceId);
  const pointsAwarded = outcome.status === "verified" ? input.points : 0;

  const { data: sighting, error } = await supabase
    .from("sightings")
    .insert({
      game_id: input.gameId,
      player_id: input.playerId,
      animal_id: input.animalId,
      animal_name: input.animalName,
      rarity: input.rarity,
      points: input.points,
      verification_status: outcome.status,
      ai_species: outcome.aiSpecies,
      ai_confidence: outcome.aiConfidence,
      ai_verdict: outcome.aiVerdict,
      image_path: imagePath,
      image_hash: input.photo.hash,
      latitude: input.geo?.latitude ?? null,
      longitude: input.geo?.longitude ?? null,
      gps_accuracy: input.geo?.accuracy ?? null,
      captured_at: input.photo.capturedAt,
      device_id: input.deviceId,
      flags: outcome.flags,
      reject_reason: outcome.reason,
      verified_at: outcome.status === "verified" ? new Date().toISOString() : null,
      source: "camera",
    })
    .select()
    .single();

  if (error) throw error;

  let rawResponse: unknown = null;
  try {
    rawResponse = JSON.parse(outcome.raw);
  } catch {
    rawResponse = { text: outcome.raw };
  }

  await supabase.from("sighting_verifications").insert({
    sighting_id: sighting.id,
    game_id: input.gameId,
    player_id: input.playerId,
    device_id: input.deviceId,
    claimed_animal_id: input.animalId,
    claimed_animal_name: input.animalName,
    ai_species: outcome.aiSpecies,
    ai_scientific_name: outcome.aiScientificName,
    ai_confidence: outcome.aiConfidence,
    ai_in_south_africa: outcome.aiInSouthAfrica,
    species_match: outcome.speciesMatch,
    location_plausible: outcome.locationPlausible,
    latitude: input.geo?.latitude ?? null,
    longitude: input.geo?.longitude ?? null,
    gps_accuracy: input.geo?.accuracy ?? null,
    captured_at: input.photo.capturedAt,
    image_hash: input.photo.hash,
    image_path: imagePath,
    decision: outcome.status,
    flags: outcome.flags,
    checks: outcome.checks as unknown as Json,
    raw_response: rawResponse as Json,
  });

  await syncPlayerScore(input.playerId, input.gameId);

  return {
    status: outcome.status,
    reason: outcome.reason,
    outcome,
    pointsAwarded,
  };
}

/** Verifies a sighting that was captured offline, once signal returns. */
export async function submitQueuedSighting(item: QueuedSighting): Promise<SubmitResult | null> {
  if (!item.imageDataUrl || !item.imageHash) return null;
  const base64 = item.imageDataUrl.split(",")[1] ?? "";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "image/jpeg" });

  return submitSighting({
    gameId: item.gameId,
    playerId: item.playerId,
    deviceId: item.deviceId ?? "unknown",
    animalId: item.animalId,
    animalName: item.animalName,
    rarity: item.rarity,
    points: item.points,
    photo: {
      dataUrl: item.imageDataUrl,
      blob,
      hash: item.imageHash,
      capturedAt: item.capturedAt ?? item.createdAt,
      fromCamera: true,
    },
    offline: true,
    geo:
      item.latitude != null && item.longitude != null
        ? { latitude: item.latitude, longitude: item.longitude, accuracy: item.gpsAccuracy ?? 0 }
        : null,
  });
}
