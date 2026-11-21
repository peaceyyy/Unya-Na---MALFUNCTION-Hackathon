import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const OpacityContext = createContext({
  opacity: 100,
  setOpacity: () => {},
  resetOpacity: () => {},
  isDecaying: false,
  isDraggingRef: { current: false },
  danceRequired: false,
  registerDance: () => {},
  startDance: () => {},
  finishDance: () => {},
});

// Decay configuration: while the user is idle, the interface loses 1% every second.
const DECAY_INTERVAL_MS = 1000; // one decay step per second
const DECAY_STEP = 1;           // -1% per step
const DECAY_CHECK_MS = 250;     // how often the timer looks at the clock

// Dance recovery: once the interface has faded to 0 the user has to dance (upper
// body, on camera) to bring it back. Each detected dance adds DANCE_STEP percent.
// The dance screen stays up until the interface is back to 100%, but once it is at
// DANCE_STOP_AT percent or more the user may press Done and carry on with what they have.
export const DANCE_STEP = 20;
export const DANCE_STOP_AT = 30;

export function OpacityProvider({ children }) {
  const [opacity, setOpacityState] = useState(100);
  const isDraggingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastDecayTimeRef = useRef(Date.now());
  const [isDecaying, setIsDecaying] = useState(false);
  const [danceRequired, setDanceRequired] = useState(false);
  const danceRequiredRef = useRef(false);
  danceRequiredRef.current = danceRequired;

  const setOpacity = useCallback((val) => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setOpacityState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      return Math.max(0, Math.min(100, Math.round(next)));
    });
  }, []);

  const registerDance = useCallback((step = DANCE_STEP) => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setOpacityState((prev) => Math.min(100, prev + step));
  }, []);

  // The "Just dance" button: put the dance screen up at the current opacity. It does
  // not change the opacity; dancing can only raise it.
  const startDance = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setDanceRequired(true);
  }, []);

  const resetOpacity = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setOpacityState(100);
  }, []);

  const opacityRef = useRef(100);
  opacityRef.current = opacity;

  // The user chose to stop dancing. Only allowed once enough has been won back.
  const finishDance = useCallback(() => {
    if (opacityRef.current < DANCE_STOP_AT) return;
    lastDecayTimeRef.current = Date.now();
    setDanceRequired(false);
  }, []);

  // Latch the dance screen on at 0% and off again at 100% (or when the user presses Done).
  useEffect(() => {
    if (opacity === 0) setDanceRequired(true);
    else if (opacity >= 100) setDanceRequired(false);
  }, [opacity]);

  useEffect(() => {
    const recordActivity = () => {
      lastActivityRef.current = Date.now();
      lastDecayTimeRef.current = Date.now();
      setIsDecaying(false);
    };

    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    // Check the clock often enough that each step lands about 1 second after the last
    const timer = setInterval(() => {
      // Don't decay if user is actively dragging the slider
      if (isDraggingRef.current) {
        lastActivityRef.current = Date.now();
        lastDecayTimeRef.current = Date.now();
        setIsDecaying(false);
        return;
      }

      // No fading while the user is busy dancing it back.
      if (danceRequiredRef.current) {
        lastDecayTimeRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastDecayTimeRef.current;
      if (elapsed >= DECAY_INTERVAL_MS) {
        // Keep the 1-second rhythm instead of drifting by the check interval, but do not
        // try to catch up after a long pause (a background tab, for example).
        lastDecayTimeRef.current =
          elapsed < DECAY_INTERVAL_MS * 2 ? lastDecayTimeRef.current + DECAY_INTERVAL_MS : now;
        setIsDecaying(true);
        setOpacityState((prev) => Math.max(0, prev - DECAY_STEP));
      }
    }, DECAY_CHECK_MS);

    return () => {
      clearInterval(timer);
      events.forEach((evt) => window.removeEventListener(evt, recordActivity));
    };
  }, []);

  return (
    <OpacityContext.Provider
      value={{
        opacity,
        setOpacity,
        resetOpacity,
        isDecaying,
        isDraggingRef,
        danceRequired,
        registerDance,
        startDance,
        finishDance,
      }}
    >
      {children}
    </OpacityContext.Provider>
  );
}

export function useOpacity() {
  const context = useContext(OpacityContext);
  if (!context) {
    throw new Error('useOpacity must be used within an OpacityProvider');
  }
  return context;
}
