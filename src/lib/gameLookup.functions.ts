import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LookupInput = z.object({
  code: z.string().trim().min(3).max(12),
});

export interface GameLookup {
  id: string;
  name: string;
  status: string;
}

/**
 * Resolves a game from its join code. Game rows are only readable to members,
 * so this minimal lookup runs on the server and returns nothing else about the
 * game (no code list, no host id, no enumeration).
 */
export const lookupGameByCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LookupInput.parse(data))
  .handler(async ({ data }): Promise<GameLookup | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: game, error } = await supabaseAdmin
      .from("games")
      .select("id, name, status")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (error || !game) return null;
    return { id: game.id, name: game.name, status: game.status };
  });
