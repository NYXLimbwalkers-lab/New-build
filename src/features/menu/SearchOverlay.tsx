import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PRODUCTS } from "@/data/products";
import { CATEGORY_NAME } from "@/data/categories";
import { formatUSD } from "@/data/build";
import { ProductMedia } from "./ProductMedia";

/*
  Persistent search with predictive results — the #1 navigation item in the UX
  audit (exposed search drives usage). Matches name, scent family, category,
  looks/smells text.
*/
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return PRODUCTS.filter((p) =>
      [p.name, p.scentFamily, CATEGORY_NAME[p.category], p.looksLike, p.smellsLike]
        .join(" ")
        .toLowerCase()
        .includes(term),
    ).slice(0, 8);
  }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-espresso/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass relative z-10 mt-20 h-fit w-full max-w-xl rounded-3xl p-5 mx-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center gap-3 border-b hairline pb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search candles, scents…"
                className="w-full bg-transparent font-serif text-lg text-espresso outline-none placeholder:text-muted"
              />
              <button onClick={onClose} className="text-sm text-muted hover:text-cocoa">
                Esc
              </button>
            </div>

            <div className="no-scrollbar mt-3 max-h-[50vh] overflow-y-auto">
              {q && results.length === 0 && (
                <p className="py-8 text-center font-serif text-plum">
                  Nothing matches "{q}" — try a scent like "vanilla" or "berry."
                </p>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onClose();
                    navigate(`/?product=${p.id}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-porcelain/70"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-blush-soft/30">
                    <ProductMedia product={p} />
                  </div>
                  <span className="flex-1">
                    <span className="block font-display text-base text-espresso">{p.name}</span>
                    <span className="block text-xs text-muted">{p.smellsLike}</span>
                  </span>
                  <span className="price text-cocoa">{formatUSD(p.price)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
