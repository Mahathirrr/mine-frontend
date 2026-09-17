#!/usr/bin/env node
/**
 * Post-build service worker for TanStack Start + Nitro.
 * Hashed /assets/* chunks are NOT precached (they change every deploy).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "../.output/public");

const { count, size, warnings } = await generateSW({
  swDest: path.join(publicDir, "sw.js"),
  globDirectory: publicDir,
  globPatterns: ["**/*.{ico,png,svg,webp,woff,woff2}", "manifest.json", "offline.html"],
  globIgnores: ["**/assets/**", "**/leetcode-materials/**", "sw.js", "workbox-*.js"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  navigationPreload: true,
  navigateFallback: "/offline.html",
  navigateFallbackDenylist: [/^\/api/, /^\/leetcode-materials/],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
      handler: "NetworkOnly",
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 24,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

console.log(`Generated sw.js with ${count} precache entries (${size} bytes)`);
for (const warning of warnings) {
  console.warn(warning);
}
