import React, { useEffect, useRef } from 'react';

// Read-only by default: it mirrors state the app already knows, like the
// Sakuga slider in the navbar, and is not something the user flips by hand.
export default function SakugaToggle({
  checked,
  readOnly = true,
  label = 'Toggle',
  scale = 0.58,
  width = 68,
  height = 36,
  onChange,
}) {
  const ref = useRef(null);

  // Wait for the element to be upgraded before touching its properties.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let live = true;
    customElements.whenDefined('sakuga-toggle').then(() => {
      if (live && Boolean(el.checked) !== Boolean(checked)) el.checked = Boolean(checked);
    });
    return () => {
      live = false;
    };
  }, [checked]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onChange) return undefined;
    const handle = () => onChange(Boolean(el.checked));
    el.addEventListener('change', handle);
    return () => el.removeEventListener('change', handle);
  }, [onChange]);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-visible select-none ${readOnly ? 'pointer-events-none' : ''}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden={readOnly ? 'true' : undefined}
    >
      <sakuga-toggle
        ref={ref}
        label={label}
        style={{ margin: 0, transform: `scale(${scale})`, transformOrigin: 'center center', display: 'block' }}
      />
    </div>
  );
}
