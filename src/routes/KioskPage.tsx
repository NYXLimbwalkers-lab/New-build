import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ModeContext } from "@/lib/mode";
import { SmoothScroll } from "@/lib/SmoothScroll";
import { CandleBar } from "@/features/builder/CandleBar";
import { CandleRenderer } from "@/features/builder/renderer";
import { surpriseBuild } from "@/data/build";
import { Button } from "@/components/ui/Button";

/*
  PHASE 3 — KIOSK MODE (scaffold).
  Locked full-screen in-store experience: an attract/idle loop that resets on
  touch, and inactivity auto-reset. Wire up: standalone PWA lock (no browser
  chrome), order-ticket-to-counter, pay toggle, offline order queue, ASMR audio.
  Implemented now: the attract loop + inactivity reset around the live builder.
*/
const IDLE_MS = 60_000;

export function KioskPage() {
  const [attract, setAttract] = useState(true);
  const [nonce, setNonce] = useState(0); // bump to fully reset the builder
  const timer = useRef<number | undefined>(undefined);

  function poke() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setAttract(true);
      setNonce((n) => n + 1); // TODO(Phase 3): also clear cart/session
    }, IDLE_MS);
  }

  useEffect(() => {
    if (attract) return;
    poke();
    return () => window.clearTimeout(timer.current);
  }, [attract]);

  return (
    <ModeContext.Provider value="kiosk">
      <SmoothScroll>
        <div
          className="min-h-screen"
          onPointerDown={() => !attract && poke()}
          onKeyDown={() => !attract && poke()}
        >
          <AnimatePresence>
            {attract && <AttractLoop key="attract" onTouch={() => setAttract(false)} />}
          </AnimatePresence>

          {!attract && (
            <div className="pt-6">
              <div className="mx-auto max-w-6xl px-5 text-center">
                <p className="label-caps">DéLa Já · In-store Candle Bar</p>
                <h1 className="font-display text-4xl text-espresso">Build your own</h1>
              </div>
              <CandleBar key={nonce} />
            </div>
          )}
        </div>
      </SmoothScroll>
    </ModeContext.Provider>
  );
}

/** Auto-playing attract reel — resets on touch. (ASMR video drops in here.) */
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
      <p className="label-caps !tracking-[0.4em] text-gold">DéLa Já</p>
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
