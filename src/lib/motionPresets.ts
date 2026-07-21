import type { Transition } from "motion/react";

/*
  Named spring presets for a GRACEFUL, expensive feel — physics, never bouncy-
  cartoonish. Values verified against react-spring's reference presets and
  Motion's spring physics (damping ≥ ~2·√stiffness ⇒ no overshoot).
  Used across the app so motion reads as ONE coherent hand (Confiserie, Part 5).
*/

export const SPRING = {
  /** Default UI transition — soft, settled, no visible overshoot. */
  gentle: { type: "spring", stiffness: 220, damping: 30, mass: 1 },

  /** Page / panel glide — the slow "maneuvering around" feel. */
  glide: { type: "spring", stiffness: 190, damping: 34, mass: 1 },

  /** Tactile press/settle for tiles & chips — quick but refined. */
  settle: { type: "spring", stiffness: 420, damping: 30, mass: 0.8 },

  /** Swipe paging between steps — native-feeling, no bounce. */
  page: { type: "spring", stiffness: 300, damping: 34, mass: 0.9 },

  /** Wax pour — slow, weighty, viscous. */
  pour: { type: "spring", stiffness: 80, damping: 18, mass: 1.4 },

  /** Whip pipes on — soft rise with the faintest, elegant bounce. */
  pipe: { type: "spring", visualDuration: 0.5, bounce: 0.22 },

  /** Drizzle draws on — eased, glossy (path-length tween). */
  drizzle: { type: "tween", duration: 0.9, ease: [0.22, 0.61, 0.36, 1] },

  /** Topping drops in — gentle gravity with a graceful little settle. */
  drop: { type: "spring", visualDuration: 0.45, bounce: 0.3 },
} satisfies Record<string, Transition>;

/** Graceful fade + slide for content reveals (~300–400ms feel). */
export const FADE_SLIDE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: SPRING.glide,
} as const;

/** Orchestrated stagger for lists/grids of cards. */
export const STAGGER = {
  container: {
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: SPRING.glide },
  },
} as const;

/** Canonical swipe math (Motion image-slider): |offset| × velocity. */
export const SWIPE_CONFIDENCE = 8000;
export const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;
