/**
 * Service-worker registration for offline use.
 * Refuses to register in dev, in the Lovable editor preview, inside an iframe,
 * or when `?sw=off` is present — and cleans up any stale registration there.
 */
const SW_URL = "/sw.js";
/** Must match the navigation cache name in vite.config.ts (workbox runtimeCaching). */
const PAGES_CACHE = "wildquest-pages";
/** Screens a player can be sitting on when the signal drops. Cached as SSR HTML. */
const PREWARM_ROUTES = [
  "/",
  "/create",
  "/join",
  "/game",
  "/spot",
  "/ranks",
  "/collection",
  "/group",
  "/progress",
  "/identify",
  "/profile",
  "/lobby",
  "/results",
];

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const url =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          "";
        return url.endsWith(SW_URL);
      })
      .map((registration) => registration.unregister()),
  );
}

/**
 * The page cache only stores screens fetched as documents while the worker is
 * active — client-side navigation never adds to it. Without a warm-up, an
 * offline reload of any screen the player moved to inside the app fails. This
 * fetches each screen once in the background and drops the SSR HTML into the
 * same cache the worker reads, so every screen opens with no signal.
 */
async function prewarmPageCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(PAGES_CACHE);
    for (const route of PREWARM_ROUTES) {
      try {
        const response = await fetch(route, { credentials: "same-origin" });
        if (response.ok && response.type === "basic") {
          await cache.put(new Request(window.location.origin + route), response);
        }
      } catch {
        /* route warm-up is best-effort */
      }
    }
  } catch {
    /* cache access is best-effort */
  }
}

export function setupOfflineSupport(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const killSwitch = new URL(window.location.href).searchParams.get("sw") === "off";
  const blocked =
    !import.meta.env.PROD || inIframe || killSwitch || isPreviewHost(window.location.hostname);

  if (blocked) {
    void unregisterAppWorkers();
    return;
  }

  // Register right away when the page already finished loading — on the
  // published app the component often mounts after the `load` event, so a
  // load-only listener never fires and offline support silently never starts.
  const register = () => {
    void navigator.serviceWorker
      .register(SW_URL, { scope: "/" })
      .then(() => prewarmPageCache())
      .catch(() => {
        /* offline support is best-effort */
      });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
