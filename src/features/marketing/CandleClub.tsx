import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { addLead, logEvent } from "@/db/db";
import { toast } from "@/lib/toast";

/*
  "Candle of the Month" club — recurring-revenue interest capture. No payment
  rails yet, so we collect genuine interest (email + preferred plan) as a real,
  de-duped lead in IndexedDB and surface it in the Owner dashboard. When the
  subscription/billing adapter (Square/Stripe) is connected, these leads become
  the launch list.
*/
const PLANS = [
  { id: "monthly", label: "Monthly", note: "1 candle / month" },
  { id: "seasonal", label: "Seasonal", note: "4 drops / year" },
  { id: "gift-3", label: "3-Month Gift", note: "A sweet present" },
];

export function CandleClub() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("monthly");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast("Please enter a valid email.");
      return;
    }
    await addLead(email, "club", plan);
    logEvent("club_interest", { email, plan }, "storefront");
    setDone(true);
  }

  return (
    <section className="mx-auto my-20 max-w-3xl px-6">
      <div className="overflow-hidden rounded-[2.5rem] border hairline bg-gradient-to-br from-blush-soft/50 via-canvas to-porcelain/60 p-8 text-center shadow-[var(--shadow-lift)] sm:p-12">
        <p className="label-caps">Coming soon · Reserve your spot</p>
        <h2 className="mt-2 font-display text-3xl text-espresso sm:text-4xl">
          The Candle of the Month Club
        </h2>
        <p className="mx-auto mt-3 max-w-md font-serif text-lg leading-relaxed text-plum">
          A new hand-poured dessert candle on your doorstep, every month —
          small-batch scents you can't get anywhere else. Join the list and you'll
          be first in line when doors open.
        </p>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-8 max-w-sm rounded-2xl border border-gold/40 bg-canvas/70 px-6 py-5"
            >
              <p className="font-display text-xl text-espresso">You're on the list ✦</p>
              <p className="mt-1 font-serif text-plum">
                We saved your spot for the{" "}
                <span className="text-cocoa">
                  {PLANS.find((p) => p.id === plan)?.label}
                </span>{" "}
                plan. We'll reach out the moment the club opens.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              exit={{ opacity: 0 }}
              className="mx-auto mt-8 max-w-md"
            >
              <div
                className="flex flex-wrap justify-center gap-2"
                role="radiogroup"
                aria-label="Preferred plan"
              >
                {PLANS.map((p) => {
                  const active = plan === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlan(p.id)}
                      className={
                        "min-w-[7rem] rounded-2xl border px-4 py-3 text-center transition-colors " +
                        (active
                          ? "border-gold bg-canvas shadow-sm"
                          : "hairline bg-porcelain/50 hover:bg-porcelain")
                      }
                    >
                      <span className="block text-sm font-medium text-espresso">
                        {p.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{p.note}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border hairline bg-canvas p-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Email for the Candle Club"
                  className="w-full bg-transparent px-4 py-2 text-espresso outline-none placeholder:text-muted"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-cocoa px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-canvas hover:bg-espresso"
                >
                  Reserve
                </button>
              </div>
              <p className="mt-3 text-xs text-muted">
                No charge today — we'll only email you when the club opens.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
