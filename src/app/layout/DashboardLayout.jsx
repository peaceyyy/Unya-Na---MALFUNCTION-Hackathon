import React, { useRef, useEffect } from 'react';
import Navbar from './Navbar';
import FlashlightOverlay from '../components/FlashlightOverlay';
import Doomscroll from '../../features/extras/Doomscroll';
import { useTheme } from '../context/ThemeContext';
import { useOpacity, DANCE_STOP_AT, DANCE_STEP } from '../context/OpacityContext';
import DanceGate from '../../features/dance/DanceGate';
import PowerNotice from '../../features/power/PowerNotice';
import styles from './DashboardLayout.module.css';

function canElementScrollVertically(target, boundary, deltaY) {
  let node = target;
  while (node && node !== boundary && node !== document.body) {
    if (node instanceof HTMLElement) {
      const { overflowY } = window.getComputedStyle(node);
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
      if (isScrollable && node.scrollHeight > node.clientHeight) {
        const scrollingDown = deltaY > 0;
        const canScrollDown = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
        const canScrollUp = node.scrollTop > 0;
        if ((scrollingDown && canScrollDown) || (!scrollingDown && canScrollUp)) {
          return true;
        }
      }
    }
    node = node.parentElement;
  }
  return false;
}

export default function DashboardLayout({ scrollable = true, onLogout, children }) {
  const containerRef = useRef(null);
  const { isFlashlight } = useTheme();
  const { opacity, danceRequired, registerDance, finishDance } = useOpacity();

  useEffect(() => {
    if (!scrollable) return;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      if (e.deltaY !== 0) {
        if (canElementScrollVertically(e.target, container, e.deltaY)) {
          return;
        }
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scrollable]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-ink relative">
      <Navbar onLogout={onLogout} />

      {scrollable ? (
        <main
          ref={containerRef}
          style={{ opacity: opacity / 100, transition: 'opacity 0.2s ease-out' }}
          className={`relative flex flex-1 w-full flex-row overflow-x-auto overflow-y-hidden ${styles.scrollContainer}`}
        >
          {children}
        </main>
      ) : (
        <main
          style={{ opacity: opacity / 100, transition: 'opacity 0.2s ease-out' }}
          className="relative flex flex-1 w-full flex-col overflow-y-auto"
        >
          {children}
        </main>
      )}

      {danceRequired && (
        <DanceGate
          opacity={opacity}
          stopAt={DANCE_STOP_AT}
          step={DANCE_STEP}
          onDance={registerDance}
          onDone={finishDance}
        />
      )}

      {/* Persistent Bottom-Right Doomscroll Corner */}
      <Doomscroll />

      {isFlashlight && <FlashlightOverlay />}
      <PowerNotice />
    </div>
  );
}
