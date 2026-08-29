import { supabase } from "@/integrations/supabase/client";
import type { IdentificationResult } from "@/lib/identify.functions";
import type { Rarity } from "@/types";

export const PHOTO_BUCKET = "animal-photos";

export interface StoredIdentification {
  id: string;
  animal_name: string;
  scientific_name: string | null;
  confidence: number | null;
  description: string | null;
  habitat: string | null;
  interesting_facts: string[];
  in_south_africa: boolean | null;
  rarity: Rarity | null;
  image_path: string | null;
  created_at: string;
}

export async function uploadPhoto(file: Blob, deviceId: string): Promise<string> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${deviceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function saveIdentification(args: {
  result: IdentificationResult;
  deviceId: string;
  gameId?: string | null;
  playerId?: string | null;
  imagePath?: string | null;
}): Promise<StoredIdentification> {
  const { result } = args;
  const { data, error } = await supabase
    .from("animal_identifications")
    .insert({
      device_id: args.deviceId,
      game_id: args.gameId ?? null,
      player_id: args.playerId ?? null,
      animal_name: result.animalName ?? "Unknown",
      scientific_name: result.scientificName,
      confidence: result.confidence,
      description: result.description,
      habitat: result.habitat,
      interesting_facts: result.interestingFacts,
      in_south_africa: result.inSouthAfrica,
      rarity: result.rarity,
      image_path: args.imagePath ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as StoredIdentification;
}

export async function listMyIdentifications(deviceId: string): Promise<StoredIdentification[]> {
  const { data, error } = await supabase
    .from("animal_identifications")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as StoredIdentification[];
}

export async function deleteIdentification(id: string, imagePath: string | null): Promise<void> {
  if (imagePath) {
    await supabase.storage.from(PHOTO_BUCKET).remove([imagePath]);
  }
  const { error } = await supabase.from("animal_identifications").delete().eq("id", id);
  if (error) throw error;
}
