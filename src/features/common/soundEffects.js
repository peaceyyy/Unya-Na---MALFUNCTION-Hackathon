// Web Audio API sound generator for Unya na

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

function makeDistortionCurve(amount = 40) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Plays an urgent, piercing airhorn / emergency klaxon blast using
 * detuned brass harmonics, waveshaper distortion, and a rapid pitch attack.
 */
export function playAirhorn() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master chain: WaveShaper (brassy airhorn grit) -> High-shelf boost -> Compressor -> Destination
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(35);
    shaper.oversample = '2x';

    const highBoost = ctx.createBiquadFilter();
    highBoost.type = 'peaking';
    highBoost.frequency.setValueAtTime(1800, now);
    highBoost.Q.setValueAtTime(1.5, now);
    highBoost.gain.setValueAtTime(8, now);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.ratio.setValueAtTime(12, now);

    shaper.connect(highBoost);
    highBoost.connect(compressor);
    compressor.connect(ctx.destination);

    // Classic piercing stadium airhorn + urgent klaxon dissonant frequencies
    const hornFreqs = [
      { freq: 392.0, type: 'sawtooth', detune: -14 },  // G4
      { freq: 493.88, type: 'sawtooth', detune: 12 },  // B4
      { freq: 587.33, type: 'square', detune: -8 },    // D5
      { freq: 783.99, type: 'sawtooth', detune: 16 },  // G5
      { freq: 987.77, type: 'square', detune: 0 },     // B5 (piercing alarm edge)
      { freq: 1174.66, type: 'sawtooth', detune: -6 }, // D6
    ];

    // Urgent rapid blast pattern: BWA-BWA-BWA-BWAAAAAAA!
    const pulses = [
      { start: 0.0, dur: 0.14 },
      { start: 0.17, dur: 0.14 },
      { start: 0.34, dur: 0.14 },
      { start: 0.52, dur: 0.75 },
    ];

    pulses.forEach((pulse) => {
      const pulseStart = now + pulse.start;
      const pulseEnd = pulseStart + pulse.dur;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, pulseStart);
      gain.gain.linearRampToValueAtTime(0.38, pulseStart + 0.015);
      gain.gain.setValueAtTime(0.36, pulseEnd - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

      gain.connect(shaper);

      hornFreqs.forEach(({ freq, type, detune }) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        // Quick compressed-air pitch scoop on attack
        osc.frequency.setValueAtTime(freq * 0.92, pulseStart);
        osc.frequency.exponentialRampToValueAtTime(freq, pulseStart + 0.035);
        osc.detune.setValueAtTime(detune, pulseStart);

        osc.connect(gain);
        osc.start(pulseStart);
        osc.stop(pulseEnd + 0.04);
      });
    });

    // Add an urgent high-pitched emergency alarm chirp layered on the final blast
    const alarmOsc = ctx.createOscillator();
    const alarmGain = ctx.createGain();
    alarmOsc.type = 'square';
    alarmOsc.frequency.setValueAtTime(1400, now + 0.52);
    alarmOsc.frequency.setValueAtTime(1850, now + 0.68);
    alarmOsc.frequency.setValueAtTime(1400, now + 0.84);
    alarmOsc.frequency.setValueAtTime(1850, now + 1.0);

    alarmGain.gain.setValueAtTime(0.001, now + 0.52);
    alarmGain.gain.linearRampToValueAtTime(0.12, now + 0.54);
    alarmGain.gain.setValueAtTime(0.12, now + 1.2);
    alarmGain.gain.exponentialRampToValueAtTime(0.001, now + 1.27);

    alarmOsc.connect(alarmGain);
    alarmGain.connect(compressor);
    alarmOsc.start(now + 0.52);
    alarmOsc.stop(now + 1.3);
  } catch (err) {
    console.warn('Audio not available:', err);
  }
}
