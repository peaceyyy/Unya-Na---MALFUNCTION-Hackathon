import React, { useState, useEffect, useRef, useCallback } from 'react';
import './sakuga-rating.js';
import styles from './RatingModal.module.css';

function SakugaStarInput({ value, onChange, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.value = value || 0;
    if (disabled !== undefined) {
      el.disabled = disabled;
    }

    const handleChange = () => {
      if (typeof onChange === 'function') {
        onChange(Number(el.value));
      }
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [value, onChange, disabled]);

  return (
    <div className={styles.starWrapper}>
      <sakuga-rating ref={ref} label="Rating" />
    </div>
  );
}

export default function RatingModalManager({ isOpen, onClose }) {
  const [instances, setInstances] = useState([
    {
      id: 1,
      stars: 0,
      offsetX: 0,
      offsetY: 0,
    },
  ]);

  const [draggingId, setDraggingId] = useState(null);
  const [zIndices, setZIndices] = useState({ 1: 70 });
  const dragRef = useRef({
    active: false,
    id: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setInstances([
        {
          id: 1,
          stars: 0,
          offsetX: 0,
          offsetY: 0,
        },
      ]);
      setZIndices({ 1: 70 });
      setDraggingId(null);
    }
  }, [isOpen]);

  // Bring clicked or dragged modal to top
  const bringToTop = useCallback((id) => {
    setZIndices((prev) => {
      const highest = Math.max(...Object.values(prev), 70);
      return {
        ...prev,
        [id]: highest + 1,
      };
    });
  }, []);

  // Global window pointer listeners while dragging
  useEffect(() => {
    if (!draggingId) return;

    const handleWindowPointerMove = (e) => {
      const drag = dragRef.current;
      if (!drag.active || drag.id === null) return;

      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;

      // Viewport boundary clamping to keep dialogs accessible
      const maxBoundX = Math.max(120, window.innerWidth / 2 - 80);
      const maxBoundY = Math.max(100, window.innerHeight / 2 - 80);
      const clampedX = Math.max(-maxBoundX, Math.min(maxBoundX, drag.initialX + deltaX));
      const clampedY = Math.max(-maxBoundY, Math.min(maxBoundY, drag.initialY + deltaY));

      setInstances((prev) =>
        prev.map((m) =>
          m.id === drag.id
            ? {
                ...m,
                offsetX: clampedX,
                offsetY: clampedY,
              }
            : m
        )
      );
    };

    const handleWindowPointerUp = () => {
      dragRef.current.active = false;
      dragRef.current.id = null;
      setDraggingId(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggingId]);

  // Pointer dragging start on modal header
  const handlePointerDown = (id, e) => {
    if (e.button !== 0) return; // Primary pointer button only
    bringToTop(id);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const targetModal = instances.find((m) => m.id === id);
    if (!targetModal) return;

    dragRef.current = {
      active: true,
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: targetModal.offsetX,
      initialY: targetModal.offsetY,
    };
    setDraggingId(id);
  };

  const handlePointerUp = (id, e) => {
    const drag = dragRef.current;
    if (drag.active && drag.id === id) {
      try {
        e.currentTarget.releasePointerCapture(drag.pointerId);
      } catch (_) {}
      dragRef.current.active = false;
      dragRef.current.id = null;
      setDraggingId(null);
    }
  };

  // Handle star rating click
  const handleRate = useCallback((id, rating) => {
    if (rating === 0) return;

    if (rating < 5) {
      // Under 5 stars: spawn another rating dialog instance
      setInstances((prev) => {
        const nextId = Math.max(...prev.map((m) => m.id)) + 1;
        const randomX = Math.round((Math.random() - 0.5) * 220);
        const randomY = Math.round((Math.random() - 0.5) * 160);

        setZIndices((zPrev) => ({
          ...zPrev,
          [nextId]: Math.max(...Object.values(zPrev), 70) + 1,
        }));

        const updated = prev.map((m) =>
          m.id === id ? { ...m, stars: rating } : m
        );

        return [
          ...updated,
          {
            id: nextId,
            stars: 0,
            offsetX: randomX,
            offsetY: randomY,
          },
        ];
      });
    } else {
      // 5 stars selected: update state to 5 stars (submit button unlocks)
      setInstances((prev) =>
        prev.map((m) => (m.id === id ? { ...m, stars: 5 } : m))
      );
    }
  }, []);

  // Submit button handler: only clickable when this modal has 5 stars
  const handleConfirm = (id) => {
    setInstances((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target || target.stars !== 5) return prev;

      const remaining = prev.filter((m) => m.id !== id);
      if (remaining.length === 0) {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
      return remaining;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rate your experience"
      className={styles.backdrop}
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {instances.map((modal) => {
          const isDragging = draggingId === modal.id;
          const currentZ = zIndices[modal.id] || 70;
          const isFiveStars = modal.stars === 5;

          return (
            <div
              key={modal.id}
              onPointerDown={() => bringToTop(modal.id)}
              style={{
                transform: `translate(${modal.offsetX}px, ${modal.offsetY}px)`,
                zIndex: isDragging ? 999 : currentZ,
              }}
              className={`absolute pointer-events-auto ${styles.modalCard} ${
                isDragging ? styles.isDragging : ''
              }`}
            >
              {/* Draggable Header */}
              <div
                className={`border-b border-slate-100 pb-3 text-center ${styles.modalHeader}`}
                onPointerDown={(e) => handlePointerDown(modal.id, e)}
                onPointerUp={(e) => handlePointerUp(modal.id, e)}
                onPointerCancel={(e) => handlePointerUp(modal.id, e)}
                title="Click and drag to move"
              >
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Rate your experience
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  How would you rate Unya Na?
                </p>
              </div>

              {/* Star Rating Input */}
              <div className="py-3">
                <SakugaStarInput
                  value={modal.stars}
                  onChange={(rating) => handleRate(modal.id, rating)}
                />
              </div>

              {/* Submit Button (Only clickable when 5 stars) */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={!isFiveStars}
                  onClick={() => handleConfirm(modal.id)}
                  aria-label={
                    isFiveStars
                      ? 'Submit rating'
                      : 'Submit rating (5 stars required)'
                  }
                  className={`w-full rounded-xl py-2.5 px-4 text-xs font-semibold transition-all ${
                    isFiveStars
                      ? 'bg-[#1752F0] text-white hover:bg-[#1242c7] active:scale-98 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
