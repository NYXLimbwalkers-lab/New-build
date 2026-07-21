import { useEffect, useState } from "react";

/*
  PWA install prompt — captures the browser's beforeinstallprompt and offers a
  tasteful "Install" button (great for phones and the in-store kiosk). No-ops on
  browsers that don't support it or when already installed.
*/
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("delaja-install-dismissed") === "1",
  );

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!evt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full border border-gold/40 bg-porcelain px-3 py-2 shadow-[var(--shadow-lift)] print:hidden">
      <button
        onClick={async () => {
          await evt.prompt();
          await evt.userChoice.catch(() => {});
          setEvt(null);
        }}
        className="rounded-full bg-cocoa px-4 py-2 text-xs uppercase tracking-[0.16em] text-canvas"
      >
        ✦ Install app
      </button>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem("delaja-install-dismissed", "1");
        }}
        aria-label="Dismiss install"
        className="px-1 text-muted hover:text-cocoa"
      >
        ✕
      </button>
    </div>
  );
}
