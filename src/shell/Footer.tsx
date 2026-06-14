import { Link } from "react-router-dom";
import { TrustBadges } from "@/components/TrustBadges";
import { EmailCapture } from "@/features/marketing/EmailCapture";

/*
  Brand-soul footer — said with warmth and grace (deep plan, Part 5):
  veteran-founded, mom-owned, hand-poured, small-batch, made-to-order.
*/
export function Footer() {
  return (
    <footer className="mt-24 border-t hairline bg-porcelain/40">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <EmailCapture />
        <TrustBadges compact className="mb-10 mt-12" />
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold/50" />
          <span className="font-display text-xl text-espresso">DéLa Já</span>
          <span className="h-px w-10 bg-gold/50" />
        </div>
        <p className="mx-auto max-w-md font-serif text-lg leading-relaxed text-plum">
          Veteran-founded, mom-owned. Hand-poured in small batches, made to order
          in Great Falls, South Carolina.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 label-caps">
          <span>Ships nationwide</span>
          <span aria-hidden>·</span>
          <span>Local pickup</span>
          <span aria-hidden>·</span>
          <span>M–F 10–5 · Sat–Sun 11–4</span>
        </div>
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.16em] text-muted">
          <Link to="/" viewTransition className="hover:text-cocoa">Shop</Link>
          <Link to="/build" viewTransition className="hover:text-cocoa">Candle Bar</Link>
          <Link to="/creations" viewTransition className="hover:text-cocoa">My Creations</Link>
          <Link to="/about" viewTransition className="hover:text-cocoa">Our Story</Link>
          <Link to="/help" viewTransition className="hover:text-cocoa">Help &amp; Info</Link>
        </nav>
        <p className="mt-6 text-xs text-muted">
          © {new Date().getFullYear()} DéLa Já Candles &amp; Wax Melts
        </p>
      </div>
    </footer>
  );
}
