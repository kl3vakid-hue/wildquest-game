import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Rarity } from "@/types";

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];

const IdentifyInput = z.object({
  /** data URL: data:image/jpeg;base64,.... */
  imageDataUrl: z.string().min(32),
  /** Names of the animals already covered by the built-in list, for cross-checking. */
  knownAnimals: z.array(z.string()).max(200).default([]),
});

export interface IdentificationResult {
  status: "identified" | "low_confidence";
  animalName: string | null;
  scientificName: string | null;
  confidence: number | null;
  description: string | null;
  habitat: string | null;
  interestingFacts: string[];
  inSouthAfrica: boolean | null;
  matchesKnownAnimal: string | null;
  /** How rare a sighting of this species is on a South African reserve. */
  rarity: Rarity | null;
}

const SYSTEM_PROMPT = `You are a wildlife identification expert specialising in African fauna.
Identify the single main animal in the photo.
Return ONLY minified JSON, no markdown, with exactly these keys:
{"animalName":string|null,"scientificName":string|null,"confidence":number,"description":string,"habitat":string,"interestingFacts":string[],"inSouthAfrica":boolean,"matchesKnownAnimal":string|null,"rarity":string}
Rules:
- confidence is 0-100, your honest certainty about the species.
- If you are not reasonably sure, set animalName to null and confidence below 60. NEVER guess a species.
- description: 2-3 sentences about the animal.
- habitat: one sentence on typical habitat and range.
- interestingFacts: 3 short factual bullet strings.
- inSouthAfrica: true if the species occurs naturally in South Africa.
- rarity: exactly one of "Common", "Uncommon", "Rare", "Very Rare", "Legendary" — how rare it is to see this species on a South African game reserve.
- matchesKnownAnimal: if the animal is one of the provided known animals, return that exact known animal name, otherwise null.`;

export const identifyAnimal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => IdentifyInput.parse(input))
  .handler(async ({ data }): Promise<IdentificationResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI service is not configured.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Known animals: ${data.knownAnimals.join(", ") || "none"}. Identify the animal in this photo.`,
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
        throw new Error("The AI service is busy right now. Please try again in a moment.");
      if (response.status === 402)
        throw new Error("AI credits are exhausted for this app. Please add credits to continue.");
      if (response.status === 403)
        throw new Error("AI access is currently blocked for this workspace.");
      throw new Error(`AI identification failed (${response.status}). ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const jsonText = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      throw new Error("The AI returned an unreadable answer. Please try again.");
    }

    const confidence =
      typeof parsed["confidence"] === "number"
        ? Math.max(0, Math.min(100, parsed["confidence"]))
        : null;
    const animalName =
      typeof parsed["animalName"] === "string" && parsed["animalName"].trim()
        ? parsed["animalName"].trim()
        : null;
    const facts = Array.isArray(parsed["interestingFacts"])
      ? (parsed["interestingFacts"] as unknown[])
          .filter((f): f is string => typeof f === "string")
          .slice(0, 5)
      : [];

    const confident = Boolean(animalName) && (confidence ?? 0) >= 60;

    return {
      status: confident ? "identified" : "low_confidence",
      animalName,
      scientificName:
        typeof parsed["scientificName"] === "string" ? parsed["scientificName"] : null,
      confidence,
      description: typeof parsed["description"] === "string" ? parsed["description"] : null,
      habitat: typeof parsed["habitat"] === "string" ? parsed["habitat"] : null,
      interestingFacts: facts,
      inSouthAfrica: typeof parsed["inSouthAfrica"] === "boolean" ? parsed["inSouthAfrica"] : null,
      rarity:
        typeof parsed["rarity"] === "string" && RARITIES.includes(parsed["rarity"].trim() as Rarity)
          ? (parsed["rarity"].trim() as Rarity)
          : null,
      matchesKnownAnimal:
        typeof parsed["matchesKnownAnimal"] === "string" && parsed["matchesKnownAnimal"].trim()
          ? parsed["matchesKnownAnimal"].trim()
          : null,
    };
  });
