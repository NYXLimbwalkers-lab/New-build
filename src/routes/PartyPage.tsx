import { useParams } from "react-router-dom";
import { ModeContext } from "@/lib/mode";
import { SmoothScroll } from "@/lib/SmoothScroll";
import { CandleBar } from "@/features/builder/CandleBar";
import { Footer } from "@/shell/Footer";

/*
  PHASE 4 — RV / PARTY MODE (scaffold).
  Host starts an event; guests join via QR on their own phones to build candles
  together. To wire up: per-person package pricing + guest count + group minimum,
  booking + deposit (date/location/travel-radius fee), printable "Make & Take"
  recipe card per build, live big-screen gallery, post-party reorder link.
  Implemented now: the per-session route + the live builder in party mode.
*/
export function PartyPage() {
  const { sessionId } = useParams();

  return (
    <ModeContext.Provider value="party">
      <SmoothScroll>
        <div className="min-h-screen">
          <header className="mx-auto max-w-6xl px-5 pt-8 text-center">
            <p className="label-caps">DéLa Já · Mobile Candle Party</p>
            <h1 className="font-display text-4xl text-espresso sm:text-5xl">
              {sessionId ? "Build your candle" : "Start a party"}
            </h1>
            <p className="mx-auto mt-3 max-w-md font-serif text-lg text-plum">
              {sessionId
                ? "Make it yours — we'll pour it for you to take home."
                : "Birthdays, girls' night, bridal showers. We bring the patisserie to you."}
            </p>
          </header>

          {sessionId ? (
            <CandleBar />
          ) : (
            <div className="mx-auto max-w-md px-5 py-12 text-center">
              {/* TODO(Phase 4): booking + deposit + per-person packages + QR join. */}
              <div className="rounded-3xl border hairline bg-porcelain/60 p-8">
                <p className="font-serif text-lg text-plum">
                  Booking, per-person packages, and guest QR join arrive in Phase 4.
                </p>
              </div>
            </div>
          )}
          <Footer />
        </div>
      </SmoothScroll>
    </ModeContext.Provider>
  );
}
