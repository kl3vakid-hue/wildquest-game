CREATE TABLE public.animal_identifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  animal_name text NOT NULL,
  scientific_name text,
  confidence numeric,
  description text,
  habitat text,
  interesting_facts text[] NOT NULL DEFAULT '{}',
  in_south_africa boolean,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_identifications TO anon, authenticated;
GRANT ALL ON public.animal_identifications TO service_role;

ALTER TABLE public.animal_identifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "identifications readable" ON public.animal_identifications
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "identifications insertable" ON public.animal_identifications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "identifications updatable" ON public.animal_identifications
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "identifications deletable" ON public.animal_identifications
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX animal_identifications_device_idx ON public.animal_identifications (device_id, created_at DESC);

CREATE POLICY "animal photos insert" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'animal-photos');
CREATE POLICY "animal photos read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'animal-photos');
CREATE POLICY "animal photos delete" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'animal-photos');