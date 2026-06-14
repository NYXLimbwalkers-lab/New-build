import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
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
        // Cache the app shell + ingredient/candle layer assets so the kiosk
        // works offline (Phase 3 requirement, set up early).
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/layers/"),
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
