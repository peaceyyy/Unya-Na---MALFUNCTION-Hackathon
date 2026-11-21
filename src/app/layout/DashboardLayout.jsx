import React, { useRef, useEffect } from 'react';
import Navbar from './Navbar';
import FlashlightOverlay from '../components/FlashlightOverlay';
import Doomscroll from '../../features/extras/Doomscroll';
import { useTheme } from '../context/ThemeContext';
import { useOpacity } from '../context/OpacityContext';
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

export default function DashboardLayout({ scrollable = true, children }) {
  const containerRef = useRef(null);
  const { isFlashlight } = useTheme();
  const { opacity, resetOpacity } = useOpacity();

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
      <Navbar />

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

      {opacity === 0 && (
        <div
          onClick={resetOpacity}
          className="absolute inset-0 top-14 flex items-center justify-center cursor-pointer z-20 bg-canvas/60 backdrop-blur-xs transition-opacity duration-300"
        >
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-lg space-y-2 max-w-sm mx-4">
            <span className="inline-block text-2xl">😴</span>
            <p className="font-display text-lg font-bold text-ink">
              Unya na... everything faded away.
            </p>
            <p className="text-xs text-ink-secondary">
              Click anywhere or drag the top slider to restore the interface.
            </p>
          </div>
        </div>
      )}

      {/* Persistent Bottom-Right Doomscroll Corner */}
      <Doomscroll />

      {isFlashlight && <FlashlightOverlay />}
    </div>
  );
}
