import { PRODUCTS } from "@/data/products";
import { buildFromProduct } from "@/data/build";
import type { BuildConfig } from "@/data/types";
import { Sheet } from "@/components/ui/Sheet";
import { ProductMedia } from "@/features/menu/ProductMedia";

/*
  "Start from a Favorite" — the killer feature that fuses the menu and the
  builder. Load a known menu candle, then tweak it.
*/
export function FavoritePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (cfg: BuildConfig) => void;
}) {
  const favorites = PRODUCTS.filter((p) => p.recipe);
  return (
    <Sheet open={open} onClose={onClose} label="Start from a favorite">
      <div className="px-6 pb-8 pt-2">
        <h3 className="mb-1 font-display text-2xl text-espresso">Start from a favorite</h3>
        <p className="mb-5 text-sm text-muted">Pick one off the case, then make it yours.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {favorites.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onPick(buildFromProduct(p.id));
                onClose();
              }}
              className="overflow-hidden rounded-2xl border hairline bg-porcelain/70 text-left transition-shadow hover:shadow-[var(--shadow-soft)]"
            >
              <div className="aspect-square w-full overflow-hidden">
                <ProductMedia product={p} />
              </div>
              <span className="block px-3 py-2 font-display text-sm text-espresso">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
