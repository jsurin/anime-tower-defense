export type SfxName =
  | "place"
  | "deny"
  | "shoot"
  | "drum"
  | "hit"
  | "death"
  | "leak"
  | "wave"
  | "win"
  | "lose"
  | "upgrade"
  | "sell"
  | "seal"
  | "fox"
  | "crit"
  | "enrage";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;
let musicStarted = false;
let oscillators: OscillatorNode[] = [];

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    music = ctx.createGain();
    sfx = ctx.createGain();
    master.gain.value = 0.7;
    music.gain.value = 0.22;
    sfx.gain.value = 0.55;
    music.connect(master);
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  if (!musicStarted) {
    musicStarted = true;
    startBed();
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.04);
  }
}

export function isMuted() {
  return muted;
}

function envGain(c: AudioContext, dest: AudioNode, peak: number, attack: number, release: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(peak, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + attack + release);
  g.connect(dest);
  return g;
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, dest: GainNode) {
  const c = ac();
  if (!c || !dest) return;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = envGain(c, dest, peak, 0.01, dur);
  o.connect(g);
  o.start();
  o.stop(c.currentTime + dur + 0.05);
}

function noise(dur: number, peak: number, dest: GainNode, hp = 400) {
  const c = ac();
  if (!c || !dest) return;
  const n = c.createBufferSource();
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = envGain(c, dest, peak, 0.005, dur * 0.9);
  n.connect(filter);
  filter.connect(g);
  n.start();
}

function startBed() {
  const c = ac();
  if (!c || !music) return;
  makeDrone(73.4, 0, 0.09);
  makeDrone(110, 6, 0.045);
  const phrase = [146.83, 174.61, 196, 220, 196, 164.81];
  let step = 0;
  const tick = () => {
    if (!ctx || !musicStarted) return;
    if (!muted && music) {
      const f = phrase[step % phrase.length];
      tone(f, 2.6, "sine", 0.03, music);
      if (step % 6 === 0) tone(f * 0.5, 3.4, "triangle", 0.032, music);
      if (step % 3 === 1) tone(f * 1.498, 1.8, "sine", 0.014, music);
    }
    step++;
    window.setTimeout(tick, 2800);
  };
  tick();
}

function makeDrone(freq: number, detune: number, gain: number) {
  const c = ac();
  if (!c || !music) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = freq;
  o.detune.value = detune;
  const g = c.createGain();
  g.gain.value = gain;
  o.connect(g);
  g.connect(music);
  o.start();
  oscillators.push(o);
}

export function playSfx(name: SfxName) {
  const c = ac();
  if (!c || !sfx || muted) return;
  if (c.state === "suspended") void c.resume();
  const rate = 1 + (Math.random() * 0.12 - 0.06);
  switch (name) {
    case "place":
      tone(330 * rate, 0.12, "triangle", 0.2, sfx);
      tone(495 * rate, 0.18, "sine", 0.12, sfx);
      break;
    case "deny":
      tone(140, 0.12, "square", 0.08, sfx);
      break;
    case "shoot":
      tone(740 * rate, 0.07, "triangle", 0.09, sfx);
      tone(980 * rate, 0.05, "sine", 0.05, sfx);
      break;
    case "seal":
      tone(520 * rate, 0.1, "sine", 0.1, sfx);
      tone(780 * rate, 0.14, "triangle", 0.06, sfx);
      break;
    case "fox":
      noise(0.08, 0.05, sfx, 900);
      tone(310 * rate, 0.12, "sine", 0.07, sfx);
      break;
    case "drum":
      tone(90, 0.18, "sine", 0.28, sfx);
      noise(0.12, 0.18, sfx, 200);
      tone(420, 0.08, "square", 0.06, sfx);
      break;
    case "hit":
      tone(210 * rate, 0.04, "triangle", 0.04, sfx);
      break;
    case "crit":
      tone(880 * rate, 0.08, "sine", 0.1, sfx);
      tone(1320 * rate, 0.1, "triangle", 0.07, sfx);
      break;
    case "enrage":
      tone(70, 0.4, "sawtooth", 0.12, sfx);
      noise(0.3, 0.14, sfx, 80);
      break;
    case "death":
      tone(523, 0.12, "sine", 0.1, sfx);
      tone(392, 0.2, "triangle", 0.08, sfx);
      break;
    case "leak":
      tone(180, 0.25, "sawtooth", 0.1, sfx);
      tone(120, 0.35, "sine", 0.12, sfx);
      break;
    case "wave":
      tone(196, 0.18, "triangle", 0.14, sfx);
      tone(294, 0.22, "sine", 0.1, sfx);
      tone(392, 0.28, "triangle", 0.08, sfx);
      break;
    case "win":
      [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.35, "triangle", 0.16, sfx!), i * 140));
      break;
    case "lose":
      [330, 247, 196, 147].forEach((f, i) => setTimeout(() => tone(f, 0.32, "sine", 0.14, sfx!), i * 180));
      break;
    case "upgrade":
      tone(440, 0.1, "sine", 0.12, sfx);
      tone(660, 0.16, "triangle", 0.1, sfx);
      break;
    case "sell":
      tone(260, 0.1, "triangle", 0.1, sfx);
      break;
  }
}

export function resumeIfNeeded() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}
