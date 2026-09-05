import { ANIMALS } from "@/data/animals";
import { identifyAnimal } from "@/lib/identify.functions";
import type { IdentificationResult } from "@/lib/identify.functions";
import { saveIdentification, uploadPhoto } from "@/services/identifyService";

const QUEUE_KEY = "wildquest.identify.queue";

export interface QueuedIdentification {
  localId: string;
  /** Compressed JPEG data URL of the photo taken offline. */
  imageDataUrl: string;
  createdAt: string;
  savePhoto: boolean;
  deviceId: string;
  gameId: string | null;
  playerId: string | null;
}

export interface QueuedIdentifyOutcome {
  localId: string;
  result: IdentificationResult;
  knownAnimalName: string | null;
}

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readIdentifyQueue(): QueuedIdentification[] {
  const raw = store()?.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedIdentification[];
  } catch {
    return [];
  }
}

function writeIdentifyQueue(items: QueuedIdentification[]): void {
  try {
    store()?.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Storage full: drop the oldest photo and retry once.
    try {
      store()?.setItem(QUEUE_KEY, JSON.stringify(items.slice(1)));
    } catch {
      /* nothing else we can do */
    }
  }
}

export function enqueueIdentification(item: QueuedIdentification): void {
  writeIdentifyQueue([...readIdentifyQueue(), item]);
}

export function removeQueuedIdentification(localId: string): void {
  writeIdentifyQueue(readIdentifyQueue().filter((item) => item.localId !== localId));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}

function matchKnownAnimal(result: IdentificationResult): string | null {
  const candidates = [result.matchesKnownAnimal, result.animalName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  const found = ANIMALS.find((animal) =>
    candidates.some(
      (candidate) =>
        candidate === animal.name.toLowerCase() ||
        candidate.includes(animal.name.toLowerCase()) ||
        animal.name.toLowerCase().includes(candidate),
    ),
  );
  return found?.name ?? null;
}

/**
 * Sends every photo captured offline to the AI, one at a time, once signal returns.
 * A photo stays queued if the request fails, so nothing is lost.
 */
export async function flushIdentifyQueue(): Promise<QueuedIdentifyOutcome[]> {
  const outcomes: QueuedIdentifyOutcome[] = [];

  for (const item of readIdentifyQueue()) {
    let result: IdentificationResult;
    try {
      result = await identifyAnimal({
        data: {
          imageDataUrl: item.imageDataUrl,
          knownAnimals: ANIMALS.map((a) => a.name),
        },
      });
    } catch {
      // Still no usable connection — leave it queued for the next attempt.
      break;
    }

    const knownAnimalName = matchKnownAnimal(result);

    if (result.status === "identified" && !knownAnimalName) {
      let imagePath: string | null = null;
      if (item.savePhoto) {
        try {
          imagePath = await uploadPhoto(dataUrlToBlob(item.imageDataUrl), item.deviceId);
        } catch {
          /* text result is still worth keeping */
        }
      }
      try {
        await saveIdentification({
          result,
          deviceId: item.deviceId,
          gameId: item.gameId,
          playerId: item.playerId,
          imagePath,
        });
      } catch {
        /* shown on screen even if the save failed */
      }
    }

    removeQueuedIdentification(item.localId);
    outcomes.push({ localId: item.localId, result, knownAnimalName });
  }

  return outcomes;
}
