import React from 'react';

/**
 * UnnecessaryVoid
 * An absurdly, annoyingly long horizontal scroll corridor (~100,000px total width)
 * that tests and rewards a user's absolute peak dedication to procrastination.
 */
export default function UnnecessaryVoid({ onOpenRating }) {
  const handleTeleport = (e) => {
    const container = e.currentTarget.closest('main') || document.querySelector('main');
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      aria-label="The Unnecessary Void"
      className="flex h-full shrink-0 flex-row items-center select-none"
    >
      {/* 1. Milestone: 5,000px */}
      <div
        style={{ width: 5000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-sm rounded-2xl border border-dashed border-border-strong bg-surface-subtle/70 p-6 text-center space-y-2 backdrop-blur-xs shadow-xs">
          <div className="text-2xl" aria-hidden="true">🌫️</div>
          <span className="inline-block rounded-md bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-accent uppercase">
            5,000px • 5%
          </span>
          <h4 className="font-display text-base font-bold text-ink">
            Entering the void
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            You've left the apps behind. There are no tools here, only quiet avoidance.
          </p>
        </div>
      </div>

      {/* 2. Milestone: 15,000px */}
      <div
        style={{ width: 10000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-sm rounded-2xl border border-dashed border-border-strong bg-surface/80 p-6 text-center space-y-2 shadow-xs">
          <div className="text-2xl" aria-hidden="true">👀</div>
          <span className="inline-block rounded-md bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-accent uppercase">
            15,000px • 15%
          </span>
          <h4 className="font-display text-base font-bold text-ink">
            Wait, you're actually still scrolling?
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            You just scrolled through 15,000 pixels. That's about 10 full monitor screens of pure empty space.
          </p>
        </div>
      </div>

      {/* 3. Milestone: 30,000px */}
      <div
        style={{ width: 15000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-md rounded-2xl border border-border-strong bg-surface p-7 text-center space-y-3 shadow-xs">
          <div className="text-3xl" aria-hidden="true">☕</div>
          <span className="inline-block rounded-md bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
            30,000px • 30%
          </span>
          <h4 className="font-display text-lg font-bold text-ink">
            Did your tasks finish themselves yet?
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Probably not. But here you are, wheel spinning into the digital abyss. Rest is essential, but this is bordering on an Olympic sport.
          </p>
          <button
            type="button"
            onClick={handleTeleport}
            className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
          >
            ← Give up and go back
          </button>
        </div>
      </div>

      {/* 4. The Halfway Mark: 50,000px ("Where do you wanna go?") */}
      <div
        style={{ width: 20000 }}
        className="flex h-full shrink-0 items-center justify-center px-20"
      >
        <div className="max-w-lg rounded-3xl border-2 border-dashed border-accent/50 bg-surface p-10 text-center space-y-4 shadow-md">
          <div className="text-4xl" aria-hidden="true">🧭</div>
          <span className="inline-block rounded-full bg-accent/15 px-4 py-1 text-xs font-black text-accent tracking-widest uppercase">
            Halfway Mark • 50,000px
          </span>

          <h3 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight">
            "Where do you wanna go?"
          </h3>

          <p className="text-sm text-ink-secondary leading-relaxed">
            Fifty thousand pixels. Halfway to nowhere. Your deadlines are now legally in another time zone. What exactly are you looking for out here?
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTeleport}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white hover:bg-accent-hover shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ← Teleport back to safety
            </button>
            <span className="text-[11px] text-ink-muted">
              (or endure another 50,000px of regret)
            </span>
          </div>
        </div>
      </div>

      {/* 5. Milestone: 70,000px */}
      <div
        style={{ width: 20000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-md rounded-2xl border border-dashed border-border-strong bg-surface/90 p-7 text-center space-y-3 shadow-xs">
          <div className="text-3xl" aria-hidden="true">🩹</div>
          <span className="inline-block rounded-md bg-orange-100 text-orange-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
            70,000px • 70%
          </span>
          <h4 className="font-display text-lg font-bold text-ink">
            Is your finger cramping yet?
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Your scroll wheel is screaming for WD-40. Unya na lang gud tiwasa.
          </p>
        </div>
      </div>

      {/* 6. Milestone: 85,000px */}
      <div
        style={{ width: 15000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-md rounded-2xl border border-red-300 bg-red-50/60 p-7 text-center space-y-2.5 shadow-xs">
          <div className="text-3xl" aria-hidden="true">⚠️</div>
          <span className="inline-block rounded-md bg-red-100 text-red-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
            85,000px • 85%
          </span>
          <h4 className="font-display text-lg font-bold text-ink">
            Warning: Approaching the edge of human patience
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            There is genuinely no hidden feature here. No prize. No secret minigame. Just a website respecting your absolute refusal to be productive.
          </p>
        </div>
      </div>

      {/* 7. Milestone: 95,000px */}
      <div
        style={{ width: 10000 }}
        className="flex h-full shrink-0 items-center justify-center px-16"
      >
        <div className="max-w-sm rounded-2xl border border-dashed border-border-strong bg-surface p-6 text-center space-y-2">
          <div className="text-3xl" aria-hidden="true">🏁</div>
          <span className="inline-block rounded-md bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
            95,000px • 95%
          </span>
          <h4 className="font-display text-base font-bold text-ink">
            Almost there...
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Just 5,000 more pixels of stubborn persistence.
          </p>
        </div>
      </div>

      {/* 8. Terminal Dead End: 100,000px */}
      <div
        style={{ width: 5000 }}
        className="flex h-full shrink-0 items-center justify-center px-20 pr-40"
      >
        <div className="max-w-lg w-full rounded-3xl border-2 border-border-strong bg-surface p-10 text-center space-y-5 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent text-3xl font-bold shadow-xs">
            🕳️
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-red-100 px-3.5 py-1 text-xs font-black text-red-700 tracking-widest uppercase">
              The Absolute Edge • 100,000px
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-ink">
              There's nothing here. Here, rate us again
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              You scrolled through <strong className="text-ink font-bold">100,000 pixels</strong> of pure nothingness. That is over 50 full screen-widths of deliberate procrastination. We are in awe of your stubbornness.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onOpenRating}
              className="w-full rounded-xl bg-accent py-3.5 px-5 text-sm font-bold text-white shadow-sm hover:bg-accent-hover active:scale-98 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ⭐ Rate Unya Na again
            </button>

            <button
              type="button"
              onClick={handleTeleport}
              className="w-full rounded-xl border border-border-strong bg-surface-subtle py-2.5 px-4 text-xs font-semibold text-ink hover:bg-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ← Teleport all the way back (100,000px journey)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
