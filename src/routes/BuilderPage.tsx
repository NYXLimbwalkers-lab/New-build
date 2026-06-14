import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { buildFromProduct } from "@/data/build";
import { CandleBar } from "@/features/builder/CandleBar";

export function BuilderPage() {
  const [params] = useSearchParams();
  const from = params.get("from");
  const initial = useMemo(
    () => (from ? buildFromProduct(from) : undefined),
    [from],
  );

  return (
    <div className="pt-2">
      <div className="mx-auto max-w-6xl px-5 pt-4">
        <p className="label-caps">The Candle Bar</p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">
          Build your own
        </h1>
      </div>
      {/* key on `from` so a fresh favorite re-seeds the whole build cleanly */}
      <CandleBar key={from ?? "blank"} initial={initial} />
    </div>
  );
}
