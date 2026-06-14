import { ReactLenis, type LenisRef } from "lenis/react";
import { frame, cancelFrame, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import "lenis/dist/lenis.css";

/*
  Lenis smooth scroll = the foundation of the "continuous gliding canvas".
  Critical detail (from the research): drive Lenis from Motion's single `frame`
  loop (autoRaf:false) so smooth-scroll, useScroll, and every spring tick share
  ONE render loop — this is what removes micro-jitter.

  Tuning: lerp 0.08 is the luxury sweet spot ("premium without feeling laggy").
  Reduced-motion users get native scroll (lerp 1, no wheel smoothing).
*/
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true); // keepAlive — run every frame
    return () => cancelFrame(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: reduce ? 1 : 0.08,
        smoothWheel: !reduce,
        wheelMultiplier: 1,
        syncTouch: false, // let native mobile momentum do its thing
        anchors: true, // smooth in-page anchor links
      }}
    >
      {children}
    </ReactLenis>
  );
}
