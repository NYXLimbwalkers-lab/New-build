import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildFromProduct } from "@/data/build";
import { db } from "@/db/db";
import { CandleBar } from "@/features/builder/CandleBar";
import { useDocumentTitle } from "@/lib/useTitle";

export function BuilderPage() {
  useDocumentTitle("The Candle Bar — build your own", "Design a custom dessert candle: vessel, layers, scent blend, whipped top, drizzle and toppings.");
  const [params] = useSearchParams();
  const from = params.get("from");
  const creationId = params.get("creation");

  // Editing a saved creation (async load from IndexedDB).
  const creation = useLiveQuery(
    () => (creationId ? db.builds.get(creationId) : undefined),
    [creationId],
  );

  const initial = useMemo(
    () => (from ? buildFromProduct(from) : undefined),
    [from],
  );

  const loadingCreation = !!creationId && creation === undefined;
  const initialConfig = creation?.config ?? initial;
  const key = creationId ?? from ?? "blank";

  return (
    <div className="pt-2">
      <div className="mx-auto max-w-6xl px-5 pt-4">
        <p className="label-caps">The Candle Bar</p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">
          {creationId ? "Tweak your creation" : "Build your own"}
        </h1>
      </div>
      {loadingCreation ? (
        <div className="py-24 text-center font-serif text-lg text-muted">
          Loading your creation…
        </div>
      ) : (
        <CandleBar key={key} initial={initialConfig} />
      )}
    </div>
  );
}
