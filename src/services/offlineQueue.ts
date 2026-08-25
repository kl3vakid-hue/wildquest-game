import type { QueuedSighting } from "@/types";

const QUEUE_KEY = "wildquest.queue";

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readQueue(): QueuedSighting[] {
  const raw = store()?.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedSighting[];
  } catch {
    return [];
  }
}

export function writeQueue(items: QueuedSighting[]): void {
  store()?.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueSighting(item: QueuedSighting): void {
  writeQueue([...readQueue(), item]);
}

export function removeQueued(localId: string): void {
  writeQueue(readQueue().filter((item) => item.localId !== localId));
}

export function queuedForPlayer(gameId: string, playerId: string): QueuedSighting[] {
  return readQueue().filter(
    (item) => item.gameId === gameId && item.playerId === playerId,
  );
}
