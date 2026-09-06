CREATE OR REPLACE FUNCTION public.find_game_by_code(_code text)
RETURNS TABLE (id uuid, name text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.status
  FROM public.games g
  WHERE upper(g.code) = upper(btrim(_code))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.find_game_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_game_by_code(text) TO anon, authenticated, service_role;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'SELECT'
      AND tablename IN ('games','groups','game_settings','game_achievements',
                        'sightings','sighting_verifications','animal_identifications')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "games readable to members" ON public.games FOR SELECT TO anon, authenticated
  USING (private.is_game_member(id) OR host_player_id IS NULL);

CREATE POLICY "groups readable to members" ON public.groups FOR SELECT TO anon, authenticated
  USING (private.is_game_member(game_id) OR private.game_is_unclaimed(game_id));

CREATE POLICY "settings readable to members" ON public.game_settings FOR SELECT TO anon, authenticated
  USING (private.is_game_member(game_id) OR private.game_is_unclaimed(game_id));

CREATE POLICY "achievements readable to members" ON public.game_achievements FOR SELECT TO anon, authenticated
  USING (private.is_game_member(game_id) OR private.game_is_unclaimed(game_id));

CREATE POLICY "sightings readable to members" ON public.sightings FOR SELECT TO anon, authenticated
  USING (private.is_game_member(game_id) OR private.owns_player(player_id));

CREATE POLICY "verifications readable to host or owner" ON public.sighting_verifications
  FOR SELECT TO anon, authenticated
  USING (private.owns_player(player_id) OR (game_id IS NOT NULL AND private.is_game_host(game_id)));

CREATE POLICY "identifications readable to owner" ON public.animal_identifications
  FOR SELECT TO anon, authenticated
  USING (device_id = private.current_device_id() AND private.current_device_id() IS NOT NULL);