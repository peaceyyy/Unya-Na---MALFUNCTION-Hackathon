import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from './ThemeContext';

// Simulated power cuts. While the user is signed in:
//   1. A blackout starts every 3 minutes (the first one 3 minutes after signing in).
//   2. The utility (Meralco or VECO, picked at random) announces it 30 seconds ahead.
//   3. The power goes out for 15 seconds. The interface is forced into flashlight mode and
//      the light switch is locked, so nobody can flip back to daylight until power returns.
//   4. The theme from before the blackout comes back until the next one.
export const POWER = {
  CYCLE_MS: 180_000, // one blackout starts this long after the previous one started
  ADVISORY_MS: 30_000, // announcement this long before the blackout
  OUTAGE_MS: 15_000, // how long the power stays out
  UTILITIES: ['Meralco', 'VECO'],
};

const PowerContext = createContext({
  phase: 'on', // 'on' | 'advisory' | 'out'
  utility: null,
  secondsLeft: 0,
  setPowerEnabled: () => {},
});

const pickUtility = () => POWER.UTILITIES[Math.floor(Math.random() * POWER.UTILITIES.length)];

export function PowerProvider({ children }) {
  const { theme, setTheme, setThemeLocked } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const [enabled, setPowerEnabled] = useState(false);
  const [power, setPower] = useState({ phase: 'on', utility: null, secondsLeft: 0 });

  useEffect(() => {
    if (!enabled) return undefined;

    let phase = 'on';
    let utility = null;
    let nextOutageAt = Date.now() + POWER.CYCLE_MS;
    let outageEndsAt = 0;
    let themeBeforeOutage = null;
    let lastKey = '';

    const publish = (now) => {
      const target = phase === 'out' ? outageEndsAt : nextOutageAt;
      const secondsLeft = phase === 'on' ? 0 : Math.max(0, Math.ceil((target - now) / 1000));
      const key = `${phase}|${utility}|${secondsLeft}`;
      if (key === lastKey) return; // only re-render when something visible changed
      lastKey = key;
      setPower({ phase, utility, secondsLeft });
    };

    const tick = () => {
      const now = Date.now();

      if (phase === 'on' && now >= nextOutageAt - POWER.ADVISORY_MS) {
        phase = 'advisory';
        utility = pickUtility();
      }
      if (phase === 'advisory' && now >= nextOutageAt) {
        phase = 'out';
        outageEndsAt = now + POWER.OUTAGE_MS;
        nextOutageAt = now + POWER.CYCLE_MS; // the next one starts 3 minutes after this one
        themeBeforeOutage = themeRef.current;
        setTheme('flashlight');
        setThemeLocked(true);
      }
      if (phase === 'out' && now >= outageEndsAt) {
        phase = 'on';
        setThemeLocked(false);
        setTheme(themeBeforeOutage || 'light');
        themeBeforeOutage = null;
      }
      publish(now);
    };

    tick();
    const timer = setInterval(tick, 250);

    return () => {
      clearInterval(timer);
      // Signed out (or unmounted) mid-blackout: give the lights and the switch back.
      if (phase === 'out') {
        setThemeLocked(false);
        if (themeBeforeOutage) setTheme(themeBeforeOutage);
      }
      setPower({ phase: 'on', utility: null, secondsLeft: 0 });
    };
  }, [enabled, setTheme, setThemeLocked]);

  const value = useMemo(() => ({ ...power, setPowerEnabled }), [power]);

  return <PowerContext.Provider value={value}>{children}</PowerContext.Provider>;
}

export function usePower() {
  const context = useContext(PowerContext);
  if (!context) {
    throw new Error('usePower must be used within a PowerProvider');
  }
  return context;
}
