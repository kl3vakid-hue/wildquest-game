import type { LocalSession } from "@/types";

const SESSION_KEY = "wildquest.session";
const DEVICE_KEY = "wildquest.device";
const NAME_KEY = "wildquest.name";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getDeviceId(): string {
  const store = safeStorage();
  if (!store) return "server";
  let id = store.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    store.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function loadSession(): LocalSession | null {
  const store = safeStorage();
  if (!store) return null;
  const raw = store.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalSession;
    if (!parsed.gameId || !parsed.playerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: LocalSession): void {
  safeStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  safeStorage()?.removeItem(SESSION_KEY);
}

export function rememberName(name: string): void {
  safeStorage()?.setItem(NAME_KEY, name);
}

export function recalledName(): string {
  return safeStorage()?.getItem(NAME_KEY) ?? "";
}

const AVATAR_KEY = "wildquest.avatar";

/** Avatar is either an emoji ("emoji:🦁") or a small image data URL, stored on this device. */
export function rememberAvatar(value: string | null): void {
  const store = safeStorage();
  if (!store) return;
  if (value) store.setItem(AVATAR_KEY, value);
  else store.removeItem(AVATAR_KEY);
}

export function recalledAvatar(): string {
  return safeStorage()?.getItem(AVATAR_KEY) ?? "";
}
