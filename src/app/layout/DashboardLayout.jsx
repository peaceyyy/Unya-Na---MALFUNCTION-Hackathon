import React, { useRef, useEffect } from 'react';
import Navbar from './Navbar';
import FlashlightOverlay from '../components/FlashlightOverlay';
import { useTheme } from '../context/ThemeContext';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }) {
  const containerRef = useRef(null);
  const { isFlashlight } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // If user is already scrolling horizontally via trackpad swipe, do not override
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // Intercept vertical scroll delta and scroll horizontally
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f6f8fb] text-slate-900 relative select-none">
      {/* Constant top navigation bar */}
      <Navbar />

      {/* Horizontal scrolling canvas */}
      <div
        ref={containerRef}
        className={`relative flex flex-1 w-full flex-row overflow-x-auto overflow-y-hidden ${styles.scrollContainer}`}
      >
        {children}
      </div>

      {/* Flashlight dark room overlay */}
      {isFlashlight && <FlashlightOverlay />}
    </div>
  );
}
