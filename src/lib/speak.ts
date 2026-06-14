/* Read-aloud via the Web Speech API — accessible for low-vision, low-literacy,
   kids and elderly. Best-effort: silently no-ops where unsupported. */
export function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s || !text) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.96;
    u.pitch = 1;
    s.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
