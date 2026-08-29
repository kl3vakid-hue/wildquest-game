ALTER TABLE public.sightings
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_species text,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_verdict text,
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS image_hash text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS gps_accuracy numeric,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'camera';

UPDATE public.sightings SET verification_status = 'verified', verified_at = created_at WHERE verification_status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS sightings_game_image_hash_key
  ON public.sightings (game_id, image_hash)
  WHERE image_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS sightings_status_idx ON public.sightings (game_id, verification_status);

CREATE POLICY "sightings updatable" ON public.sightings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sighting_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id uuid REFERENCES public.sightings(id) ON DELETE CASCADE,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  device_id text,
  claimed_animal_id text,
  claimed_animal_name text,
  ai_species text,
  ai_scientific_name text,
  ai_confidence numeric,
  ai_in_south_africa boolean,
  species_match boolean,
  location_plausible boolean,
  latitude numeric,
  longitude numeric,
  gps_accuracy numeric,
  captured_at timestamptz,
  image_hash text,
  image_path text,
  decision text NOT NULL,
  flags text[] NOT NULL DEFAULT '{}'::text[],
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.sighting_verifications TO anon, authenticated;
GRANT ALL ON public.sighting_verifications TO service_role;

ALTER TABLE public.sighting_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications readable" ON public.sighting_verifications
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "verifications insertable" ON public.sighting_verifications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "verifications updatable" ON public.sighting_verifications
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sighting_verifications_game_idx ON public.sighting_verifications (game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sighting_verifications_hash_idx ON public.sighting_verifications (image_hash);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sighting_verifications_updated_at
  BEFORE UPDATE ON public.sighting_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();