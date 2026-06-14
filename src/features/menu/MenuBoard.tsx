import { motion, LayoutGroup } from "motion/react";
import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId, Product, ScentFamily } from "@/data/types";
import { Chip } from "@/components/ui/Chip";
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import { SeasonalRail } from "./SeasonalRail";
import { ScentQuiz } from "./ScentQuiz";
import { Button } from "@/components/ui/Button";
import { getRating } from "@/data/reviews";
import { STAGGER } from "@/lib/motionPresets";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "rating", label: "Top rated" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

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
  const [sort, setSort] = useState<SortKey>("featured");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const visible = useMemo(() => {
    const list = PRODUCTS.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (scent === "All" || p.scentFamily === scent),
    );
    const score = (p: Product) =>
      (p.badges?.includes("bestseller") ? 2 : 0) +
      (p.badges?.includes("staff-pick") ? 1 : 0);
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "rating":
        return [...list].sort(
          (a, b) => (getRating(b.id)?.avg ?? 0) - (getRating(a.id)?.avg ?? 0),
        );
      default:
        return [...list].sort((a, b) => score(b) - score(a));
    }
  }, [category, scent, sort]);

  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 py-10">
      <SeasonalRail onOpen={setSelected} />

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-espresso">The Dessert Case</h2>
            <p className="mt-1 font-serif text-lg text-plum">
              Pick one off the shelf — or tap a favorite and make it your own.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setQuizOpen(true)}>
            ✦ Find your scent
          </Button>
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

        {/* sort */}
        <div className="flex items-center justify-between">
          <span className="label-caps">{visible.length} candles</span>
          <div className="flex items-center gap-2">
            <span className="label-caps !tracking-[0.16em]">Sort</span>
            {SORTS.map((s) => (
              <Chip key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>
                {s.label}
              </Chip>
            ))}
          </div>
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
      <ScentQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </section>
  );
}
