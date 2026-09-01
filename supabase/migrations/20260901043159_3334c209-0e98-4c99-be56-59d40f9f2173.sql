CREATE TABLE public.game_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL UNIQUE REFERENCES public.games(id) ON DELETE CASCADE,
  rarity_limits jsonb NOT NULL DEFAULT '{"Common": 3, "Uncommon": 5, "Rare": null, "Very Rare": null, "Legendary": null}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.game_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_settings TO authenticated;
GRANT ALL ON public.game_settings TO service_role;

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings readable" ON public.game_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings insertable" ON public.game_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "settings updatable" ON public.game_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_game_settings_updated_at
BEFORE UPDATE ON public.game_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();