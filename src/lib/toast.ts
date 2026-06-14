/* Tiny pub/sub toast — clear, plain-language confirmations (callable anywhere). */
type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

export function subscribeToast(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
