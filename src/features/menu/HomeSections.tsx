import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { type: "spring", stiffness: 190, damping: 30 },
} as const;

/*
  Brand story — made-to-order warmth, said with grace (the way Prose owns
  "made-to-order"). Veteran-founded, mom-owned, hand-poured, small-batch.
*/
export function BrandStory() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <motion.div {...reveal}>
        <span className="label-caps">Our little kitchen</span>
        <h2 className="mt-4 font-display text-3xl leading-snug text-espresso sm:text-4xl">
          Every candle is whipped, poured and finished
          <span className="italic text-rose"> by hand</span> — the day it's ordered.
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-serif text-xl leading-relaxed text-plum">
          We're a veteran-founded, mom-owned little batch shop in Great Falls,
          South Carolina. No warehouse, no shortcuts — just real soy wax, lead-free
          cotton wicks, and the kind of attention you only get when someone makes
          your candle like it's going on her own shelf.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 label-caps">
          <span>Veteran-founded</span>
          <span className="text-gold" aria-hidden>✦</span>
          <span>Mom-owned</span>
          <span className="text-gold" aria-hidden>✦</span>
          <span>Made to order</span>
        </div>
      </motion.div>
    </section>
  );
}

/*
  "How the Candle Bar works" — a content teaser that sells the experience and
  leads into the builder.
*/
const STEPS = [
  {
    n: "01",
    title: "Pick your base",
    body: "Choose a vessel and pour the wax in your color. This is your canvas.",
  },
  {
    n: "02",
    title: "Whip, drizzle, top",
    body: "Pipe on whipped 'ice cream,' ribbon a drizzle, scatter the toppings you love.",
  },
  {
    n: "03",
    title: "Name it & take it home",
    body: "Give it a name, light the reveal, and we hand-pour the real thing for you.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <span className="label-caps">The Candle Bar</span>
        <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
          Build one in three sweet steps
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            {...reveal}
            transition={{ ...reveal.transition, delay: i * 0.08 }}
            className="relative rounded-3xl border hairline bg-porcelain/60 p-7 text-center"
          >
            <span className="font-display text-4xl text-gold/70">{s.n}</span>
            <h3 className="mt-3 font-display text-xl text-espresso">{s.title}</h3>
            <p className="mt-2 font-serif text-lg leading-relaxed text-plum">{s.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/build" viewTransition>
          <Button variant="gold" size="lg">
            Step up to the Candle Bar
          </Button>
        </Link>
      </div>
    </section>
  );
}
