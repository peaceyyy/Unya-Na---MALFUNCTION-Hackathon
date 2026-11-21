import React, { useEffect, useRef, useState } from 'react';

const FAN_WIDTH = 86;
const FAN_HEIGHT = 136;
const FAN_SPEED = 2.8;
const MAX_CURSOR_SPEED = 0.75; // px per ms

// Exact geometry of the blue wind cone SVG (left: 78px, top: 44%, width: 190px, height: 160px)
const CONE_START_X = 78 - FAN_WIDTH / 2; // 35px from fan center
const CONE_LENGTH = 190;
const CONE_CENTER_Y_OFFSET = 0.44 * FAN_HEIGHT - FAN_HEIGHT / 2; // -8.16px from fan center
const CONE_HALF_WIDTH_NEAR = 34; // 80 - 46
const CONE_HALF_WIDTH_FAR = 80; // 80 - 0

export default function FanCursorController({ containerRef }) {
  const overlayRef = useRef(null);
  const fanElRef = useRef(null);
  const cursorElRef = useRef(null);
  const coneElRef = useRef(null);

  const fanPosRef = useRef({ x: 32, y: 120 });
  const fanAngleRef = useRef(0); // degrees, automatically aimed at the cursor
  const cursorPosRef = useRef({ x: 260, y: 210 });
  const cursorVelRef = useRef({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hoveredBtnRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [clickRipple, setClickRipple] = useState(null);

  // Trigger click at virtual cursor's tip
  const triggerVirtualClick = () => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    const rect = container.getBoundingClientRect();
    const tipX = cursorPosRef.current.x + 2;
    const tipY = cursorPosRef.current.y + 2;
    const viewportX = rect.left + tipX;
    const viewportY = rect.top + tipY;

    setClickRipple({ x: tipX, y: tipY, id: Date.now() });
    setTimeout(() => {
      setClickRipple((prev) => (prev && Date.now() - prev.id >= 260 ? null : prev));
    }, 280);

    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(viewportX, viewportY);
    overlay.style.pointerEvents = 'auto';

    if (el) {
      const targetBtn = el.closest('button, a, [role="button"]');
      if (targetBtn && container.contains(targetBtn)) {
        targetBtn.click();
      }
    }
  };

  // Main physics & render loop
  useEffect(() => {
    let rafId = null;
    let lastTime = null;

    const clearHoverHighlight = () => {
      if (hoveredBtnRef.current) {
        hoveredBtnRef.current.removeAttribute('data-fan-hover');
        hoveredBtnRef.current = null;
      }
    };

    const step = (time) => {
      rafId = requestAnimationFrame(step);

      if (lastTime === null) {
        lastTime = time;
        return;
      }

      const dt = Math.min(time - lastTime, 48);
      lastTime = time;

      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const fanCenterX = fanPosRef.current.x + FAN_WIDTH / 2;
      const fanCenterY = fanPosRef.current.y + FAN_HEIGHT / 2;
      const cursorCenterX = cursorPosRef.current.x + 10;
      const cursorCenterY = cursorPosRef.current.y + 10;

      const dx = cursorCenterX - fanCenterX;
      const dy = cursorCenterY - fanCenterY;
      const distance = Math.hypot(dx, dy);

      // Automatically rotate fan to face the cursor
      const fanAngleRad = Math.atan2(dy, dx);
      fanAngleRef.current = ((fanAngleRad * 180) / Math.PI + 360) % 360;

      const cosA = Math.cos(fanAngleRad);
      const sinA = Math.sin(fanAngleRad);

      // Transform cursor position into fan-local coordinates to match the blue cone polygon
      const forward = dx * cosA + dy * sinA;
      const lateral = -dx * sinA + dy * cosA;
      const coneX = forward - CONE_START_X;
      const coneY = lateral - CONE_CENTER_Y_OFFSET;

      const t = Math.min(Math.max(coneX / CONE_LENGTH, 0), 1);
      const halfWidthAtX =
        CONE_HALF_WIDTH_NEAR + t * (CONE_HALF_WIDTH_FAR - CONE_HALF_WIDTH_NEAR);

      // Cursor only moves when inside the blue wind area
      const inBlueArea =
        distance > 6 &&
        coneX >= -4 &&
        coneX <= CONE_LENGTH &&
        Math.abs(coneY) <= halfWidthAtX;

      const dragScale = dt / 16.67;

      if (inBlueArea) {
        const clampedDist = Math.max(distance, 38);
        const centerFactor = 1 - 0.35 * (Math.abs(coneY) / halfWidthAtX);
        const force = (Math.pow(FAN_SPEED / 10, 2) * centerFactor) / clampedDist;
        cursorVelRef.current.x += (dx / distance) * force * dt;
        cursorVelRef.current.y += (dy / distance) * force * dt;

        // Quadratic air drag (matches reference repo so velocity accumulates cleanly from rest)
        const decelX = 0.05 * cursorVelRef.current.x * cursorVelRef.current.x * dragScale;
        const decelY = 0.05 * cursorVelRef.current.y * cursorVelRef.current.y * dragScale;
        cursorVelRef.current.x -=
          Math.sign(cursorVelRef.current.x) *
          Math.min(Math.abs(cursorVelRef.current.x), decelX);
        cursorVelRef.current.y -=
          Math.sign(cursorVelRef.current.y) *
          Math.min(Math.abs(cursorVelRef.current.y), decelY);

        // Clamp top speed for controllability
        const speed = Math.hypot(cursorVelRef.current.x, cursorVelRef.current.y);
        if (speed > MAX_CURSOR_SPEED) {
          const scale = MAX_CURSOR_SPEED / speed;
          cursorVelRef.current.x *= scale;
          cursorVelRef.current.y *= scale;
        }
      } else {
        // When outside the blue wind area, smoothly decelerate to a stop
        const stopDamping = Math.pow(0.88, dragScale);
        cursorVelRef.current.x *= stopDamping;
        cursorVelRef.current.y *= stopDamping;
        if (Math.abs(cursorVelRef.current.x) < 0.0005) cursorVelRef.current.x = 0;
        if (Math.abs(cursorVelRef.current.y) < 0.0005) cursorVelRef.current.y = 0;
      }

      // Update cursor position and clamp within container
      let nextX = cursorPosRef.current.x + cursorVelRef.current.x * dt;
      let nextY = cursorPosRef.current.y + cursorVelRef.current.y * dt;

      const maxCursorX = Math.max(0, width - 24);
      const maxCursorY = Math.max(0, height - 24);

      if (nextX < 0) {
        nextX = 0;
        cursorVelRef.current.x = 0;
      } else if (nextX > maxCursorX) {
        nextX = maxCursorX;
        cursorVelRef.current.x = 0;
      }

      if (nextY < 0) {
        nextY = 0;
        cursorVelRef.current.y = 0;
      } else if (nextY > maxCursorY) {
        nextY = maxCursorY;
        cursorVelRef.current.y = 0;
      }

      cursorPosRef.current.x = nextX;
      cursorPosRef.current.y = nextY;

      // Clamp fan inside container bounds
      const maxFanX = Math.max(0, width - FAN_WIDTH);
      const maxFanY = Math.max(0, height - FAN_HEIGHT);
      fanPosRef.current.x = Math.min(Math.max(0, fanPosRef.current.x), maxFanX);
      fanPosRef.current.y = Math.min(Math.max(0, fanPosRef.current.y), maxFanY);

      // Update DOM transforms directly for smooth 60fps animation
      if (fanElRef.current) {
        fanElRef.current.style.transform = `translate3d(${fanPosRef.current.x}px, ${fanPosRef.current.y}px, 0) rotate(${fanAngleRef.current}deg)`;
      }

      if (coneElRef.current) {
        coneElRef.current.style.opacity = inBlueArea ? '0.95' : '0.45';
      }

      if (cursorElRef.current) {
        cursorElRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }

      // Highlight button currently under the virtual cursor tip
      const containerRect = container.getBoundingClientRect();
      const tipViewportX = containerRect.left + nextX + 2;
      const tipViewportY = containerRect.top + nextY + 2;

      const buttons = container.querySelectorAll('button');
      let foundBtn = null;
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const r = btn.getBoundingClientRect();
        if (
          tipViewportX >= r.left &&
          tipViewportX <= r.right &&
          tipViewportY >= r.top &&
          tipViewportY <= r.bottom
        ) {
          foundBtn = btn;
          break;
        }
      }

      if (foundBtn !== hoveredBtnRef.current) {
        clearHoverHighlight();
        if (foundBtn) {
          foundBtn.setAttribute('data-fan-hover', 'true');
          hoveredBtnRef.current = foundBtn;
        }
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearHoverHighlight();
    };
  }, [containerRef]);

  // Global pointermove / pointerup for dragging the fan
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      fanPosRef.current.x = localX - dragOffsetRef.current.x;
      fanPosRef.current.y = localY - dragOffsetRef.current.y;
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [containerRef]);

  const handleFanPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: localX - fanPosRef.current.x,
      y: localY - fanPosRef.current.y,
    };
    setIsDragging(true);
  };

  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerVirtualClick();
  };

  return (
    <>
      {/* Transparent shield over calculator: blocks direct button clicks, fires clicks at virtual cursor */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="absolute inset-0 z-20 cursor-crosshair select-none"
        aria-hidden="true"
      />

      {/* Draggable Side-View Fan (rotates automatically toward the cursor) */}
      <div
        ref={fanElRef}
        onPointerDown={handleFanPointerDown}
        style={{
          width: `${FAN_WIDTH}px`,
          height: `${FAN_HEIGHT}px`,
          transformOrigin: 'center center',
          transform: `translate3d(${fanPosRef.current.x}px, ${fanPosRef.current.y}px, 0) rotate(${fanAngleRef.current}deg)`,
        }}
        className={`absolute top-0 left-0 z-30 select-none touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Drag to move the fan"
      >
        {/* Wind cone projecting forward (+X direction from the fan cage) */}
        <div
          ref={coneElRef}
          className="pointer-events-none absolute left-[78px] top-[44%] -translate-y-1/2 transition-opacity duration-150"
          style={{ width: '190px', height: '160px' }}
        >
          <svg viewBox="0 0 190 160" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="fanWindGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="0,46 190,0 190,160 0,114" fill="url(#fanWindGrad)" />
            <line
              x1="10"
              y1="64"
              x2="125"
              y2="34"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              strokeOpacity="0.55"
            />
            <line
              x1="14"
              y1="80"
              x2="150"
              y2="80"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="8 6"
              strokeOpacity="0.65"
            />
            <line
              x1="10"
              y1="96"
              x2="125"
              y2="126"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              strokeOpacity="0.55"
            />
          </svg>
        </div>

        {/* Side-view fan model */}
        <img
          src="/fan.png"
          alt="Desk fan"
          draggable={false}
          className="pointer-events-none h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)]"
        />
      </div>

      {/* Virtual Cursor (blown by the fan) */}
      <div
        ref={cursorElRef}
        style={{
          transform: `translate3d(${cursorPosRef.current.x}px, ${cursorPosRef.current.y}px, 0)`,
        }}
        className="pointer-events-none absolute top-0 left-0 z-40 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 2L19 12.5L11.5 14L8.5 21.5L3 2Z"
            fill="#ffffff"
            stroke="#1f1c17"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Click ripple at virtual cursor */}
      {clickRipple && (
        <div
          key={clickRipple.id}
          style={{
            left: `${clickRipple.x}px`,
            top: `${clickRipple.y}px`,
          }}
          className="pointer-events-none absolute z-40 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/20 animate-ping"
          aria-hidden="true"
        />
      )}
    </>
  );
}
