/*
  Progressive-enhancement haptics. No-ops on iOS Safari (no Vibration API) and
  anywhere unsupported — visual press feedback always carries the interaction.
  Must be called inside a user gesture.
*/
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
