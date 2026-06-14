import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./shell/RootLayout";
import { StorefrontHome } from "./routes/StorefrontHome";
import { BuilderPage } from "./routes/BuilderPage";
import { AboutPage } from "./routes/AboutPage";
import { KioskPage } from "./routes/KioskPage";
import { PartyPage } from "./routes/PartyPage";

/*
  One codebase, three modes via routes/flags (deep plan, Part 9):
    "/"            storefront (phone + desktop)
    "/build"       The Candle Bar
    "/kiosk"       locked in-store touch display  (Phase 3 scaffold)
    "/party/:id"   RV mobile-party group builds   (Phase 4 scaffold)
  The RootLayout is the PERSISTENT SHELL — it mounts once and never unmounts, so
  Lenis smooth-scroll + chrome persist while only the page content transitions.
*/
export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <StorefrontHome /> },
        { path: "build", element: <BuilderPage /> },
        { path: "about", element: <AboutPage /> },
      ],
    },
    { path: "/kiosk", element: <KioskPage /> },
    { path: "/party/:sessionId?", element: <PartyPage /> },
  ],
  // Honor Vite's base so deep links work under a sub-path (e.g. GitHub Pages).
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);
