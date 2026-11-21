import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Lets a fixed-position widget be dragged around the screen.
//
//   const move = useMovable('some_storage_key');
//   <div ref={move.ref}> ... <div data-drag-handle>drag here</div> ... </div>
//
// Mark what can be dragged with `data-drag-handle`:
//   data-drag-handle                     a plain handle (a header bar, a strip). Presses on buttons or
//                                        inputs inside it still work normally, and double-clicking it
//                                        puts the widget back where it started.
//   data-drag-handle="interactive"       something that is itself clickable (a launcher button). A press
//                                        that moves a few pixels drags; a press that does not is a click.
//
// The widget keeps its normal CSS position and is moved with a translate, so "back where it started"
// is just an offset of 0,0. The offset is remembered in localStorage and is always kept on screen.

const EDGE = 8; // space kept from the screen edges
const TOP_EDGE = 60; // and the top bar (56px) stays clear
const DRAG_THRESHOLD = 5; // pixels a press must move before it counts as a drag
const INTERACTIVE =
  'button, a, input, textarea, select, [role="button"], sakuga-button, sakuga-input, sakuga-textarea, sakuga-slider, sakuga-toggle';

function readOffset(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return { x: saved.x, y: saved.y };
  } catch {
    // nothing saved, or not readable
  }
  return { x: 0, y: 0 };
}

export function useMovable(storageKey) {
  const ref = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // The transform is written straight to the element (not through React state), so a drag follows
  // the pointer on the same frame and measurements always see the current position.
  const apply = useCallback(
    (next, save) => {
      offset.current = next;
      const el = ref.current;
      if (el) el.style.transform = next.x || next.y ? `translate(${next.x}px, ${next.y}px)` : '';
      if (save) {
        try {
          if (next.x || next.y) localStorage.setItem(storageKey, JSON.stringify(next));
          else localStorage.removeItem(storageKey);
        } catch {
          // the position just will not be remembered
        }
      }
    },
    [storageKey],
  );

  // Keeps the widget fully on screen (and below the top bar), whatever size it currently is.
  const clamp = useCallback((wanted) => {
    const el = ref.current;
    if (!el) return wanted;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return wanted;
    const baseLeft = box.left - offset.current.x; // where it sits with no offset
    const baseTop = box.top - offset.current.y;
    const minX = EDGE - baseLeft;
    const maxX = window.innerWidth - EDGE - box.width - baseLeft;
    const minY = TOP_EDGE - baseTop;
    const maxY = window.innerHeight - EDGE - box.height - baseTop;
    return {
      x: Math.round(Math.max(minX, Math.min(wanted.x, maxX))),
      y: Math.round(Math.max(minY, Math.min(wanted.y, maxY))),
    };
  }, []);

  // Restore the saved position before the first paint, so the widget does not jump.
  useLayoutEffect(() => {
    apply(clamp(readOffset(storageKey)), false);
  }, [apply, clamp, storageKey]);

  // Re-fit when the window or the widget changes size (the video panel opening, a smaller window).
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const fitted = clamp(offset.current);
      if (fitted.x !== offset.current.x || fitted.y !== offset.current.y) apply(fitted, true);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [apply, clamp]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let session = null;
    let justDragged = false;

    // The handle under a press, or null. composedPath() looks through shadow roots (Sakuga buttons).
    const handleFor = (event) => {
      const path = event.composedPath();
      const at = path.findIndex((node) => node instanceof Element && node.hasAttribute('data-drag-handle'));
      if (at < 0) return null;
      const handle = path[at];
      if (handle.getAttribute('data-drag-handle') !== 'interactive') {
        // A plain handle: leave presses on buttons and inputs inside it alone.
        if (path.slice(0, at).some((node) => node instanceof Element && node.matches(INTERACTIVE))) return null;
      }
      return handle;
    };

    const onMove = (event) => {
      if (!session || event.pointerId !== session.id) return;
      const dx = event.clientX - session.x;
      const dy = event.clientY - session.y;
      if (!session.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        session.moved = true;
        setDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
      apply(clamp({ x: session.start.x + dx, y: session.start.y + dy }), false);
    };

    const onUp = (event) => {
      if (!session || event.pointerId !== session.id) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (session.moved) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        apply(offset.current, true);
        setDragging(false);
        justDragged = true; // the click that follows the release must not trigger the button
        setTimeout(() => {
          justDragged = false;
        }, 0);
      }
      session = null;
    };

    const onDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (!handleFor(event)) return;
      session = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...offset.current }, moved: false };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };

    const onClick = (event) => {
      if (justDragged) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onDoubleClick = (event) => {
      const handle = handleFor(event);
      if (handle && handle.getAttribute('data-drag-handle') !== 'interactive') apply({ x: 0, y: 0 }, true);
    };

    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dblclick', onDoubleClick);
    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [apply, clamp]);

  return { ref, dragging };
}
