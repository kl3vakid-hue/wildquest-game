CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  host_player_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  device_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  is_ready boolean NOT NULL DEFAULT false,
  is_host boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sightings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  animal_id text NOT NULL,
  animal_name text NOT NULL,
  rarity text NOT NULL,
  points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, player_id, animal_id)
);

CREATE INDEX idx_players_game ON public.players(game_id);
CREATE INDEX idx_groups_game ON public.groups(game_id);
CREATE INDEX idx_sightings_game ON public.sightings(game_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.sightings TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
GRANT ALL ON public.groups TO service_role;
GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.sightings TO service_role;

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games readable" ON public.games FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "games insertable" ON public.games FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "games updatable" ON public.games FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "games deletable" ON public.games FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "groups readable" ON public.groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "groups insertable" ON public.groups FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "groups updatable" ON public.groups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "players readable" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "players insertable" ON public.players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "players updatable" ON public.players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "players deletable" ON public.players FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "sightings readable" ON public.sightings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sightings insertable" ON public.sightings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sightings deletable" ON public.sightings FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sightings;