/**
 * Keeps the last known game data on the device so every screen still opens
 * with real content when there is no signal.
 */
const PREFIX = "wildquest.cache.";
const STAMP_KEY = "wildquest.cache.syncedAt";

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCache<T>(key: string): T | null {
  const raw = store()?.getItem(PREFIX + key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    store()?.setItem(PREFIX + key, JSON.stringify(value));
    store()?.setItem(STAMP_KEY, new Date().toISOString());
  } catch {
    /* cache is best-effort */
  }
}

export function lastSyncedAt(): string | null {
  return store()?.getItem(STAMP_KEY) ?? null;
}

/**
 * Runs a live fetch and remembers the result. If the request fails (dead zone,
 * airplane mode) the last remembered value is returned instead of an error.
 */
export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const value = await fetcher();
    writeCache(key, value);
    return value;
  } catch (error) {
    const fallback = readCache<T>(key);
    if (fallback !== null) return fallback;
    throw error;
  }
}
