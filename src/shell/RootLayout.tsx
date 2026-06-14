import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLenis } from "lenis/react";
import { SmoothScroll } from "@/lib/SmoothScroll";
import { ModeContext } from "@/lib/mode";
import { CartUIProvider } from "@/features/cart/CartContext";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { Header } from "./Header";
import { TransitionOutlet } from "./TransitionOutlet";
import { Footer } from "./Footer";

/*
  THE PERSISTENT SHELL. Mounts once for the storefront; Lenis smooth-scroll and
  the chrome persist while only page content transitions — the "continuous
  gliding canvas." Storefront mode by default.
*/
export function RootLayout() {
  return (
    <ModeContext.Provider value="storefront">
      <CartUIProvider>
        <SmoothScroll>
          <ScrollManager />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <TransitionOutlet />
            </main>
            <Footer />
          </div>
          <CartDrawer />
        </SmoothScroll>
      </CartUIProvider>
    </ModeContext.Provider>
  );
}

/** Glide back to top on route change (via Lenis so it stays buttery). */
function ScrollManager() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: false, duration: 0.6 });
  }, [pathname, lenis]);
  return null;
}
