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
    message: '',
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
      message: 'Time ran out. The timer will restart.',
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

      setTelemetry({
        type: 'success',
        message: 'Target hit. Continuing to the next step.',
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

      const timing = diff < 0 ? 'early' : 'late';
      setTelemetry({
        type: 'error',
        message: `Target missed. You pressed ${timing} at ${clickedAt.toFixed(2)}s.`,
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
      message: 'Human verified. Continuing to the next step.',
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
      message: `Timer reset. New target: ${nextTarget.toFixed(1)}s.`,
    });
  };

  return (
    <div className={`${styles.container} ${className} ${shaking ? styles.shake : ''}`}>
      <div className={styles.header}>
        <p className={styles.instructions}>
          To pass as human, miss the target three times, then use the shortcut that appears.
        </p>

        <div className={styles.targetCallout}>
          <div className="flex flex-col">
            <span className={styles.targetLabel}>Target time</span>
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
          >
            {isSuccess ? 'Verified' : 'Stop timer'}
          </button>
        </div>
      </div>

      {/* 4. Alt + C Shortcut Override (Unlocked after 3 failed attempts) */}
      {failCount >= 3 && !isSuccess && (
        <p className={styles.overrideSection} role="status">
          Press <kbd>Alt</kbd> + <kbd>C</kbd> to continue as human.
        </p>
      )}

      {/* 5. Footer Controls */}
      <div className={styles.footer}>
        <div className={styles.footerControls}>
          <button
            type="button"
            onClick={handleManualReset}
            className={styles.iconButton}
            title="Reset timer and pick a new target"
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
        <span className={styles.attemptInfo}>
          {failCount > 0 && failCount < 3 ? `${failCount} of 3 misses` : `${MAX_TIMER}-second limit`}
        </span>
      </div>

      <div
        className={telemetry.message ? styles.telemetry : 'sr-only'}
        data-state={telemetry.type}
        role="status"
      >
        {telemetry.message}
      </div>
    </div>
  );
}
