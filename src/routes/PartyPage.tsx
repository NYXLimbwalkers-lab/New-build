import { useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import QRCode from "qrcode";
import { ModeContext } from "@/lib/mode";
import { SmoothScroll } from "@/lib/SmoothScroll";
import { CandleBar } from "@/features/builder/CandleBar";
import { CandleRenderer } from "@/features/builder/renderer";
import { Footer } from "@/shell/Footer";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/useTitle";
import { db } from "@/db/db";
import type { BuildConfig } from "@/data/types";
import { describeBuild, formatUSD } from "@/data/build";
import { PARTY_PACKAGES, PKG_BY_ID, DEPOSIT, TRAVEL_FEE } from "@/data/party";

/*
  PHASE 4 — RV / PARTY MODE.
  Host books an event (per-person packages, group minimum, deposit, travel fee)
  and gets a QR code; guests scan it to join on their own phones and build
  candles. Each finished build prints a "Make & Take" recipe card for the pour.
  Booking/sessions persist locally (Phase-2 adapter handles the deposit invoice).
*/
export function PartyPage() {
  const { sessionId } = useParams();
  useDocumentTitle(sessionId ? "Build your candle" : "Book a candle party");
  return (
    <ModeContext.Provider value="party">
      <SmoothScroll>
        <div className="min-h-screen">
          {sessionId ? <GuestBuilder sessionId={sessionId} /> : <HostBooking />}
          <Footer />
        </div>
      </SmoothScroll>
    </ModeContext.Provider>
  );
}

/* ── Host: book a party + get a QR ────────────────────────────────────── */
function HostBooking() {
  const [hostName, setHostName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [packageId, setPackageId] = useState("classic");
  const pkg = PKG_BY_ID[packageId];
  const [guests, setGuests] = useState(pkg.minGuests);
  const [created, setCreated] = useState<{ id: string; qr: string } | null>(null);

  const subtotal = guests * pkg.perPerson;
  const total = subtotal + TRAVEL_FEE;

  async function book() {
    const id = (crypto.randomUUID?.() ?? `${Date.now()}`).slice(0, 8);
    await db.parties.add({
      id,
      hostName: hostName.trim() || "Host",
      date,
      location: location.trim(),
      guests,
      packageId,
      perPerson: pkg.perPerson,
      deposit: DEPOSIT,
      total,
      createdAt: Date.now(),
    });
    const link = `${window.location.origin}${import.meta.env.BASE_URL}party/${id}`;
    const qr = await QRCode.toDataURL(link, { margin: 1, width: 320, color: { dark: "#3A2C2A", light: "#FBF4F0" } });
    setCreated({ id, qr });
  }

  if (created) {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}party/${created.id}`;
    return (
      <div className="mx-auto max-w-md px-5 py-12 text-center">
        <p className="label-caps">You're booked ✦</p>
        <h1 className="mt-2 font-display text-4xl text-espresso">Scan to join the party</h1>
        <p className="mt-2 font-serif text-lg text-plum">
          Guests scan this on their phones to build their candles.
        </p>
        <div className="mx-auto mt-6 w-fit rounded-3xl border border-gold/40 bg-porcelain p-5 shadow-[var(--shadow-soft)]">
          <img src={created.qr} alt="Party join QR code" width={260} height={260} />
        </div>
        <a href={link} className="mt-3 inline-block break-all text-xs text-muted underline">
          {link}
        </a>
        <p className="mt-6 text-sm text-cocoa">
          A <span className="price">{formatUSD(DEPOSIT)}</span> deposit holds your date.
        </p>
        {/* TODO(Phase 2): Square/Stripe deposit invoice. */}
        <Button className="mt-4" variant="gold" size="lg">
          Pay deposit to confirm
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <header className="text-center">
        <p className="label-caps">DéLa Já · Mobile Candle Party</p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">Start a party</h1>
        <p className="mx-auto mt-3 max-w-md font-serif text-lg text-plum">
          Birthdays, girls' night, bridal showers — we bring the patisserie to you.
        </p>
      </header>

      {/* packages */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {PARTY_PACKAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPackageId(p.id);
              setGuests((g) => Math.max(g, p.minGuests));
            }}
            className={
              "rounded-3xl border p-4 text-left transition-colors " +
              (packageId === p.id ? "border-gold bg-blush-soft/40" : "hairline bg-porcelain/60")
            }
          >
            <h3 className="font-display text-lg text-espresso">{p.name}</h3>
            <p className="price mt-0.5 text-cocoa">{formatUSD(p.perPerson)}/person</p>
            <p className="mt-1 text-xs text-muted">Min {p.minGuests} guests</p>
            <ul className="mt-2 space-y-0.5 text-xs text-plum">
              {p.includes.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* details */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Your name" className="rounded-2xl border hairline bg-porcelain/70 px-4 py-3 text-sm outline-none focus:border-gold" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl border hairline bg-porcelain/70 px-4 py-3 text-sm outline-none focus:border-gold" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location / address" className="rounded-2xl border hairline bg-porcelain/70 px-4 py-3 text-sm outline-none focus:border-gold sm:col-span-2" />
        <label className="flex items-center gap-3 text-sm text-cocoa sm:col-span-2">
          <span className="label-caps">Guests</span>
          <input
            type="number"
            min={pkg.minGuests}
            max={75}
            value={guests}
            onChange={(e) => setGuests(Math.max(pkg.minGuests, Number(e.target.value)))}
            className="w-24 rounded-2xl border hairline bg-porcelain/70 px-4 py-3 outline-none focus:border-gold"
          />
          <span className="text-xs text-muted">min {pkg.minGuests}</span>
        </label>
      </div>

      {/* summary */}
      <div className="mt-6 rounded-3xl border hairline bg-porcelain/60 p-5">
        <Row k={`${guests} guests × ${formatUSD(pkg.perPerson)}`} v={formatUSD(subtotal)} />
        <Row k="Travel fee" v={formatUSD(TRAVEL_FEE)} />
        <div className="my-2 h-px bg-gold/30" />
        <Row k="Estimated total" v={formatUSD(total)} bold />
        <Row k="Due now (deposit)" v={formatUSD(DEPOSIT)} />
      </div>

      <Button className="mt-6 w-full" variant="gold" size="lg" onClick={book}>
        Book &amp; get the guest QR code
      </Button>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={bold ? "text-espresso" : "text-muted"}>{k}</span>
      <span className={"price " + (bold ? "text-lg text-espresso" : "text-cocoa")}>{v}</span>
    </div>
  );
}

/* ── Guest: build + Make & Take recipe card ───────────────────────────── */
function GuestBuilder({ sessionId }: { sessionId: string }) {
  const party = useLiveQuery(() => db.parties.get(sessionId), [sessionId]);
  const [card, setCard] = useState<BuildConfig | null>(null);

  return (
    <>
      <header className="mx-auto max-w-6xl px-5 pt-8 text-center">
        <p className="label-caps">
          {party ? `${party.hostName}'s candle party` : "DéLa Já · Candle Party"}
        </p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">Build your candle</h1>
        <p className="mx-auto mt-3 max-w-md font-serif text-lg text-plum">
          Make it yours — we'll pour it for you to take home tonight.
        </p>
      </header>
      <CandleBar onComplete={(cfg) => setCard(cfg)} />
      {card && <MakeTakeCard config={card} onClose={() => setCard(null)} />}
    </>
  );
}

const recipeLines = describeBuild;

function MakeTakeCard({ config, onClose }: { config: BuildConfig; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/30 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <p className="text-center label-caps !tracking-[0.3em] text-gold">Make &amp; Take recipe</p>
        <div className="mx-auto my-2 max-w-[180px]">
          <CandleRenderer config={config} />
        </div>
        <h3 className="text-center font-display text-2xl text-espresso">
          {config.name.trim() || "Your Creation"}
        </h3>
        <dl className="mt-4 space-y-1.5 text-sm">
          {recipeLines(config).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b hairline py-1">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right text-cocoa">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex gap-2">
          <Button variant="gold" size="md" className="flex-1" onClick={() => window.print()}>
            Print card
          </Button>
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            Build another
          </Button>
        </div>
      </div>
    </div>
  );
}
