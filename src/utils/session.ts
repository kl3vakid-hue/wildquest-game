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

export function rememberAvatar(dataUrl: string | null): void {
  const store = safeStorage();
  if (!store) return;
  if (dataUrl) store.setItem(AVATAR_KEY, dataUrl);
  else store.removeItem(AVATAR_KEY);
}

export function recalledAvatar(): string | null {
  return safeStorage()?.getItem(AVATAR_KEY) ?? null;
}

/** Shrinks a picked photo to a small square JPEG so it fits in device storage. */
export function resizeAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas"));
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
