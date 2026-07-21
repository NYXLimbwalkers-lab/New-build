import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ModeContext } from "@/lib/mode";
import { SmoothScroll } from "@/lib/SmoothScroll";
import { CandleBar } from "@/features/builder/CandleBar";
import { CandleRenderer } from "@/features/builder/renderer";
import { surpriseBuild, formatUSD } from "@/data/build";
import { db, logEvent } from "@/db/db";
import { getAdapter } from "@/features/commerce";
import { addPoints } from "@/features/loyalty/loyalty";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/useTitle";

/*
  PHASE 3 — KIOSK MODE.
  Locked full-screen in-store experience: attract/idle loop, inactivity
  auto-reset, fullscreen + screen wake-lock, and an order-ticket-to-counter
  flow with a pay toggle. Offline-first (writes orders to IndexedDB; a Phase-2
  commerce adapter syncs + takes card payment). Real, shippable plumbing.
*/
const IDLE_MS = 60_000;

async function goFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch {
    /* user/though browser may block; harmless */
  }
}

export function KioskPage() {
  useDocumentTitle("In-store Candle Bar");
  const [attract, setAttract] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [ticket, setTicket] = useState<{ pickup: number; total: number; items: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Keep the screen awake while the kiosk is active.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const req = async () => {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        /* unsupported */
      }
    };
    req();
    const onVis = () => document.visibilityState === "visible" && req();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  function reset() {
    setTicket(null);
    setAttract(true);
    setNonce((n) => n + 1);
    db.cart.clear();
  }

  function poke() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(reset, IDLE_MS);
  }

  useEffect(() => {
    // Don't auto-reset while the attract loop is up OR while a ticket is on
    // screen (let the customer read their pickup number in peace).
    if (attract || ticket) return;
    poke();
    return () => window.clearTimeout(timer.current);
  }, [attract, ticket]);

  const placingRef = useRef(false);
  async function complete() {
    if (placingRef.current) return; // guard double-tap
    const items = await db.cart.toArray();
    if (items.length === 0) return; // never mint an empty $0 order / pickup #
    placingRef.current = true;
    try {
      const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const result = await getAdapter().placeOrder({
        items,
        total,
        mode: "kiosk",
        fulfillment: "pickup",
      });
      const pickup = result.pickupNumber ?? 0;
      logEvent("kiosk_order", { total, pickup }, "kiosk");
      addPoints(total);
      await db.cart.clear();
      setTicket({ pickup, total, items: items.reduce((s, i) => s + i.qty, 0) });
    } finally {
      placingRef.current = false;
    }
  }

  return (
    <ModeContext.Provider value="kiosk">
      <SmoothScroll>
        <div
          className="min-h-screen"
          onPointerDown={() => !attract && poke()}
          onKeyDown={() => !attract && poke()}
        >
          <AnimatePresence>
            {attract && (
              <AttractLoop
                key="attract"
                onTouch={() => {
                  goFullscreen();
                  setAttract(false);
                }}
              />
            )}
          </AnimatePresence>

          {!attract && !ticket && (
            <div className="pt-6">
              <div className="mx-auto max-w-6xl px-5 text-center">
                <p className="label-caps">DéLa Já · In-store Candle Bar</p>
                <h1 className="font-display text-4xl text-espresso">Build your own</h1>
              </div>
              <CandleBar key={nonce} onComplete={complete} />
            </div>
          )}

          <AnimatePresence>
            {ticket && <Ticket key="ticket" {...ticket} onReset={reset} />}
          </AnimatePresence>
        </div>
      </SmoothScroll>
    </ModeContext.Provider>
  );
}

function Ticket({
  pickup,
  total,
  items,
  onReset,
}: {
  pickup: number;
  total: number;
  items: number;
  onReset: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-md rounded-3xl border border-gold/40 bg-porcelain p-8 text-center shadow-[var(--shadow-lift)]">
        <p className="label-caps !tracking-[0.3em] text-gold-ink">Order placed ✦</p>
        <p className="mt-4 font-serif text-lg text-plum">Your pickup number</p>
        <p className="my-2 font-display text-7xl text-espresso">{pickup}</p>
        <p className="text-sm text-muted">
          {items} item{items === 1 ? "" : "s"} · {formatUSD(total)}
        </p>

        {/* On-screen payment (Square Terminal) plugs in via the commerce
            adapter at launch — until then, only the option that WORKS. */}
        <p className="mt-6 rounded-2xl border hairline bg-blush-soft/40 px-4 py-3 text-sm text-cocoa">
          Bring this number to the counter to pay — we'll start pouring.
        </p>

        <Button className="mt-6" variant="gold" size="lg" onClick={onReset}>
          Done
        </Button>
      </div>
    </motion.div>
  );
}

/** Auto-playing attract reel — resets on touch. */
function AttractLoop({ onTouch }: { onTouch: () => void }) {
  const [build, setBuild] = useState(surpriseBuild);
  useEffect(() => {
    const id = window.setInterval(() => setBuild(surpriseBuild()), 3500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.button
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas"
      onClick={onTouch}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="label-caps !tracking-[0.4em] text-gold-ink">DéLa Já</p>
      <h2 className="mb-2 font-display text-5xl text-espresso">The Candle Patisserie</h2>
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(build)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6 }}
          >
            <CandleRenderer config={build} revealed />
          </motion.div>
        </AnimatePresence>
      </div>
      <Button variant="gold" size="lg" className="mt-4">
        Tap to begin ✦
      </Button>
    </motion.button>
  );
}
