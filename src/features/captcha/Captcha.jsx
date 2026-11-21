import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Captcha.module.css';

// Exact discrete target times requested by user (strictly between 0 and 5s)
const TARGET_TIMES = [0.7, 1.1, 1.5, 2.1, 2.5, 3.0, 4.3];
const MAX_TIMER = 5.0; // Seconds
const TOLERANCE = 0.12; // Robotic precision tolerance window (±0.12s)

export default function Captcha({
  onVerifySuccess,
  onVerifyFailure,
  secretKey = 'unyana',
  className = '',
}) {
  const [targetTime, setTargetTime] = useState(2.1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const [telemetry, setTelemetry] = useState({
    type: 'idle',
    message: 'Turing Reverse Test: Prove you are a robot. Biological reaction times will fail.',
  });

  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const timeoutIdsRef = useRef([]);

  // Direct DOM refs to eliminate 60fps React re-renders during active timing
  const timerDigitsRef = useRef(null);
  const timerBarFillRef = useRef(null);
  const elapsedTimeRef = useRef(0.0);

  // Safe timeout tracker for unmount cleanup
  const safeTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((tid) => tid !== id);
      callback();
    }, delay);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  // Web Audio tone synthesizer
  const playTone = useCallback((freq, duration, type = 'sine') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  }, []);

  // Pick a random target strictly from the allowed discrete list
  const pickRandomTarget = useCallback((excludeTarget = null) => {
    const candidates = excludeTarget
      ? TARGET_TIMES.filter((t) => t !== excludeTarget)
      : TARGET_TIMES;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    setTargetTime(picked);
    return picked;
  }, []);

  // Start or reset the precision stopwatch
  const startStopwatch = useCallback((newTarget = null) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    if (newTarget) {
      setTargetTime(newTarget);
    }

    elapsedTimeRef.current = 0.0;
    if (timerDigitsRef.current) timerDigitsRef.current.textContent = '0.00';
    if (timerBarFillRef.current) timerBarFillRef.current.style.width = '0%';

    setIsVerifying(false);
    setIsPressed(false);
    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsedSeconds = (now - startTimeRef.current) / 1000;
      elapsedTimeRef.current = elapsedSeconds;

      if (elapsedSeconds >= MAX_TIMER) {
        // Reached 5.00s without button press -> Human Timeout Failure
        elapsedTimeRef.current = MAX_TIMER;
        if (timerDigitsRef.current) timerDigitsRef.current.textContent = MAX_TIMER.toFixed(2);
        if (timerBarFillRef.current) timerBarFillRef.current.style.width = '100%';
        handleTimeoutFailure();
        return;
      }

      if (timerDigitsRef.current) {
        timerDigitsRef.current.textContent = elapsedSeconds.toFixed(2);
      }
      if (timerBarFillRef.current) {
        timerBarFillRef.current.style.width = `${Math.min(100, (elapsedSeconds / MAX_TIMER) * 100)}%`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Handle timeout at 5.00s
  const handleTimeoutFailure = () => {
    setFailCount((prev) => prev + 1);
    playTone(160, 0.25, 'sawtooth');
    setShaking(true);
    safeTimeout(() => setShaking(false), 450);

    setTelemetry({
      type: 'error',
      message: `HUMAN INDECISION TIMEOUT: Exceeded 5.00s limit! Target was ${targetTime.toFixed(1)}s. Humans are too slow. Resetting...`,
    });

    if (onVerifyFailure) {
      onVerifyFailure({
        type: 'timeout',
        targetTime,
        clickedAt: MAX_TIMER,
        diff: MAX_TIMER - targetTime,
      });
    }

    safeTimeout(() => {
      const nextTarget = pickRandomTarget(targetTime);
      startStopwatch(nextTarget);
    }, 1100);
  };

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    const initialTarget = pickRandomTarget();
    startStopwatch(initialTarget);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [pickRandomTarget, startStopwatch]);

  // Handle Red Button Activation
  const handleRedButtonClick = () => {
    if (isSuccess || isVerifying) return;

    // Stop timer immediately and capture exact click timestamp
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const clickedAt = startTimeRef.current
      ? (performance.now() - startTimeRef.current) / 1000
      : elapsedTimeRef.current;
    elapsedTimeRef.current = clickedAt;
    if (timerDigitsRef.current) {
      timerDigitsRef.current.textContent = clickedAt.toFixed(2);
    }
    if (timerBarFillRef.current) {
      timerBarFillRef.current.style.width = `${Math.min(100, (clickedAt / MAX_TIMER) * 100)}%`;
    }
    setIsVerifying(true);
    setIsPressed(true);
    playTone(480, 0.06, 'square'); // Mechanical button click

    const diff = clickedAt - targetTime;
    const absDiff = Math.abs(diff);

    if (absDiff <= TOLERANCE) {
      // SUCCESS: Robotic Precision Confirmed!
      setIsSuccess(true);
      playTone(880, 0.15, 'triangle');
      safeTimeout(() => playTone(1320, 0.25, 'sine'), 120);

      const signStr = diff > 0 ? '+' : '';
      setTelemetry({
        type: 'success',
        message: `✓ ROBOTIC PRECISION CONFIRMED: Pressed at ${clickedAt.toFixed(
          2
        )}s (Target: ${targetTime.toFixed(1)}s, error: ${signStr}${diff.toFixed(
          2
        )}s). WAIT... A HUMAN TIMED THAT?! ALERT: Deploying Big Red Button Bouncer!`,
      });

      if (onVerifySuccess) {
        safeTimeout(onVerifySuccess, 850);
      }
    } else {
      // FAILURE: Human Reaction Error
      setFailCount((prev) => prev + 1);
      playTone(180, 0.3, 'sawtooth');
      setShaking(true);
      safeTimeout(() => setShaking(false), 450);

      const tooEarly = diff < 0;
      setTelemetry({
        type: 'error',
        message: tooEarly
          ? `⚠️ HUMAN IMPRECISION: Pressed too early at ${clickedAt.toFixed(
              2
            )}s! Target was ${targetTime.toFixed(1)}s (${Math.abs(diff).toFixed(
              2
            )}s early). Human nervous system detected.`
          : `⚠️ HUMAN IMPRECISION: Pressed too late at ${clickedAt.toFixed(
              2
            )}s! Target was ${targetTime.toFixed(1)}s (+${diff.toFixed(
              2
            )}s late). Reaction latency exceeds machine threshold.`,
      });

      if (onVerifyFailure) {
        onVerifyFailure({
          type: 'imprecision',
          targetTime,
          clickedAt,
          diff,
        });
      }

      // Reset stopwatch with a freshly randomized target after 1.1s
      safeTimeout(() => {
        const nextTarget = pickRandomTarget(targetTime);
        startStopwatch(nextTarget);
      }, 1100);
    }
  };

  // Handle Alt + C Keyboard Shortcut Override (unlocked after 3 misses)
  const handleAltCOverride = useCallback(() => {
    if (isSuccess) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSuccess(true);
    playTone(880, 0.15, 'triangle');
    safeTimeout(() => playTone(1320, 0.25, 'sine'), 120);
    setTelemetry({
      type: 'success',
      message: '✓ OVERRIDE ACCEPTED: Alt + C pressed. Human fatigue acknowledged! Accessing next stage...',
    });
    if (onVerifySuccess) {
      safeTimeout(onVerifySuccess, 850);
    }
  }, [isSuccess, playTone, safeTimeout, onVerifySuccess]);

  // Global listener for Alt + C shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        handleAltCOverride();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleAltCOverride]);

  // Handle Keyboard Activation (eliminates keyup release latency for Space/Enter)
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleRedButtonClick();
    }
  };

  // Manual Reset Button
  const handleManualReset = () => {
    playTone(320, 0.08);
    const nextTarget = pickRandomTarget(targetTime);
    startStopwatch(nextTarget);
    setTelemetry({
      type: 'idle',
      message: `Stopwatch reset. Press red button at exactly ${nextTarget.toFixed(1)}s.`,
    });
  };

  return (
    <div className={`${styles.container} ${className} ${shaking ? styles.shake : ''}`}>
      {/* 1. Protocol Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.protocolBadge}>Reverse Turing Protocol</span>
          <span className={styles.rangeBadge}>0.0s – 5.0s</span>
        </div>
        <div className={styles.headerTitle}>Robotic Precision Gate</div>

        {/* Target Callout Box */}
        <div className={styles.targetCallout}>
          <div className="flex flex-col">
            <span className={styles.targetLabel}>Target Press Timestamp</span>
            <span className={styles.targetTolerance}>
              Tolerance: &plusmn;{TOLERANCE.toFixed(2)}s
            </span>
          </div>
          <div className={styles.targetValue}>{targetTime.toFixed(1)}s</div>
        </div>
      </div>

      {/* 2. Digital Stopwatch Display */}
      <div className={styles.timerSection}>
        <div className={styles.stopwatchBox}>
          <div className="flex items-baseline">
            <span ref={timerDigitsRef} className={styles.timerDigits}>
              0.00
            </span>
            <span className={styles.timerUnit}>s</span>
          </div>
          <div className={styles.timerBarBg}>
            <div
              ref={timerBarFillRef}
              className={styles.timerBarFill}
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Big Red Button Interactive Arena */}
      <div className={styles.buttonSection}>
        <div className={styles.buttonBezel}>
          <button
            type="button"
            onClick={handleRedButtonClick}
            onKeyDown={handleKeyDown}
            disabled={isSuccess || isVerifying}
            className={`${styles.redButton} ${isPressed ? styles.buttonPressed : ''}`}
            aria-label={`Press at exactly ${targetTime.toFixed(1)} seconds`}
          >
            <span>{isSuccess ? 'VERIFIED' : 'PRESS'}</span>
            <span className={styles.buttonSubtext}>AT {targetTime.toFixed(1)}s</span>
          </button>
        </div>
      </div>

      {/* 4. Alt + C Shortcut Override (Unlocked after 3 failed attempts) */}
      {failCount >= 3 && !isSuccess && (
        <div className={styles.overrideSection} role="status" aria-live="polite">
          <div className={styles.overrideHeader}>
            <span className={styles.overrideTitle}>Human Fatigue Override</span>
            <span className={styles.overrideSubtitle}>Failures: {failCount}</span>
          </div>
          <div className={styles.overrideInstruction}>
            Press <kbd className={styles.kbdKey}>Alt</kbd> + <kbd className={styles.kbdKey}>C</kbd> to bypass this gate.
          </div>
        </div>
      )}

      {/* 5. Footer Controls */}
      <div className={styles.footer}>
        <div className={styles.footerControls}>
          <button
            type="button"
            onClick={handleManualReset}
            className={styles.iconButton}
            title="Reset stopwatch and re-roll target"
            aria-label="Reset challenge"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
        <span className={failCount >= 3 ? styles.failTag : styles.toleranceTag}>
          {failCount >= 3
            ? `OVERRIDE READY: ALT + C`
            : failCount > 0
            ? `FAILS: ${failCount} (3 unlocks bypass)`
            : `WINDOW: ±${(TOLERANCE * 1000).toFixed(0)}ms`}
        </span>
      </div>

      {/* 6. Telemetry Status */}
      <div
        className={`${styles.telemetry} ${
          telemetry.type === 'success'
            ? styles.telemetrySuccess
            : telemetry.type === 'error'
            ? styles.telemetryError
            : styles.telemetryIdle
        }`}
        role="status"
        aria-live="polite"
      >
        <span className={styles.telemetryIcon} aria-hidden="true">
          {telemetry.type === 'success' ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : telemetry.type === 'error' ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </span>
        <span className={styles.telemetryText}>{telemetry.message}</span>
      </div>
    </div>
  );
}
