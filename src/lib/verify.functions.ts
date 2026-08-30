import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CAPTURE_FRESHNESS_MINUTES,
  GPS_ACCURACY_LIMIT,
  decideVerification,
  type VerificationStatus,
  type VerifyChecks,
} from "@/lib/verificationRules";

const VerifyInput = z.object({
  imageDataUrl: z.string().min(32),
  gameId: z.string().uuid(),
  claimedAnimalName: z.string().min(2),
  imageHash: z.string().min(16),
  fromCamera: z.boolean(),
  capturedAt: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  gpsAccuracy: z.number().nullable(),
});

export interface VerificationOutcome {
  status: VerificationStatus;
  flags: string[];
  reason: string | null;
  aiSpecies: string | null;
  aiScientificName: string | null;
  aiConfidence: number | null;
  aiInSouthAfrica: boolean | null;
  speciesMatch: boolean;
  locationPlausible: boolean;
  aiVerdict: string | null;
  checks: VerifyChecks;
  /** Raw AI JSON response, kept as text for the audit trail. */
  raw: string;
}

const SYSTEM_PROMPT = `You are a strict wildlife sighting verifier for South African game reserves.
You are given a photo, the species the player claims to have photographed, and optionally GPS coordinates.
Return ONLY minified JSON with exactly these keys:
{"species":string|null,"scientificName":string|null,"confidence":number,"matchesClaim":boolean,"inSouthAfrica":boolean,"plausibleAtLocation":boolean,"verdict":string}
Rules:
- species: the animal you actually see, null if no wild animal is clearly visible.
- confidence: 0-100, your honest certainty about the species in the photo.
- matchesClaim: true only if the animal in the photo is the claimed species (or an obvious synonym/subspecies).
- Be strict: screenshots, drawings, book pages, TV screens, toys, pets or captive-zoo settings are NOT valid sightings — set matchesClaim false and explain in verdict.
- plausibleAtLocation: true if the claimed species could naturally occur at the given coordinates; true when no coordinates are given and the species occurs in South Africa.
- verdict: one short sentence explaining your decision.`;

export const verifySighting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ data }): Promise<VerificationOutcome> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Verification service is not configured.");

    // --- Duplicate photo detection (server-side, cannot be bypassed) -------
    let duplicatePhoto = false;
    const supabaseUrl = process.env["SUPABASE_URL"];
    const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: dupes } = await db
        .from("sightings")
        .select("id")
        .eq("image_hash", data.imageHash)
        .limit(1);
      duplicatePhoto = (dupes ?? []).length > 0;
    }

    const locationText =
      data.latitude !== null && data.longitude !== null
        ? `GPS: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)} (accuracy ${Math.round(data.gpsAccuracy ?? 0)}m)`
        : "GPS: unavailable";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Claimed species: ${data.claimedAnimalName}. ${locationText}. Verify this sighting photo.`,
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429)
        throw new Error("The verifier is busy right now. Please try again in a moment.");
      if (response.status === 402)
        throw new Error("AI credits are exhausted for this app. Please add credits to continue.");
      if (response.status === 403)
        throw new Error("AI access is currently blocked for this workspace.");
      throw new Error(`Verification failed (${response.status}). ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = (payload.choices?.[0]?.message?.content ?? "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("The verifier returned an unreadable answer. Please try again.");
    }

    const confidence =
      typeof parsed["confidence"] === "number"
        ? Math.max(0, Math.min(100, parsed["confidence"]))
        : null;
    const speciesMatch = parsed["matchesClaim"] === true;
    const locationPlausible = parsed["plausibleAtLocation"] !== false;

    const capturedAt = Date.parse(data.capturedAt);
    const ageMinutes = Number.isNaN(capturedAt)
      ? Number.POSITIVE_INFINITY
      : Math.abs(Date.now() - capturedAt) / 60000;

    const hasGps = data.latitude !== null && data.longitude !== null;
    const checks: VerifyChecks = {
      speciesMatch,
      confidence,
      hasGps,
      gpsAccuracy: data.gpsAccuracy,
      accuracyOk: hasGps && (data.gpsAccuracy ?? 0) <= GPS_ACCURACY_LIMIT,
      timestampFresh: ageMinutes <= CAPTURE_FRESHNESS_MINUTES,
      locationPlausible,
      duplicatePhoto,
      fromCamera: data.fromCamera,
    };

    const decision = decideVerification(checks);

    return {
      ...decision,
      aiSpecies: typeof parsed["species"] === "string" ? parsed["species"] : null,
      aiScientificName:
        typeof parsed["scientificName"] === "string" ? parsed["scientificName"] : null,
      aiConfidence: confidence,
      aiInSouthAfrica:
        typeof parsed["inSouthAfrica"] === "boolean" ? parsed["inSouthAfrica"] : null,
      speciesMatch,
      locationPlausible,
      aiVerdict: typeof parsed["verdict"] === "string" ? parsed["verdict"] : null,
      checks,
      raw,
    };
  });
