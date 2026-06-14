import { useCallback, useMemo, useState } from "react";
import type { BuildConfig } from "@/data/types";
import {
  defaultBuild,
  isDrinkBuild,
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
  const [config, setConfig] = useState<BuildConfig>(initial ?? defaultBuild());
  const [history, setHistory] = useState<BuildConfig[]>([]);

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

  // Gel "drink" builds skip whip/drizzle/toppings — those steps aren't shown.
  const steps = useMemo<StepId[]>(() => {
    const drink = isDrinkBuild(config);
    return drink
      ? ["vessel", "wax", "finish"]
      : ["vessel", "wax", "whip", "drizzle", "toppings", "finish"];
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
  };
}

export { STEP_LABEL };
