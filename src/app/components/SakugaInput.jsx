import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Controlled single-line text field. `onInput` receives the new text; `onEnter` fires when
// Enter is pressed (the element sits in a shadow root, so a surrounding <form> never sees it).
const SakugaInput = forwardRef(function SakugaInput(
  { value, onInput, onEnter, placeholder = '', label = 'Text', disabled = false, id },
  forwardedRef,
) {
  const ref = useRef(null);
  const handler = useRef(onInput);
  handler.current = onInput;
  const enterHandler = useRef(onEnter);
  enterHandler.current = onEnter;

  useImperativeHandle(forwardedRef, () => ({
    focus: () => ref.current?.focus(), // the element delegates focus to the real input inside
  }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const listener = () => handler.current?.(el.value);
    const keyListener = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        enterHandler.current?.();
      }
    };
    el.addEventListener('input', listener);
    el.addEventListener('keydown', keyListener);
    return () => {
      el.removeEventListener('input', listener);
      el.removeEventListener('keydown', keyListener);
    };
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
});

export default SakugaInput;
