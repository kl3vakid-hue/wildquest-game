export type Rarity = "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary";

export interface Animal {
  id: string;
  name: string;
  points: number;
  rarity: Rarity;
  /** Large glyph used as the animal image in cards and the collection. */
  image: string;
  /** When true, the animal may be claimed more than once per game. */
  repeatable?: boolean;
}

export type GameStatus = "lobby" | "active" | "ended";

export interface Game {
  id: string;
  code: string;
  name: string;
  status: GameStatus;
  host_player_id: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface Group {
  id: string;
  game_id: string;
  name: string;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  group_id: string | null;
  name: string;
  device_id: string;
  score: number;
  is_ready: boolean;
  is_host: boolean;
  created_at: string;
}

export interface Sighting {
  id: string;
  game_id: string;
  player_id: string;
  animal_id: string;
  animal_name: string;
  rarity: Rarity;
  points: number;
  created_at: string;
  verification_status: string;
  ai_species: string | null;
  ai_confidence: number | null;
  ai_verdict: string | null;
  image_path: string | null;
  image_hash: string | null;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  captured_at: string | null;
  device_id: string | null;
  flags: string[];
  reject_reason: string | null;
  verified_at: string | null;
  source: string;
}

export interface LocalSession {
  gameId: string;
  playerId: string;
  deviceId: string;
}

export interface QueuedSighting {
  localId: string;
  gameId: string;
  playerId: string;
  animalId: string;
  animalName: string;
  rarity: Rarity;
  points: number;
  createdAt: string;
  /** Offline evidence, verified by the AI as soon as signal returns. */
  imageDataUrl?: string;
  imageHash?: string;
  capturedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  deviceId?: string;
}
