import { Howl, Howler } from "howler";

/** All built-in sound ids; files live under `/public/sounds/` (see {@link OLLIE_SOUND_SRC}). */
export const OLLIE_SOUND_IDS = [
  "pop",
  "boing",
  "cheer",
  "schoolbusrythmn",
  "fantasyland",
] as const;

export type OllieSoundId = (typeof OLLIE_SOUND_IDS)[number];

/** Public URL for each sound (`.mp3` or `.wav`). */
export const OLLIE_SOUND_SRC: Record<OllieSoundId, string> = {
  pop: "/sounds/pop.mp3",
  boing: "/sounds/boing.mp3",
  cheer: "/sounds/cheer.mp3",
  schoolbusrythmn: "/sounds/schoolbusrythmn.wav",
  fantasyland: "/sounds/fantasyland.mp3",
};

const SOUND_MENU_LABEL: Record<OllieSoundId, string> = {
  pop: "pop",
  boing: "boing",
  cheer: "cheer",
  schoolbusrythmn: "School Bus Horn",
  fantasyland: "Fantasy Land",
};

export function soundDropdownOptions(): [string, string][] {
  return OLLIE_SOUND_IDS.map((id) => [SOUND_MENU_LABEL[id], id]);
}

export function isOllieSoundId(s: string): s is OllieSoundId {
  return (OLLIE_SOUND_IDS as readonly string[]).includes(s);
}

const fallbackFreq: Record<OllieSoundId, number> = {
  pop: 880,
  boing: 220,
  cheer: 660,
  schoolbusrythmn: 400,
  fantasyland: 523,
};

const cache = new Map<OllieSoundId, Howl | "fallback">();

let audioCtx: AudioContext | null = null;

function beep(freq: number, durationMs: number) {
  if (typeof window === "undefined") return;
  audioCtx ??= new AudioContext();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
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

/** Stops all Ollie Howl playback and silences Web Audio fallback beeps (toolbar Stop / “stop all”). */
export function stopOllieSounds() {
  Howler.stop();
  if (audioCtx?.state === "running") {
    void audioCtx.suspend();
  }
}

/**
 * Play a sound via Howler when files exist; otherwise Web Audio beeps (Howler still used when files load).
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
    src: [OLLIE_SOUND_SRC[id]],
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
