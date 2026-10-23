ALTER TABLE public.groups ADD COLUMN score integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.groups.score IS 'Stored group total, maintained by the sync_group_score trigger as the sum of member player scores.';

-- Backfill existing groups from their members' current scores.
UPDATE public.groups gr
SET score = COALESCE((SELECT SUM(p.score) FROM public.players p WHERE p.group_id = gr.id), 0);

CREATE OR REPLACE FUNCTION public.sync_group_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gids uuid[];
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.group_id IS NOT NULL THEN
    gids := array_append(gids, NEW.group_id);
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.group_id IS NOT NULL
     AND NOT (gids @> ARRAY[OLD.group_id]) THEN
    gids := array_append(gids, OLD.group_id);
  END IF;
  IF gids IS NOT NULL THEN
    UPDATE public.groups gr
    SET score = COALESCE((SELECT SUM(p.score) FROM public.players p WHERE p.group_id = gr.id), 0)
    WHERE gr.id = ANY(gids);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER players_sync_group_score
AFTER INSERT OR UPDATE OR DELETE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.sync_group_score();