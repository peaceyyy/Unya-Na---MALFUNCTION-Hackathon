import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const OpacityContext = createContext({
  opacity: 100,
  setOpacity: () => {},
  resetOpacity: () => {},
  isDecaying: false,
  isDraggingRef: { current: false },
});

// Decay configuration:
// Every 5 seconds (5000ms), reduce opacity by 1%
const DECAY_INTERVAL_MS = 1500; // 1.5 seconds per tick
const DECAY_STEP = 1;           // -1% every 5 seconds

export function OpacityProvider({ children }) {
  const [opacity, setOpacityState] = useState(100);
  const isDraggingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastDecayTimeRef = useRef(Date.now());
  const [isDecaying, setIsDecaying] = useState(false);

  const setOpacity = useCallback((val) => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setOpacityState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      return Math.max(0, Math.min(100, Math.round(next)));
    });
  }, []);

  const resetOpacity = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastDecayTimeRef.current = Date.now();
    setOpacityState(100);
  }, []);

  useEffect(() => {
    const recordActivity = () => {
      lastActivityRef.current = Date.now();
      lastDecayTimeRef.current = Date.now();
      setIsDecaying(false);
    };

    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    // Check decay every 500ms against the 5-second interval
    const timer = setInterval(() => {
      // Don't decay if user is actively dragging the slider
      if (isDraggingRef.current) {
        lastActivityRef.current = Date.now();
        lastDecayTimeRef.current = Date.now();
        setIsDecaying(false);
        return;
      }

      const now = Date.now();
      if (now - lastDecayTimeRef.current >= DECAY_INTERVAL_MS) {
        lastDecayTimeRef.current = now;
        setIsDecaying(true);
        setOpacityState((prev) => Math.max(0, prev - DECAY_STEP));
      }
    }, 500);

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
