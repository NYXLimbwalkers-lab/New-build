/*
  Tiny synthesized sound design — no audio files, fully offline (kiosk-safe).
  One moment matters: LIGHTING the candle. A soft match-strike tick, a warm
  noise whoosh as the flame catches, and two gentle wood-crackle pops.
  Everything is generated in WebAudio inside the user's tap (iOS-unlock safe),
  mixed quiet (boutique, not arcade). Mute persists in localStorage.
*/

const MUTE_KEY = "delaja-sound";

export function isSoundMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "off";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "off" : "on");
  } catch {
    /* private mode */
  }
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Shared white-noise buffer (lazily built once). */
let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

/** A single filtered-noise event: bandpass sweep + gain envelope. */
function puff(
  ac: AudioContext,
  out: AudioNode,
  t0: number,
  {
    dur,
    from,
    to,
    q = 1,
    peak = 0.2,
    attack = 0.02,
  }: { dur: number; from: number; to: number; q?: number; peak?: number; attack?: number },
) {
  const src = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(from, t0);
  bp.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/** The candle-lighting moment: strike → catch → settle, ~1.1s total. */
export function playIgnite() {
  if (isSoundMuted()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const master = ac.createGain();
  master.gain.value = 0.5; // gentle overall level
  master.connect(ac.destination);

  // 1. match strike — short bright scratch
  puff(ac, master, t, { dur: 0.09, from: 2600, to: 5200, q: 0.8, peak: 0.16, attack: 0.008 });
  // 2. the catch — warm whoosh swelling then settling
  puff(ac, master, t + 0.12, { dur: 0.7, from: 320, to: 950, q: 0.6, peak: 0.22, attack: 0.12 });
  // 3. two soft wood-crackle pops as the flame steadies
  puff(ac, master, t + 0.62, { dur: 0.05, from: 1600, to: 900, q: 2.2, peak: 0.1, attack: 0.005 });
  puff(ac, master, t + 0.84, { dur: 0.05, from: 1900, to: 1000, q: 2.2, peak: 0.08, attack: 0.005 });
}
