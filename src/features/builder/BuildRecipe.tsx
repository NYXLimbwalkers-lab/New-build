import type { BuildConfig } from "@/data/types";
import { describeBuild } from "@/data/build";

/*
  Renders the full build recipe (each layer's color + scent, whip/drizzle/topping
  scents, strength, wick). Used wherever someone needs to KNOW what to pour —
  the cart, the owner dashboard, the party make-&-take card.
*/
export function BuildRecipe({
  config,
  className,
}: {
  config: BuildConfig;
  className?: string;
}) {
  const lines = describeBuild(config);
  return (
    <dl className={className}>
      {lines.map(([label, value], i) => (
        <div key={i} className="flex justify-between gap-3 py-0.5 text-xs">
          <dt className="shrink-0 uppercase tracking-[0.12em] text-muted">{label}</dt>
          <dd className="text-right text-cocoa">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
