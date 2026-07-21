import { createContext, useContext, useState, type ReactNode } from "react";

/** Drawer open/close state, shared by the header button and the drawer. */
interface CartUI {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartUIContext = createContext<CartUI>({ open: false, setOpen: () => {} });

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CartUIContext.Provider value={{ open, setOpen }}>
      {children}
    </CartUIContext.Provider>
  );
}

export const useCartUI = () => useContext(CartUIContext);
