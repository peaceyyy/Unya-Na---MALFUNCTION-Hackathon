import React from 'react';
import Captcha from './Captcha';

export default function LoginGate({ onLogin, onBack }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas p-4 text-ink select-none relative overflow-hidden">
      {/* Background warm radial accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-canvas to-canvas" />

      {/* Main Terminal Card - centered vertically and horizontally */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full space-y-4 my-auto">
        {/* Optional Back to Login Link */}
        {onBack && (
          <div className="w-full flex justify-start -mb-1">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer rounded-lg px-2 py-1 -ml-2 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Login</span>
            </button>
          </div>
        )}

        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Timing challenge
        </h1>

        {/* Precision Timer Red Button CAPTCHA */}
        <div className="w-full flex justify-center drop-shadow-md">
          <Captcha onVerifySuccess={onLogin} />
        </div>

        <div className="flex w-full justify-end px-1">
          <button
            type="button"
            onClick={onLogin}
            className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            title="Bypass captcha to boss fight"
          >
            [Dev Bypass to Boss →]
          </button>
        </div>
      </div>
    </div>
  );
}
