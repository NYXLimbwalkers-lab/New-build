import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation, useOutlet } from "react-router-dom";
import { SPRING } from "@/lib/motionPresets";

/** Feature-detect the View Transitions API once. */
const supportsViewTransitions =
  typeof document !== "undefined" && "startViewTransition" in document;

/*
  The seam-hiding layer. We never let BOTH engines drive the same swap:
  - When the browser supports View Transitions, react-router's `viewTransition`
    prop on <Link> drives document.startViewTransition() and our ::view-transition
    CSS animates the crossfade + shared product-image morph. We just render Outlet.
  - Otherwise we fall back to Motion's AnimatePresence (keyed on pathname) for a
    graceful fade+rise so older browsers still feel continuous.
*/
export function TransitionOutlet() {
  if (supportsViewTransitions) return <Outlet />;
  return <MotionFallback />;
}

function MotionFallback() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={SPRING.glide}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
