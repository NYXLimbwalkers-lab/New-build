import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCartUI } from "./CartContext";
import {
  useCart,
  setQty,
  removeFromCart,
  clearCart,
  addProductToCart,
  FREE_SHIP_THRESHOLD,
} from "./cart";
import { formatUSD } from "@/data/build";
import { db, logEvent } from "@/db/db";
import { Button } from "@/components/ui/Button";
import { CandleRenderer } from "@/features/builder/renderer";
import { PRODUCT_BY_ID } from "@/data/products";
import { ProductMedia } from "@/features/menu/ProductMedia";
import { cn } from "@/lib/cn";

const GIFT_WRAP = 5;
// Gentle "complete the set" cross-sell — small add-ons that lift AOV.
const CROSS_SELL_IDS = ["car-diffuser", "banana-pudding", "body-butters"];

/*
  Slide-out cart (Baymard: drawer cart + free-shipping progress bar lift AOV and
  fight the #1 abandonment cause). Gift note + wrap surfaced here (gifting is a
  core use case). Checkout writes a local order; the Phase-2 commerce adapter
  takes over payment.
*/
export function CartDrawer() {
  const { open, setOpen } = useCartUI();
  const cart = useCart();
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (open) setPlaced(false);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const giftTotal = giftWrap ? GIFT_WRAP : 0;
  const total = cart.subtotal + giftTotal;

  async function checkout() {
    // TODO(Phase 2): hand off to the commerce adapter (WooCommerce/Square) for
    // real payment. For now we record a made-to-order request locally.
    await db.orders.add({
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      items: cart.items,
      total,
      mode: "storefront",
      createdAt: Date.now(),
      synced: false,
    });
    logEvent("checkout", { total, items: cart.count }, "storefront");
    await clearCart();
    setPlaced(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-espresso/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="glass relative z-10 flex h-full w-full max-w-md flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
          >
            <header className="flex items-center justify-between border-b hairline px-5 py-4">
              <h2 className="font-display text-2xl text-espresso">Your Bag</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-muted hover:text-cocoa"
                aria-label="Close bag"
              >
                Close ✕
              </button>
            </header>

            {placed ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="font-display text-3xl text-espresso">Thank you ✦</p>
                <p className="mt-3 font-serif text-lg text-plum">
                  Your made-to-order request is in. She'll hand-pour it and reach out
                  to confirm pickup or shipping.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setOpen(false)}>
                  Keep browsing
                </Button>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="font-serif text-xl text-plum">Your bag is empty.</p>
                <p className="mt-2 text-sm text-muted">
                  Pick a candle off the case, or build your own at the Candle Bar.
                </p>
                <Button className="mt-6" variant="gold" onClick={() => setOpen(false)}>
                  Start browsing
                </Button>
              </div>
            ) : (
              <>
                {/* free-shipping progress */}
                <div className="px-5 pt-4">
                  <p className="text-center text-xs text-cocoa">
                    {cart.qualifiesFreeShipping ? (
                      <span className="text-emerald">You've earned free shipping ✦</span>
                    ) : (
                      <>
                        You're{" "}
                        <span className="price">{formatUSD(cart.toFreeShipping)}</span> from
                        free shipping
                      </>
                    )}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas-deep">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blush to-gold"
                      initial={false}
                      animate={{ width: `${cart.freeShippingPct}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    />
                  </div>
                </div>

                {/* line items */}
                <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b hairline py-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-blush-soft/30">
                        {item.kind === "build" && item.config ? (
                          <CandleRenderer config={item.config} />
                        ) : item.kind === "bundle" ? (
                          <div className="flex h-full w-full items-center justify-center text-2xl">🎁</div>
                        ) : (
                          PRODUCT_BY_ID[item.refId] && (
                            <ProductMedia product={PRODUCT_BY_ID[item.refId]} />
                          )
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <span className="font-display text-base leading-tight text-espresso">
                            {item.name}
                          </span>
                          <span className="price text-cocoa">
                            {formatUSD(item.unitPrice * item.qty)}
                          </span>
                        </div>
                        <span className="mt-0.5 text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                          {item.kind === "build"
                            ? "Custom · Candle Bar"
                            : item.kind === "bundle"
                              ? "Gift set"
                              : "From the case"}
                        </span>
                        <div className="mt-auto flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full border hairline px-2 py-0.5">
                            <button
                              onClick={() => setQty(item.id, item.qty - 1)}
                              className="px-1 text-cocoa"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-4 text-center text-sm">{item.qty}</span>
                            <button
                              onClick={() => setQty(item.id, item.qty + 1)}
                              className="px-1 text-cocoa"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-muted hover:text-rose"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* gift options */}
                  <div className="mt-4 rounded-2xl border hairline bg-porcelain/50 p-4">
                    <button
                      onClick={() => setGiftWrap(!giftWrap)}
                      className="flex w-full items-center justify-between"
                    >
                      <span className="text-sm text-cocoa">
                        🎀 Gift wrap it{" "}
                        <span className="text-muted">+{formatUSD(GIFT_WRAP)}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem]",
                          giftWrap ? "border-gold bg-gold text-canvas" : "hairline",
                        )}
                      >
                        {giftWrap && "✓"}
                      </span>
                    </button>
                    {giftWrap && (
                      <textarea
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        maxLength={200}
                        placeholder="Add a gift note…"
                        className="mt-3 w-full resize-none rounded-xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                        rows={2}
                      />
                    )}
                  </div>

                  <CrossSell inCart={cart.items.map((i) => i.refId)} />
                </div>

                {/* footer */}
                <footer className="border-t hairline px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-caps">Subtotal</span>
                    <span className="price text-xl text-espresso">{formatUSD(total)}</span>
                  </div>
                  <Button variant="primary" size="lg" className="w-full" onClick={checkout}>
                    Place made-to-order request
                  </Button>
                  <p className="mt-2 text-center text-[0.65rem] text-muted">
                    Hand-poured to order · pay at pickup or we'll send a secure link.
                    Free shipping over {formatUSD(FREE_SHIP_THRESHOLD)}.
                  </p>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "Complete the set" — gentle small add-ons, no judgment (kiosk effect). */
function CrossSell({ inCart }: { inCart: string[] }) {
  const picks = CROSS_SELL_IDS.map((id) => PRODUCT_BY_ID[id]).filter(
    (p) => p && !inCart.includes(p.id),
  );
  if (picks.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="label-caps mb-2">Complete the set</p>
      <div className="space-y-2">
        {picks.slice(0, 2).map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border hairline bg-porcelain/50 p-2"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-blush-soft/30">
              <ProductMedia product={p} />
            </div>
            <span className="flex-1 text-sm text-cocoa">{p.name}</span>
            <span className="price text-xs text-muted">{formatUSD(p.price)}</span>
            <button
              onClick={() => addProductToCart(p)}
              className="rounded-full bg-cocoa px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-canvas hover:bg-espresso"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
