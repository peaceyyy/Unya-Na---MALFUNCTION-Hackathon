import React, { useEffect, useRef } from 'react';

export default function SakugaSlider({
  value,
  disabled = false,
  readOnly = true,
  label = 'Interface opacity indicator',
}) {
  const ref = useRef(null);

  // Sync value from props to custom element
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const numericVal = Math.round(Number(value));
    if (Number(el.value) !== numericVal) {
      el.value = numericVal;
    }
  }, [value]);

  // Sync disabled state
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (disabled !== undefined) {
      el.disabled = disabled;
    }
  }, [disabled]);

  return (
    <div
      className="relative flex items-center justify-center overflow-visible select-none pointer-events-none"
      style={{
        width: '135px',
        height: '42px',
        '--sk-slider-width': '160px',
        '--sk-pri': '#2563eb',
        '--sk-acc': '#2563eb',
      }}
      title={`Interface opacity: ${Math.round(Number(value))}%`}
      aria-hidden="true"
    >
      <sakuga-slider
        ref={ref}
        min="0"
        max="100"
        step="1"
        value={value}
        unit="%"
        bubble="bottom"
        readonly={readOnly ? '' : undefined}
        label={label}
        style={{
          margin: 0,
          transform: 'scale(0.68)',
          transformOrigin: 'center center',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
