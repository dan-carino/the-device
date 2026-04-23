"use client";

// Singleton AudioContext — created on first user gesture, reused everywhere.
// Call getAudioContext() from any user interaction handler.

let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
    _masterGain = _ctx.createGain();
    _masterGain.gain.setValueAtTime(0.6, _ctx.currentTime);
    _masterGain.connect(_ctx.destination);
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === "suspended") {
    _ctx.resume();
  }
  return _ctx;
}

export function getMasterGain(): GainNode | null {
  return _masterGain;
}

/**
 * Play a short dial tick.
 * freq: base frequency in Hz (default 900)
 * volume: 0–1 (default 0.08 — subtle background texture)
 */
export function playTick(freq = 900, volume = 0.08) {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // Tiny pitch drop for a mechanical feel
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(mg);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // AudioContext not available (SSR, permissions)
  }
}

/**
 * Play a toggle switch snap — slightly lower, squarer wave.
 */
export function playSnap(volume = 0.12) {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(mg);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // ignore
  }
}

/**
 * Play the INIT. SCAN button press — two-tone ascending blip.
 */
export function playInitScan(volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg) return;

    const playNote = (freq: number, startOffset: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + dur);
      osc.connect(gain);
      gain.connect(mg);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + dur + 0.01);
    };

    playNote(660, 0, 0.1);
    playNote(880, 0.1, 0.12);
  } catch {
    // ignore
  }
}

/**
 * Rising shimmer — played when proximity crosses 0.3 (partial signal detected).
 */
export function playSignalDetected(volume = 0.1) {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(mg);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.46);
  } catch {
    // ignore
  }
}

/**
 * Three-note ascending chime — played when entity fully resolves (proximity >= 0.7).
 */
export function playEntityFound(volume = 0.14) {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg) return;

    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.13;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(mg);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  } catch {
    // ignore
  }
}

// ── Ambient hum ──────────────────────────────────────────────────────────────
// A very low-level 60Hz oscillator — the "device is running" feeling.
// Call startAmbientHum() once on first interaction; it runs indefinitely.

let _humOsc: OscillatorNode | null = null;
let _humGain: GainNode | null = null;

export function startAmbientHum() {
  try {
    const ctx = getAudioContext();
    const mg = getMasterGain();
    if (!mg || _humOsc) return; // already running

    _humGain = ctx.createGain();
    _humGain.gain.setValueAtTime(0, ctx.currentTime);
    _humGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 1.5);

    _humOsc = ctx.createOscillator();
    _humOsc.type = "sine";
    _humOsc.frequency.setValueAtTime(60, ctx.currentTime);

    _humOsc.connect(_humGain);
    _humGain.connect(mg);
    _humOsc.start();
  } catch {
    // ignore
  }
}

export function stopAmbientHum() {
  try {
    if (_humGain && _humOsc) {
      const ctx = getAudioContext();
      _humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      _humOsc.stop(ctx.currentTime + 0.6);
      _humOsc = null;
      _humGain = null;
    }
  } catch {
    // ignore
  }
}
