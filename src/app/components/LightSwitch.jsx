import React from 'react';

/**
 * Bespoke tactile physical light switch button.
 * Flips between room lights ON (daylight view) and room lights OFF (flashlight dark mode).
 * Emits click coordinates to center the radial flashlight beam over the switch.
 */
export default function LightSwitch({ isFlashlight, onToggle, disabled = false, disabledReason }) {
  const isLightsOn = !isFlashlight;

  const handleClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (onToggle) {
      onToggle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLightsOn}
      aria-disabled={disabled || undefined}
      aria-label={
        isLightsOn
          ? 'Turn room lights OFF (activate flashlight mode)'
          : 'Turn room lights ON (daylight view)'
      }
      title={
        disabled
          ? disabledReason || 'The switch is locked.'
          : isLightsOn
            ? 'Room lights are ON. Click switch to turn OFF and use flashlight.'
            : 'Room lights are OFF (Flashlight active). Click switch to turn lights ON.'
      }
      onClick={handleClick}
      className={`group relative flex flex-col items-center justify-between rounded-lg border border-slate-300/90 bg-gradient-to-b from-slate-50 to-slate-200 p-1 shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-400 active:scale-95'
      }`}
      style={{
        width: '34px',
        height: '46px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Top Faceplate Screw Rivet */}
      <span
        className="h-1 w-1 rounded-full bg-slate-400/80 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.4)]"
        aria-hidden="true"
      />

      {/* Recessed Bezel & Rocker Switch Paddle */}
      <div
        className="relative flex h-[30px] w-[20px] items-center justify-center overflow-hidden rounded-[4px] border border-slate-300 bg-slate-300/70 p-0.5 shadow-inner"
        aria-hidden="true"
      >
        <div
          className={`relative flex h-full w-full flex-col justify-between rounded-[3px] transition-all duration-200 ease-out ${
            isLightsOn
              ? 'bg-gradient-to-b from-white to-slate-200 shadow-[0_2px_3px_rgba(0,0,0,0.25)] translate-y-[-1px]'
              : 'bg-gradient-to-b from-slate-200 to-white shadow-[0_-2px_3px_rgba(0,0,0,0.2)] translate-y-[1px]'
          }`}
        >
          {/* Upper Rocker Half */}
          <div
            className={`flex flex-1 items-center justify-center border-b transition-colors ${
              isLightsOn
                ? 'border-slate-300/60 bg-white/60'
                : 'border-slate-300/80 bg-slate-300/40'
            }`}
          >
            {/* Tiny debossed dash / indicator */}
            <span
              className={`h-[2px] w-2 rounded-full transition-colors ${
                isLightsOn ? 'bg-blue-600' : 'bg-slate-400/60'
              }`}
            />
          </div>

          {/* Lower Rocker Half with Night Pilot Light */}
          <div
            className={`flex flex-1 items-center justify-center transition-colors ${
              !isLightsOn
                ? 'bg-white/80'
                : 'bg-slate-300/50'
            }`}
          >
            {/* Glow dot when room lights are OFF so you can find switch in dark */}
            <span
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                !isLightsOn
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse'
                  : 'bg-slate-300/80'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Faceplate Screw Rivet */}
      <span
        className="h-1 w-1 rounded-full bg-slate-400/80 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.4)]"
        aria-hidden="true"
      />
    </button>
  );
}
