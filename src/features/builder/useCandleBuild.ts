import { useCallback, useMemo, useState } from "react";
import type { BuildConfig } from "@/data/types";
import {
  defaultBuild,
  isDrinkBuild,
  isMeltBuild,
  priceBuild,
  reconcile,
  surpriseBuild,
} from "@/data/build";

/*
  The Candle Bar's brain. Holds the live build, an undo history, and derives the
  price + the valid step sequence. All mutations run through `reconcile` so the
  build is ALWAYS producible (no hard errors — invisible rules, deep plan Part 6).
*/
export type StepId =
  | "vessel"
  | "wax"
  | "whip"
  | "drizzle"
  | "toppings"
  | "finish";

const STEP_LABEL: Record<StepId, string> = {
  vessel: "Vessel",
  wax: "Wax & Scent",
  whip: "Whip",
  drizzle: "Drizzle",
  toppings: "Toppings",
  finish: "Finish",
};

export function useCandleBuild(initial?: BuildConfig) {
  // Reconcile the initial config so builds saved before the per-part-scent
  // refactor (missing layerScents/whipScentId/toppingScents) are healed before
  // the first render — otherwise WaxStep would read undefined arrays and throw.
  const [config, setConfig] = useState<BuildConfig>(() =>
    reconcile(initial ?? defaultBuild()),
  );
  const [history, setHistory] = useState<BuildConfig[]>([]);
  // Which wax layer the guest is editing — lives HERE (not in WaxStep) so
  // leaving the wax step and coming back doesn't silently reset it to Base
  // and land edits on the wrong layer.
  const [activeLayer, setActiveLayer] = useState(0);

  const update = useCallback((patch: Partial<BuildConfig>) => {
    setConfig((prev) => {
      setHistory((h) => [...h.slice(-30), prev]);
      return reconcile({ ...prev, ...patch });
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setConfig(prev);
      return h.slice(0, -1);
    });
  }, []);

  const surprise = useCallback(() => {
    setConfig((prev) => {
      setHistory((h) => [...h.slice(-30), prev]);
      return surpriseBuild();
    });
  }, []);

  const loadFrom = useCallback((cfg: BuildConfig) => {
    setConfig((prev) => {
      setHistory((h) => [...h.slice(-30), prev]);
      return reconcile(cfg);
    });
  }, []);

  // Gel "drink" builds skip whip/drizzle/toppings; flameless MELTS keep
  // toppings (embeds) but skip whip/drizzle. Steps adapt to the vessel.
  const steps = useMemo<StepId[]>(() => {
    if (isDrinkBuild(config)) return ["vessel", "wax", "finish"];
    if (isMeltBuild(config)) return ["vessel", "wax", "toppings", "finish"];
    return ["vessel", "wax", "whip", "drizzle", "toppings", "finish"];
  }, [config]);

  const price = useMemo(() => priceBuild(config), [config]);

  return {
    config,
    update,
    undo,
    surprise,
    loadFrom,
    steps,
    price,
    canUndo: history.length > 0,
    activeLayer,
    setActiveLayer,
  };
}

export { STEP_LABEL };
