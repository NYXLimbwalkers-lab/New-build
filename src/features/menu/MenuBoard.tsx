import { motion, LayoutGroup } from "motion/react";
import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId, Product, ScentFamily } from "@/data/types";
import { Chip } from "@/components/ui/Chip";
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import { SeasonalRail } from "./SeasonalRail";
import { STAGGER } from "@/lib/motionPresets";

const SCENT_FILTERS: (ScentFamily | "All")[] = [
  "All",
  "Dessert",
  "Bakery",
  "Fruity",
  "Fresh",
  "Woody",
  "Boozy",
];

/*
  The dessert-case menu board — her real catalog, by category, with a scent
  filter and a seasonal rail surfaced by today's date. Cards morph into the
  detail sheet via shared layout. Filtering re-flows with a graceful stagger.
*/
export function MenuBoard() {
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [scent, setScent] = useState<ScentFamily | "All">("All");
  const [selected, setSelected] = useState<Product | null>(null);

  const visible = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (scent === "All" || p.scentFamily === scent),
      ),
    [category, scent],
  );

  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 py-10">
      <SeasonalRail onOpen={setSelected} />

      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-3xl text-espresso">The Dessert Case</h2>
          <p className="mt-1 font-serif text-lg text-plum">
            Pick one off the shelf — or tap a favorite and make it your own.
          </p>
        </div>

        {/* category nav */}
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>

        {/* scent filter */}
        <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5">
          <span className="label-caps shrink-0">Scent</span>
          {SCENT_FILTERS.map((s) => (
            <Chip key={s} active={scent === s} onClick={() => setScent(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <LayoutGroup>
        <motion.div
          layout
          variants={STAGGER.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
        >
          {visible.map((p) => (
            <motion.div key={p.id} layout variants={STAGGER.item}>
              <ProductCard product={p} onOpen={setSelected} />
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>

      {visible.length === 0 && (
        <p className="py-16 text-center font-serif text-lg text-muted">
          Nothing in that pairing just yet — try another scent.
        </p>
      )}

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
