import { createContext, useContext } from "react";

/** The three modes that run from one codebase. Set per route. */
export type AppMode = "storefront" | "kiosk" | "party";

export const ModeContext = createContext<AppMode>("storefront");

export const useMode = () => useContext(ModeContext);
