import React, { useEffect, useRef } from 'react';

// Controlled single-line text field. `onInput` receives the new text.
export default function SakugaInput({
  value,
  onInput,
  placeholder = '',
  label = 'Text',
  disabled = false,
  id,
}) {
  const ref = useRef(null);
  const handler = useRef(onInput);
  handler.current = onInput;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const listener = () => handler.current?.(el.value);
    el.addEventListener('input', listener);
    return () => el.removeEventListener('input', listener);
  }, []);

  // Wait for the element to be upgraded before touching its value property.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let live = true;
    customElements.whenDefined('sakuga-input').then(() => {
      if (live && el.value !== value) el.value = value;
    });
    return () => {
      live = false;
    };
  }, [value]);

  useEffect(() => {
    ref.current?.toggleAttribute('disabled', Boolean(disabled));
  }, [disabled]);

  return (
    <sakuga-input
      ref={ref}
      id={id}
      label={label}
      placeholder={placeholder}
      disabled={disabled ? '' : undefined}
      style={{ display: 'block', width: '100%', '--sk-input-width': '100%' }}
    />
  );
}
