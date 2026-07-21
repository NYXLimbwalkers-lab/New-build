import type { BuildConfig } from "@/data/types";

/*
  SWAPPABLE PREVIEW-ENGINE CONTRACT.
  The Candle Bar talks to the preview only through this contract, so a future
  three.js / WebGL / real-transparent-PNG renderer can replace the current
  SVG renderer WITHOUT touching the step flow. (Deep plan, Part 8.)
*/
export interface RendererProps {
  config: BuildConfig;
  /** Plays the "reveal" — wick lights, glow blooms, shimmer sweep. */
  revealed?: boolean;
  /** Larger, calmer presentation for the share card / kiosk hero. */
  showcase?: boolean;
  className?: string;
}

export type CandleRenderer = (props: RendererProps) => React.ReactNode;
