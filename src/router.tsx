import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { RootLayout } from "./shell/RootLayout";

/*
  One codebase, three modes via routes/flags. Pages are code-split (lazy) so the
  initial load is light — the kiosk, party, admin and secondary pages only load
  when visited. The persistent RootLayout shell stays eager.
*/
const lz = <T extends { [k: string]: React.ComponentType }>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] })));

const StorefrontHome = lz(() => import("./routes/StorefrontHome"), "StorefrontHome");
const BuilderPage = lz(() => import("./routes/BuilderPage"), "BuilderPage");
const CreationsPage = lz(() => import("./routes/CreationsPage"), "CreationsPage");
const AdminPage = lz(() => import("./routes/AdminPage"), "AdminPage");
const AboutPage = lz(() => import("./routes/AboutPage"), "AboutPage");
const HelpPage = lz(() => import("./routes/HelpPage"), "HelpPage");
const KioskPage = lz(() => import("./routes/KioskPage"), "KioskPage");
const PartyPage = lz(() => import("./routes/PartyPage"), "PartyPage");

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-full bg-blush" />
    </div>
  );
}

const S = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="label-caps">404</p>
      <h1 className="mt-2 font-display text-4xl text-espresso">Page not found</h1>
      <p className="mt-3 font-serif text-lg text-plum">
        That page melted away. Let's get you back to the good stuff.
      </p>
      <Link
        to="/"
        viewTransition
        className="mt-6 inline-block rounded-full bg-cocoa px-6 py-3 text-sm uppercase tracking-[0.16em] text-canvas"
      >
        Back to the shop
      </Link>
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: S(<StorefrontHome />) },
        { path: "build", element: S(<BuilderPage />) },
        { path: "creations", element: S(<CreationsPage />) },
        { path: "admin", element: S(<AdminPage />) },
        { path: "about", element: S(<AboutPage />) },
        { path: "help", element: S(<HelpPage />) },
        { path: "*", element: <NotFound /> },
      ],
    },
    { path: "/kiosk", element: S(<KioskPage />) },
    { path: "/party/:sessionId?", element: S(<PartyPage />) },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);
