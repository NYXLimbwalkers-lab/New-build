import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useCart } from "@/features/cart/cart";
import { useCartUI } from "@/features/cart/CartContext";
import { cn } from "@/lib/cn";

/*
  Persistent boutique chrome. Lives in the shell so it never unmounts across
  navigations. Condenses on scroll (driven by a motion value — no re-render per
  frame; one state flip at the threshold).
*/
export function Header() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  const { pathname } = useLocation();
  const { count } = useCart();
  const { setOpen } = useCartUI();

  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 40;
    if (next !== condensed) setCondensed(next);
  });

  const links = [
    { to: "/", label: "Patisserie", end: true },
    { to: "/build", label: "The Candle Bar", end: false },
  ];

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 w-full transition-[padding,background] duration-300",
        condensed ? "py-2 glass" : "py-4 bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
        <Link
          to="/"
          viewTransition
          className="group flex flex-col leading-none"
          aria-label="DéLa Já — home"
        >
          <span
            className={cn(
              "font-display tracking-wide text-espresso transition-all",
              condensed ? "text-xl" : "text-2xl",
            )}
          >
            DéLa Já
          </span>
          <span className="label-caps !text-[0.55rem] !tracking-[0.34em] text-gold">
            The Candle Patisserie
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              viewTransition
              className={({ isActive }) =>
                cn(
                  "relative rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors sm:px-4",
                  isActive ? "text-espresso" : "text-muted hover:text-cocoa",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {(isActive || (l.to === "/build" && pathname === "/build")) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-gold"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {l.label}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setOpen(true)}
            className="relative ml-1 rounded-full p-2 text-cocoa hover:bg-canvas-deep"
            aria-label={`Open bag${count ? `, ${count} items` : ""}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
              <path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round" />
            </svg>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[0.6rem] font-medium text-canvas"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>
      </div>
    </motion.header>
  );
}
