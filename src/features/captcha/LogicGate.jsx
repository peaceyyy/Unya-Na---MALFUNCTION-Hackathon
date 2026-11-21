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

        {/* Terminal Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span>UNPRODUCTIVE OS // SECURITY GATE</span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Prove You Are a Robot
          </h1>

          <p className="text-xs text-ink-secondary max-w-xs leading-relaxed mx-auto">
            Credentials verified. Checkpoint 1 of 2: Pass the Big Red Button's sub-millisecond reflex gate. Defeat its timing lock to face the Bouncer.
          </p>
        </div>

        {/* Precision Timer Red Button CAPTCHA */}
        <div className="w-full flex justify-center drop-shadow-md">
          <Captcha onVerifySuccess={onLogin} />
        </div>

        {/* Terminal Footer Telemetry */}
        <div className="flex items-center justify-between w-full text-xs text-ink-muted border-t border-border pt-3 px-1">
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5 text-amber-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-amber-800 font-mono font-medium text-[11px]">STATUS: LOCKED</span>
          </span>

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
