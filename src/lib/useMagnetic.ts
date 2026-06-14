import { useRef, useCallback } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

/*
  Subtle magnetic cursor-follow for premium tiles — mouse only, restrained pull.
  Verified config: soft spring {stiffness 150, damping 22, mass 0.18}, pull ~0.25,
  clamped so it never flies away. Disabled for touch + reduced-motion.
*/
const SPRING = { stiffness: 150, damping: 22, mass: 0.18 };
const PULL = 0.22;
const MAX = 10;

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (reduce || e.pointerType !== "mouse" || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * PULL;
      const dy = (e.clientY - (r.top + r.height / 2)) * PULL;
      x.set(Math.max(-MAX, Math.min(MAX, dx)));
      y.set(Math.max(-MAX, Math.min(MAX, dy)));
    },
    [reduce, x, y],
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    ref,
    style: { x: sx, y: sy },
    onPointerMove,
    onPointerLeave: reset,
  };
}
