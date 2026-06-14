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
import { logEvent } from "@/db/db";
import { getAdapter } from "@/features/commerce";
import { addPoints } from "@/features/loyalty/loyalty";
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
  const [isGift, setIsGift] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [giftReceipt, setGiftReceipt] = useState(false);
  const [fulfillment, setFulfillment] = useState<"ship" | "pickup">("ship");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [earnedPts, setEarnedPts] = useState(0);

  useEffect(() => {
    if (open) setPlaced(false);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const giftTotal = isGift && giftWrap ? GIFT_WRAP : 0;
  const total = cart.subtotal + giftTotal;

  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.trim());
  const isPhone = contact.replace(/\D/g, "").length >= 10;
  const needsAddress = fulfillment === "ship";
  const canCheckout =
    name.trim().length > 1 &&
    (isEmail || isPhone) &&
    (!needsAddress || address.trim().length > 8);

  async function checkout() {
    if (!canCheckout) return;
    // Single seam: the configured adapter records/syncs the order and takes
    // payment when one is connected (local made-to-order queue by default).
    const result = await getAdapter().placeOrder({
      items: cart.items,
      total,
      mode: "storefront",
      fulfillment,
      gift: isGift
        ? { wrap: giftWrap, note: giftNote, recipient, receipt: giftReceipt }
        : undefined,
      contact: {
        name: name.trim(),
        email: isEmail ? contact.trim() : undefined,
        phone: isPhone ? contact.trim() : undefined,
        address: needsAddress ? address.trim() : undefined,
      },
    });
    logEvent("checkout", { total, items: cart.count, gift: isGift, fulfillment }, "storefront");
    await clearCart();
    const earned = addPoints(total);
    setOrderNo(result.orderNo);
    setEarnedPts(earned);
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
                {orderNo && (
                  <p className="mt-2 rounded-full bg-blush-soft/50 px-4 py-1.5 text-sm text-cocoa">
                    Order {orderNo}
                  </p>
                )}
                <p className="mt-3 font-serif text-lg text-plum">
                  Your made-to-order request is in. She'll hand-pour it and reach out
                  to confirm pickup or shipping.
                </p>
                {earnedPts > 0 && (
                  <p className="mt-3 text-sm text-cocoa">
                    You earned <span className="text-gold">{earnedPts} Candle Club points</span> ✦
                  </p>
                )}
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
                          <div className="flex items-center gap-1 rounded-full border hairline">
                            <button
                              onClick={() => setQty(item.id, item.qty - 1)}
                              className="flex h-9 w-9 items-center justify-center text-xl leading-none text-cocoa"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-base">{item.qty}</span>
                            <button
                              onClick={() => setQty(item.id, item.qty + 1)}
                              className="flex h-9 w-9 items-center justify-center text-xl leading-none text-cocoa"
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

                  {/* gifting */}
                  <div className="mt-4 rounded-2xl border hairline bg-porcelain/50 p-4">
                    <button
                      onClick={() => setIsGift(!isGift)}
                      className="flex w-full items-center justify-between"
                    >
                      <span className="text-sm text-cocoa">🎁 Send as a gift</span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem]",
                          isGift ? "border-gold bg-gold text-canvas" : "hairline",
                        )}
                      >
                        {isGift && "✓"}
                      </span>
                    </button>
                    {isGift && (
                      <div className="mt-3 space-y-2">
                        <input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Recipient's name"
                          className="w-full rounded-xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                        />
                        <textarea
                          value={giftNote}
                          onChange={(e) => setGiftNote(e.target.value)}
                          maxLength={200}
                          placeholder="Gift message…"
                          className="w-full resize-none rounded-xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                          rows={2}
                        />
                        <label className="flex cursor-pointer items-center justify-between text-sm text-cocoa">
                          <span>🎀 Gift wrap <span className="text-muted">+{formatUSD(GIFT_WRAP)}</span></span>
                          <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="accent-gold" />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between text-sm text-cocoa">
                          <span>🧾 Gift receipt <span className="text-muted">(hide prices)</span></span>
                          <input type="checkbox" checked={giftReceipt} onChange={(e) => setGiftReceipt(e.target.checked)} className="accent-gold" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* contact — how she confirms your made-to-order request */}
                  <div className="mt-4 rounded-2xl border hairline bg-porcelain/50 p-4">
                    <p className="text-sm text-cocoa">Where should she reach you?</p>
                    <p className="mt-0.5 text-xs text-muted">
                      So she can confirm your candle and let you know it's ready.
                    </p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="mt-3 w-full rounded-xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                    />
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Email or phone"
                      autoComplete="email"
                      className="mt-2 w-full rounded-xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                    />
                  </div>

                  {/* fulfillment */}
                  <div className="mt-3 flex gap-2">
                    {(["ship", "pickup"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFulfillment(f)}
                        className={cn(
                          "flex-1 rounded-2xl border py-2.5 text-xs uppercase tracking-[0.14em] transition-colors",
                          fulfillment === f ? "border-gold bg-blush-soft/50 text-espresso" : "hairline text-muted",
                        )}
                      >
                        {f === "ship" ? "Ship it" : "Local pickup"}
                      </button>
                    ))}
                  </div>

                  {needsAddress && (
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shipping address — street, city, state, ZIP"
                      autoComplete="shipping street-address"
                      rows={3}
                      className="mt-2 w-full resize-none rounded-2xl border hairline bg-porcelain px-3 py-2 text-sm text-cocoa outline-none focus:border-gold"
                    />
                  )}

                  <CrossSell inCart={cart.items.map((i) => i.refId)} />
                </div>

                {/* footer */}
                <footer className="border-t hairline px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-caps">Subtotal</span>
                    <span className="price text-xl text-espresso">{formatUSD(total)}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={checkout}
                    disabled={!canCheckout}
                  >
                    Place made-to-order request
                  </Button>
                  <p className="mt-2 text-center text-[0.65rem] text-muted">
                    {canCheckout
                      ? "Hand-poured to order · pay at pickup or we'll send a secure link."
                      : "Add your name and an email or phone to continue."}{" "}
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
