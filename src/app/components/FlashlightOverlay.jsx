import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FlashlightOverlay() {
  const overlayRef = useRef(null);
  const { origin } = useTheme();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Determine starting position:
    // 1. Explicit click coordinates from toggleTheme
    // 2. Center coordinates of [data-theme-toggle] button
    // 3. Fallback to center of viewport
    let initialX = window.innerWidth / 2;
    let initialY = window.innerHeight / 2;

    if (origin && typeof origin.x === 'number' && typeof origin.y === 'number') {
      initialX = origin.x;
      initialY = origin.y;
    } else {
      const toggleBtn = document.querySelector('[data-theme-toggle="true"]');
      if (toggleBtn) {
        const rect = toggleBtn.getBoundingClientRect();
        initialX = rect.left + rect.width / 2;
        initialY = rect.top + rect.height / 2;
      }
    }

    overlay.style.setProperty('--cursor-x', `${initialX}px`);
    overlay.style.setProperty('--cursor-y', `${initialY}px`);

    const updatePosition = (clientX, clientY) => {
      overlay.style.setProperty('--cursor-x', `${clientX}px`);
      overlay.style.setProperty('--cursor-y', `${clientY}px`);
    };

    const handlePointerMove = (e) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [origin]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-200"
      style={{
        background: `radial-gradient(circle 180px at var(--cursor-x, 50vw) var(--cursor-y, 50vh), transparent 0px, transparent 105px, rgba(251, 191, 36, 0.04) 130px, rgba(0, 0, 0, 0.74) 160px, rgba(0, 0, 0, 0.98) 200px, #000000 240px)`,
      }}
    />
  );
}
