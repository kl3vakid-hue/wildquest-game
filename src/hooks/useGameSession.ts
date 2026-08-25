import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchGame,
  fetchGroups,
  fetchPlayers,
  fetchSightings,
  recordSighting,
} from "@/services/gameService";
import { queuedForPlayer, readQueue, removeQueued } from "@/services/offlineQueue";
import type { Game, Group, LocalSession, Player, Sighting } from "@/types";
import { loadSession } from "@/utils/session";
import { useOnlineStatus } from "./useOnlineStatus";

export interface GroupStanding {
  group: Group;
  total: number;
  members: Player[];
  animalsFound: number;
}

export interface GameSessionState {
  ready: boolean;
  session: LocalSession | null;
  game: Game | undefined;
  groups: Group[];
  players: Player[];
  sightings: Sighting[];
  me: Player | undefined;
  myGroup: Group | undefined;
  myGroupMembers: Player[];
  mySightings: Sighting[];
  myAnimalIds: Set<string>;
  myScore: number;
  leaderboard: Player[];
  groupStandings: GroupStanding[];
  pendingCount: number;
  online: boolean;
  isHost: boolean;
  refresh: () => void;
}

/** Loads a game with realtime listeners for players, sightings, groups and status. */
export function useGameSession(): GameSessionState {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  const gameId = session?.gameId;
  const playerId = session?.playerId;

  const gameQuery = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => fetchGame(gameId!),
    enabled: Boolean(gameId),
  });
  const groupsQuery = useQuery({
    queryKey: ["groups", gameId],
    queryFn: () => fetchGroups(gameId!),
    enabled: Boolean(gameId),
  });
  const playersQuery = useQuery({
    queryKey: ["players", gameId],
    queryFn: () => fetchPlayers(gameId!),
    enabled: Boolean(gameId),
  });
  const sightingsQuery = useQuery({
    queryKey: ["sightings", gameId],
    queryFn: () => fetchSightings(gameId!),
    enabled: Boolean(gameId),
  });

  // Realtime: any change in this game refreshes the affected slice.
  useEffect(() => {
    if (!gameId) return;
    const channel = supabase
      .channel(`wildquest-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ["players", gameId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sightings", filter: `game_id=eq.${gameId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sightings", gameId] });
          queryClient.invalidateQueries({ queryKey: ["players", gameId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups", filter: `game_id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ["groups", gameId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ["game", gameId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, queryClient]);

  // Offline queue flush.
  useEffect(() => {
    if (!gameId || !playerId) return;
    setPendingCount(queuedForPlayer(gameId, playerId).length);
    if (!online) return;

    let cancelled = false;
    (async () => {
      for (const item of readQueue()) {
        try {
          await recordSighting({
            gameId: item.gameId,
            playerId: item.playerId,
            animalId: item.animalId,
            animalName: item.animalName,
            rarity: item.rarity,
            points: item.points,
            createdAt: item.createdAt,
          });
        } catch {
          // Keep it queued unless the row already exists (duplicate claim).
        }
        removeQueued(item.localId);
      }
      if (cancelled) return;
      setPendingCount(queuedForPlayer(gameId, playerId).length);
      queryClient.invalidateQueries({ queryKey: ["sightings", gameId] });
      queryClient.invalidateQueries({ queryKey: ["players", gameId] });
    })();

    return () => {
      cancelled = true;
    };
  }, [online, gameId, playerId, queryClient]);

  const players = playersQuery.data ?? [];
  const groups = groupsQuery.data ?? [];
  const sightings = sightingsQuery.data ?? [];
  const me = players.find((p) => p.id === playerId);

  const derived = useMemo(() => {
    const pendingLocal = gameId && playerId ? queuedForPlayer(gameId, playerId) : [];
    const mySightings = sightings.filter((s) => s.player_id === playerId);
    const myAnimalIds = new Set<string>([
      ...mySightings.map((s) => s.animal_id),
      ...pendingLocal.map((s) => s.animalId),
    ]);
    const myScore =
      mySightings.reduce((sum, s) => sum + s.points, 0) +
      pendingLocal.reduce((sum, s) => sum + s.points, 0);

    const leaderboard = [...players].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );

    const groupStandings: GroupStanding[] = groups
      .map((group) => {
        const members = players.filter((p) => p.group_id === group.id);
        const memberIds = new Set(members.map((m) => m.id));
        const groupSightings = sightings.filter((s) => memberIds.has(s.player_id));
        return {
          group,
          members,
          total: members.reduce((sum, m) => sum + m.score, 0),
          animalsFound: new Set(groupSightings.map((s) => s.animal_id)).size,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { mySightings, myAnimalIds, myScore, leaderboard, groupStandings };
  }, [players, groups, sightings, playerId, gameId, pendingCount]);

  const myGroup = groups.find((g) => g.id === me?.group_id);

  return {
    ready,
    session,
    game: gameQuery.data,
    groups,
    players,
    sightings,
    me,
    myGroup,
    myGroupMembers: players.filter((p) => p.group_id === me?.group_id),
    ...derived,
    pendingCount,
    online,
    isHost: Boolean(me?.is_host),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["players", gameId] });
      queryClient.invalidateQueries({ queryKey: ["sightings", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["groups", gameId] });
    },
  };
}
