import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TrustBadges } from "@/components/TrustBadges";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { type: "spring", stiffness: 190, damping: 30 },
} as const;

/*
  Our Story — authentic brand page (premium differentiation; values surfaced as
  facts, not slogans). Editorial, warm, restrained.
*/
export function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-10 pt-10">
      <motion.header {...reveal} className="text-center">
        <span className="label-caps">Our story</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-espresso sm:text-5xl">
          A little candle kitchen with a
          <span className="italic text-rose"> big heart.</span>
        </h1>
      </motion.header>

      <motion.div {...reveal} className="mt-10 space-y-6 font-serif text-xl leading-relaxed text-plum">
        <p>
          DéLa Já started the way the best small things do — at a kitchen table, in
          Great Falls, South Carolina, with a veteran's discipline and a mom's eye for
          the little details that make people feel cared for.
        </p>
        <p>
          Every candle is hand-poured to order. We whip the "ice cream," ribbon the
          drizzle, and place each tiny topping by hand — because a candle that looks
          like a dessert should be made with the same love as one. No warehouse, no
          machine line. Just small batches, premium soy and pillar wax, gel for our
          "drink" candles, and lead-free cotton wicks.
        </p>
        <p>
          We believe a candle is a small luxury everyone deserves — something that makes
          an ordinary evening feel like a treat, and a gift feel like a hug. That's the
          whole idea behind the Candle Bar: come build one that's entirely, deliciously
          yours.
        </p>
      </motion.div>

      <motion.div {...reveal} className="mt-12">
        <TrustBadges className="justify-center" />
      </motion.div>

      <motion.div {...reveal} className="mt-12 text-center">
        <Link to="/build" viewTransition>
          <Button variant="gold" size="lg">
            Build your own candle
          </Button>
        </Link>
      </motion.div>
    </article>
  );
}
