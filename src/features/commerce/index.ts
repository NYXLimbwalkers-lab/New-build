import type { CommerceAdapter } from "./types";
import { localAdapter } from "./localAdapter";

/*
  Pick the live commerce adapter. Driven by an env flag so going live is a
  config change, not a code change:

    VITE_COMMERCE=local   (default — local made-to-order queue)
    VITE_COMMERCE=square  (TODO: src/features/commerce/squareAdapter.ts)
    VITE_COMMERCE=woo     (TODO: src/features/commerce/wooAdapter.ts)

  A new backend = one file implementing CommerceAdapter + one case here.
*/
const which = (import.meta.env.VITE_COMMERCE as string | undefined) ?? "local";

export function getAdapter(): CommerceAdapter {
  switch (which) {
    // case "square": return squareAdapter;
    // case "woo": return wooAdapter;
    case "local":
    default:
      return localAdapter;
  }
}

export type { CommerceAdapter, OrderDraft, OrderResult } from "./types";
