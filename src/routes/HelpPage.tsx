import { useDocumentTitle } from "@/lib/useTitle";
import { TrustBadges } from "@/components/TrustBadges";

/*
  Help & Info — the trust pages a real store needs to launch (FAQ, Shipping &
  Returns, Candle Care, Contact). Content reflects her real business; edit copy
  freely. Flagged as must-haves in the DTC UX audit.
*/
const FAQ: [string, string][] = [
  [
    "Are these candles made to order?",
    "Yes — everything is hand-poured in small batches after you order, so each one is fresh. Please allow a few days before it ships or is ready for pickup.",
  ],
  [
    "What are they made of?",
    "A premium soy/pillar wax blend (gel wax for the 'drink' candles), with lead-free cotton wicks. Wood crackle wicks are an option at the Candle Bar.",
  ],
  [
    "Do the dessert candles smell like the desserts?",
    "They do — each candle is scented to match. Scent descriptions are on every product, and at the Candle Bar you can scent each part on its own — every wax layer, the whipped cream, the drizzle, and the toppings.",
  ],
  [
    "Can I really build my own?",
    "Absolutely. Step up to the Candle Bar, pick your vessel, wax layers, scent, whip, drizzle and toppings, name it, and we'll pour exactly that.",
  ],
  [
    "Do you do parties?",
    "Yes! We bring a mobile candle party to you — book on the Party page and your guests build their own candles on their phones.",
  ],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t hairline py-8 first:border-t-0">
      <h2 className="font-display text-2xl text-espresso sm:text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 font-serif text-lg leading-relaxed text-plum">{children}</div>
    </section>
  );
}

export function HelpPage() {
  useDocumentTitle("Help & Info", "Shipping, returns, candle care, FAQ and contact for DéLa Já Candles & Wax Melts.");
  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-8">
      <div className="text-center">
        <p className="label-caps">We're here to help</p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">Help &amp; Info</h1>
      </div>

      <nav className="my-6 flex flex-wrap justify-center gap-2 text-sm">
        {[
          ["#faq", "FAQ"],
          ["#shipping", "Shipping"],
          ["#returns", "Returns"],
          ["#care", "Candle care"],
          ["#contact", "Contact"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border hairline bg-porcelain/60 px-4 py-2 text-cocoa hover:bg-porcelain">
            {label}
          </a>
        ))}
      </nav>

      <Section id="faq" title="Frequently asked">
        <dl className="space-y-4">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-display text-lg text-espresso">{q}</dt>
              <dd className="mt-1 text-base">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="shipping" title="Shipping & pickup">
        <p>
          We ship nationwide, and local pickup is available in Great Falls, SC. Because
          everything is made to order, please allow a few business days for us to pour
          and pack before it's on its way.
        </p>
        <p>Free shipping on orders over $75. You'll get a confirmation when it ships.</p>
      </Section>

      <Section id="returns" title="Returns & guarantee">
        <p>
          We want you to love it. If anything arrives damaged or isn't right, reach out
          within 14 days and we'll make it right — replacement or refund. Custom-built
          candles are made just for you, so we handle those case by case (we'll always
          take care of a quality issue).
        </p>
      </Section>

      <Section id="care" title="Candle care">
        <p>
          On the first burn, let the wax pool reach the edges so it burns evenly. Keep
          the wick trimmed to about ¼ inch, and never burn more than 4 hours at a time.
          Always burn on a heat-safe surface, away from drafts, kids and pets.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions, custom requests, or wholesale? We'd love to hear from you.
        </p>
        <p>
          Hours: Mon–Fri 10–5, Sat–Sun 11–4 · Great Falls, SC 29055 · Find us on
          Instagram, Facebook and TikTok @delajacandles.
        </p>
      </Section>

      <TrustBadges compact className="mt-10" />
    </div>
  );
}
