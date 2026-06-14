import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { subscribeToast } from "./toast";

/*
  Accessibility preferences — Bigger Text + High Contrast — persisted and applied
  site-wide via root classes (see index.css). The single highest-impact change
  for children & elderly / low-vision users. Available on every screen.
*/
interface A11y {
  bigText: boolean;
  highContrast: boolean;
  toggleBig: () => void;
  toggleContrast: () => void;
}

const Ctx = createContext<A11y>({
  bigText: false,
  highContrast: false,
  toggleBig: () => {},
  toggleContrast: () => {},
});

export const useA11y = () => useContext(Ctx);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [bigText, setBig] = useState(() => localStorage.getItem("a11y-big") === "1");
  const [highContrast, setHC] = useState(() => localStorage.getItem("a11y-contrast") === "1");

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-big", bigText);
    localStorage.setItem("a11y-big", bigText ? "1" : "0");
  }, [bigText]);
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-contrast", highContrast);
    localStorage.setItem("a11y-contrast", highContrast ? "1" : "0");
  }, [highContrast]);

  return (
    <Ctx.Provider
      value={{
        bigText,
        highContrast,
        toggleBig: () => setBig((v) => !v),
        toggleContrast: () => setHC((v) => !v),
      }}
    >
      {children}
      <A11yFab />
      <Toaster />
    </Ctx.Provider>
  );
}

/** Global confirmation toast (top-center). */
function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(
    () =>
      subscribeToast((m) => {
        setMsg(m);
        window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2500);
      }),
    [],
  );
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          key={msg}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed left-1/2 top-5 z-[90] -translate-x-1/2 rounded-full border border-gold/50 bg-cocoa px-6 py-3 text-base text-canvas shadow-[var(--shadow-lift)] print:hidden"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Always-visible accessibility button + panel (bottom-left, large target). */
function A11yFab() {
  const { bigText, highContrast, toggleBig, toggleContrast } = useA11y();
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 left-4 z-[80] print:hidden">
      {open && (
        <div className="mb-2 w-60 rounded-3xl border border-gold/40 bg-porcelain p-3 shadow-[var(--shadow-lift)]">
          <p className="label-caps mb-2 px-1">Accessibility</p>
          <button
            onClick={toggleBig}
            aria-pressed={bigText}
            className={
              "mb-2 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-base " +
              (bigText ? "border-gold bg-blush-soft/50 text-espresso" : "hairline text-cocoa")
            }
          >
            <span>Bigger text</span>
            <span aria-hidden>{bigText ? "On" : "Off"}</span>
          </button>
          <button
            onClick={toggleContrast}
            aria-pressed={highContrast}
            className={
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-base " +
              (highContrast ? "border-gold bg-blush-soft/50 text-espresso" : "hairline text-cocoa")
            }
          >
            <span>Higher contrast</span>
            <span aria-hidden>{highContrast ? "On" : "Off"}</span>
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Accessibility options"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-porcelain text-2xl text-cocoa shadow-[var(--shadow-lift)] hover:bg-canvas"
      >
        <span aria-hidden>Aa</span>
      </button>
    </div>
  );
}
