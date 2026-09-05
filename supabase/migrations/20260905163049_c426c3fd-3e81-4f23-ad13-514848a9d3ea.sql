
-- Device identity carried on every request from the app
CREATE OR REPLACE FUNCTION public.current_device_id()
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(current_setting('request.headers', true)::json->>'x-device-id', '')
$$;

CREATE OR REPLACE FUNCTION public.is_game_member(_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.game_id = _game_id
      AND p.device_id = public.current_device_id()
      AND public.current_device_id() IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.is_game_host(_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.games g
    JOIN public.players p ON p.id = g.host_player_id
    WHERE g.id = _game_id
      AND p.device_id = public.current_device_id()
      AND public.current_device_id() IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.game_is_unclaimed(_game_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.games g WHERE g.id = _game_id AND g.host_player_id IS NULL)
$$;

CREATE OR REPLACE FUNCTION public.owns_player(_player_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = _player_id
      AND p.device_id = public.current_device_id()
      AND public.current_device_id() IS NOT NULL
  )
$$;

-- games ---------------------------------------------------------------
DROP POLICY IF EXISTS "games updatable" ON public.games;
DROP POLICY IF EXISTS "games deletable" ON public.games;
CREATE POLICY "games updatable by host" ON public.games FOR UPDATE TO anon, authenticated
  USING (public.is_game_host(id) OR (public.game_is_unclaimed(id) AND public.is_game_member(id)))
  WITH CHECK (public.is_game_host(id) OR public.is_game_member(id));
CREATE POLICY "games deletable by host" ON public.games FOR DELETE TO anon, authenticated
  USING (public.is_game_host(id));

-- players -------------------------------------------------------------
DROP POLICY IF EXISTS "players readable" ON public.players;
DROP POLICY IF EXISTS "players insertable" ON public.players;
DROP POLICY IF EXISTS "players updatable" ON public.players;
DROP POLICY IF EXISTS "players deletable" ON public.players;
CREATE POLICY "players readable to members" ON public.players FOR SELECT TO anon, authenticated
  USING (device_id = public.current_device_id() OR public.is_game_member(game_id));
CREATE POLICY "players insert own device" ON public.players FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = public.current_device_id() AND public.current_device_id() IS NOT NULL);
CREATE POLICY "players update own or host" ON public.players FOR UPDATE TO anon, authenticated
  USING (device_id = public.current_device_id() OR public.is_game_host(game_id))
  WITH CHECK (device_id = public.current_device_id() OR public.is_game_host(game_id));
CREATE POLICY "players delete own or host" ON public.players FOR DELETE TO anon, authenticated
  USING (device_id = public.current_device_id() OR public.is_game_host(game_id));

-- groups --------------------------------------------------------------
DROP POLICY IF EXISTS "groups insertable" ON public.groups;
DROP POLICY IF EXISTS "groups updatable" ON public.groups;
CREATE POLICY "groups insert by members" ON public.groups FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_game_member(game_id) OR public.game_is_unclaimed(game_id));
CREATE POLICY "groups update by host" ON public.groups FOR UPDATE TO anon, authenticated
  USING (public.is_game_host(game_id)) WITH CHECK (public.is_game_host(game_id));

-- game_settings -------------------------------------------------------
DROP POLICY IF EXISTS "settings insertable" ON public.game_settings;
DROP POLICY IF EXISTS "settings updatable" ON public.game_settings;
CREATE POLICY "settings insert by host" ON public.game_settings FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_game_host(game_id));
CREATE POLICY "settings update by host" ON public.game_settings FOR UPDATE TO anon, authenticated
  USING (public.is_game_host(game_id)) WITH CHECK (public.is_game_host(game_id));

-- game_achievements ---------------------------------------------------
DROP POLICY IF EXISTS "achievements insertable" ON public.game_achievements;
DROP POLICY IF EXISTS "achievements updatable" ON public.game_achievements;
DROP POLICY IF EXISTS "achievements deletable" ON public.game_achievements;
CREATE POLICY "achievements insert by host" ON public.game_achievements FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_game_host(game_id));
CREATE POLICY "achievements update by host" ON public.game_achievements FOR UPDATE TO anon, authenticated
  USING (public.is_game_host(game_id)) WITH CHECK (public.is_game_host(game_id));
CREATE POLICY "achievements delete by host" ON public.game_achievements FOR DELETE TO anon, authenticated
  USING (public.is_game_host(game_id));

-- sightings -----------------------------------------------------------
DROP POLICY IF EXISTS "sightings insertable" ON public.sightings;
DROP POLICY IF EXISTS "sightings updatable" ON public.sightings;
DROP POLICY IF EXISTS "sightings deletable" ON public.sightings;
CREATE POLICY "sightings insert own" ON public.sightings FOR INSERT TO anon, authenticated
  WITH CHECK (public.owns_player(player_id) AND public.is_game_member(game_id));
CREATE POLICY "sightings update own or host" ON public.sightings FOR UPDATE TO anon, authenticated
  USING (public.owns_player(player_id) OR public.is_game_host(game_id))
  WITH CHECK (public.owns_player(player_id) OR public.is_game_host(game_id));
CREATE POLICY "sightings delete own or host" ON public.sightings FOR DELETE TO anon, authenticated
  USING (public.owns_player(player_id) OR public.is_game_host(game_id));

-- sighting_verifications ----------------------------------------------
DROP POLICY IF EXISTS "verifications insertable" ON public.sighting_verifications;
DROP POLICY IF EXISTS "verifications updatable" ON public.sighting_verifications;
CREATE POLICY "verifications insert own" ON public.sighting_verifications FOR INSERT TO anon, authenticated
  WITH CHECK (public.owns_player(player_id));
CREATE POLICY "verifications update by host" ON public.sighting_verifications FOR UPDATE TO anon, authenticated
  USING (public.is_game_host(game_id)) WITH CHECK (public.is_game_host(game_id));

-- animal_identifications ----------------------------------------------
DROP POLICY IF EXISTS "identifications insertable" ON public.animal_identifications;
DROP POLICY IF EXISTS "identifications updatable" ON public.animal_identifications;
DROP POLICY IF EXISTS "identifications deletable" ON public.animal_identifications;
CREATE POLICY "identifications insert own" ON public.animal_identifications FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = public.current_device_id() AND public.current_device_id() IS NOT NULL);
CREATE POLICY "identifications update own" ON public.animal_identifications FOR UPDATE TO anon, authenticated
  USING (device_id = public.current_device_id()) WITH CHECK (device_id = public.current_device_id());
CREATE POLICY "identifications delete own" ON public.animal_identifications FOR DELETE TO anon, authenticated
  USING (device_id = public.current_device_id());

-- storage: animal-photos ----------------------------------------------
CREATE OR REPLACE FUNCTION public.can_host_view_photo(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sightings s
    WHERE s.image_path = _path AND public.is_game_host(s.game_id)
  ) OR EXISTS (
    SELECT 1 FROM public.sighting_verifications v
    WHERE v.image_path = _path AND v.game_id IS NOT NULL AND public.is_game_host(v.game_id)
  )
$$;

DROP POLICY IF EXISTS "animal photos read" ON storage.objects;
DROP POLICY IF EXISTS "animal photos insert" ON storage.objects;
DROP POLICY IF EXISTS "animal photos delete" ON storage.objects;
CREATE POLICY "animal photos read own or host" ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'animal-photos'
    AND (
      ((storage.foldername(name))[1] = public.current_device_id() AND public.current_device_id() IS NOT NULL)
      OR public.can_host_view_photo(name)
    )
  );
CREATE POLICY "animal photos insert own" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'animal-photos'
    AND (storage.foldername(name))[1] = public.current_device_id()
    AND public.current_device_id() IS NOT NULL
  );
CREATE POLICY "animal photos delete own" ON storage.objects FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'animal-photos'
    AND (storage.foldername(name))[1] = public.current_device_id()
    AND public.current_device_id() IS NOT NULL
  );
