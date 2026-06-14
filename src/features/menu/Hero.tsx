import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CandleRenderer } from "@/features/builder/renderer";
import { buildFromProduct } from "@/data/build";

/*
  Storefront hero. Parallax depth driven by scroll motion values (no re-renders).
  A live candle greets the visitor; the eye is led to the Candle Bar.
*/
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const yCandle = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pt-10 pb-6 text-center"
    >
      <motion.div style={{ y: yText, opacity: fade }} className="relative z-10">
        <p className="label-caps mb-4">Veteran-founded · Mom-owned · Hand-poured</p>
        <h1 className="font-display text-5xl leading-[1.05] text-espresso sm:text-7xl">
          Candles that look
          <br />
          <span className="italic text-rose">good enough to eat.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg font-serif text-xl leading-relaxed text-plum">
          Step up to the Candle Bar and build your own dessert candle — whipped,
          drizzled and finished in front of you. Or pick one off the case.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/build" viewTransition>
            <Button variant="gold" size="lg">
              Build Your Own
            </Button>
          </Link>
          <a href="#menu">
            <Button variant="outline" size="lg">
              Browse the Case
            </Button>
          </a>
        </div>
      </motion.div>

      <motion.div
        style={{ y: yCandle }}
        className="pointer-events-none mt-2 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.1 }}
      >
        <CandleRenderer config={buildFromProduct("waffles-ice-cream")} revealed />
      </motion.div>
    </section>
  );
}
