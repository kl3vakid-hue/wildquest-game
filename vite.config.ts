// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        // The guarded wrapper in src/lib/pwa.ts is the only registrar.
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        // Manifest is served statically from public/manifest.webmanifest.
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,png,jpg,jpeg,svg,ico,woff2}"],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigationPreload: false,
          runtimeCaching: [
            {
              // Pages: always try the network, fall back to the last good copy offline.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "wildquest-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // Built assets and animal photos.
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(?:js|css|png|jpg|jpeg|svg|woff2)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "wildquest-assets",
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "wildquest-fonts",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
