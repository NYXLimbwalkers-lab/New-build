import { useEffect, useState } from "react";

/*
  Candle Club — 1 point per $1 spent. Persisted locally and reactive across the
  app (custom event). A Phase-2 accounts/commerce adapter ties points to a real
  customer profile; the earn/spend logic stays identical.
*/
const KEY = "delaja-points";
const EVT = "delaja-points";

export const getPoints = () => Number(localStorage.getItem(KEY) || "0");

export function addPoints(amount: number): number {
  const earned = Math.max(0, Math.round(amount));
  const next = getPoints() + earned;
  localStorage.setItem(KEY, String(next));
  window.dispatchEvent(new Event(EVT));
  return earned;
}

export function usePoints(): number {
  const [pts, setPts] = useState(getPoints);
  useEffect(() => {
    const h = () => setPts(getPoints());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return pts;
}
