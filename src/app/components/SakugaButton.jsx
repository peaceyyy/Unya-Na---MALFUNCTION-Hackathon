import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// variant: 'primary' (big impact frame, can show a check via ref.done()) or 'secondary' (small squash).
const SakugaButton = forwardRef(function SakugaButton(
  { children, variant = 'primary', disabled = false, onClick, label },
  forwardedRef,
) {
  const ref = useRef(null);

  useImperativeHandle(forwardedRef, () => ({
    done: (hold) => ref.current?.done?.(hold),
  }));

  // Attributes, not properties, so nothing can shadow the element's own accessors.
  useEffect(() => {
    ref.current?.toggleAttribute('disabled', Boolean(disabled));
  }, [disabled]);

  return (
    <sakuga-button
      ref={ref}
      variant={variant}
      aria-label={label}
      disabled={disabled ? '' : undefined}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
    >
      {children}
    </sakuga-button>
  );
});

export default SakugaButton;
