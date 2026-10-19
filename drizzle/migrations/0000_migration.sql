DROP POLICY IF EXISTS "games insertable" ON public.games;
CREATE POLICY "games insertable" ON public.games FOR INSERT TO anon, authenticated
WITH CHECK (private.current_device_id() IS NOT NULL AND host_player_id IS NULL AND status = 'lobby');