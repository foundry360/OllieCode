import { Howl } from "howler";

/** Sound IDs aligned with Blockly dropdown + optional assets in /public/sounds/{id}.mp3 */
export type OllieSoundId = "pop" | "boing" | "cheer";

const fallbackFreq: Record<OllieSoundId, number> = {
  pop: 880,
  boing: 220,
  cheer: 660,
};

const cache = new Map<OllieSoundId, Howl | "fallback">();

let audioCtx: AudioContext | null = null;

function beep(freq: number, durationMs: number) {
  if (typeof window === "undefined") return;
  audioCtx ??= new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => {
    osc.stop();
    osc.disconnect();
    gain.disconnect();
  }, durationMs);
}

/**
 * Play a sound via Howler when MP3s exist; otherwise Web Audio beeps (Howler still used when files load).
 */
export function playOllieSound(id: OllieSoundId) {
  const existing = cache.get(id);
  if (existing === "fallback") {
    beep(fallbackFreq[id], 120);
    return;
  }
  if (existing instanceof Howl) {
    existing.play();
    return;
  }

  const h = new Howl({
    src: [`/sounds/${id}.mp3`],
    volume: 0.45,
    preload: true,
    onloaderror: () => {
      cache.set(id, "fallback");
      beep(fallbackFreq[id], 120);
    },
    onload: () => {
      h.play();
    },
  });
  cache.set(id, h);
}
