import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
// BASE_PATH lets the GitHub Pages build serve under /New-build/ while local
// dev + other hosts stay at root.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "DéLa Já — The Candle Patisserie",
        short_name: "DéLa Já",
        description:
          "Build your own dessert candle. Veteran- & mom-owned, hand-poured, small-batch.",
        theme_color: "#FBF4F0",
        background_color: "#FBF4F0",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Precache hashed JS/CSS/assets (immutable) — but NOT html, so the page
        // shell is fetched fresh when online (deploys show immediately; no stale
        // cached app during iteration). Offline still works via the NetworkFirst
        // fallback below.
        globPatterns: ["**/*.{js,css,svg,png,webp,woff2}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            // Always try the network for page navigations; fall back to cache offline.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/layers/"),
            handler: "CacheFirst",
            options: {
              cacheName: "candle-layers",
              expiration: { maxEntries: 500 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
