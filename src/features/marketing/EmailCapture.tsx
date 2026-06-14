import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { addLead, logEvent } from "@/db/db";

/*
  Email capture — the owned channel that fuels back-in-stock, abandoned-cart,
  and seasonal flows. TODO(Phase 5): connect to her ESP (Klaviyo/Mailchimp/
  Shopify Email). For now we log the intent locally.
*/
export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    addLead(email, "newsletter");
    logEvent("email_signup", { email }, "storefront");
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-sm">
      <p className="label-caps mb-2">Join the list</p>
      <p className="mb-4 font-serif text-lg text-plum">
        New scents, small-batch drops, and a little treat for your first order.
      </p>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.p
            key="thanks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-gold/40 bg-blush-soft/40 px-5 py-3 text-sm text-cocoa"
          >
            You're in ✦ Watch your inbox for something sweet.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-full border hairline bg-porcelain p-1.5"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-transparent px-3 py-1.5 text-sm text-espresso outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-cocoa px-4 py-2 text-xs uppercase tracking-[0.16em] text-canvas hover:bg-espresso"
            >
              Join
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
