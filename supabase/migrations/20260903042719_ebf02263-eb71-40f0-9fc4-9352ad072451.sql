CREATE TABLE public.game_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏅',
  points integer NOT NULL DEFAULT 100,
  rarity text,
  species text[] NOT NULL DEFAULT '{}'::text[],
  required_count integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_achievements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_achievements TO authenticated;
GRANT ALL ON public.game_achievements TO service_role;

ALTER TABLE public.game_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements readable" ON public.game_achievements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "achievements insertable" ON public.game_achievements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "achievements updatable" ON public.game_achievements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "achievements deletable" ON public.game_achievements FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_game_achievements_updated_at
BEFORE UPDATE ON public.game_achievements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX game_achievements_game_id_idx ON public.game_achievements(game_id);