import React, { useEffect, useRef } from 'react';

export default function SakugaSlider({
  value,
  disabled = false,
  readOnly = true,
  label = 'Interface opacity indicator',
  min = 0,
  max = 100,
  unit = '%',
  scale = 0.68,
  smoke = true,
  title,
}) {
  const ref = useRef(null);

  // Properties are only safe to set once the element is upgraded. Set earlier,
  // they become plain fields that shadow the component's own accessors.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let live = true;
    customElements.whenDefined('sakuga-slider').then(() => {
      if (!live) return;
      const numericVal = Math.round(Number(value));
      if (Number(el.value) !== numericVal) el.value = numericVal;
      el.disabled = disabled;
    });
    return () => {
      live = false;
    };
  }, [value, disabled]);

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
      title={title ?? `Interface opacity: ${Math.round(Number(value))}%`}
      aria-hidden="true"
    >
      <sakuga-slider
        ref={ref}
        min={min}
        max={max}
        step="1"
        value={value}
        unit={unit}
        bubble="bottom"
        readonly={readOnly ? '' : undefined}
        nosmoke={smoke ? undefined : ''}
        label={label}
        style={{
          margin: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
