// Web Audio API sound generator - Airhorn preserved; annoying sounds removed

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays the stadium Airhorn blast using detuned sawtooth waves.
 * Kept for punitive inactivity detection.
 */
export function playAirhorn() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [466.16, 311.13, 233.08, 932.33];

    const pulses = [
      { start: 0.00, dur: 0.12 },
      { start: 0.15, dur: 0.12 },
      { start: 0.30, dur: 0.12 },
      { start: 0.45, dur: 0.55 },
    ];

    pulses.forEach((pulse) => {
      const pulseStart = now + pulse.start;
      const pulseEnd = pulseStart + pulse.dur;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, pulseStart);
      gain.gain.linearRampToValueAtTime(0.25, pulseStart + 0.02);
      gain.gain.setValueAtTime(0.25, pulseEnd - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, pulseStart);

      gain.connect(filter);
      filter.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(freq, pulseStart);
        osc.detune.setValueAtTime((idx - 1.5) * 15, pulseStart);
        osc.connect(gain);
        osc.start(pulseStart);
        osc.stop(pulseEnd + 0.05);
      });
    });
  } catch (err) {
    console.warn('Audio not available:', err);
  }
}

// All other annoying sound effects disabled per user request
export function playSirenTone() {}
export function playShredderSound() {}
export function playMitosisPop() {}
export function playBitTone() {}
export function playRejectionBuzz() {}
export function playDialUpChirp() {}
