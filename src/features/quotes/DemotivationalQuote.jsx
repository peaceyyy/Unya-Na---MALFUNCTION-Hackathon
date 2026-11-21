import React, { useState } from 'react';
import { DEMOTIVATIONAL_QUOTES, getDailyQuoteIndex } from './quotes';

export default function DemotivationalQuote() {
  const [index, setIndex] = useState(() => getDailyQuoteIndex());
  const quote = DEMOTIVATIONAL_QUOTES[index];

  const handleNextQuote = () => {
    setIndex((prev) => {
      if (DEMOTIVATIONAL_QUOTES.length <= 1) return prev;
      let next = Math.floor(Math.random() * DEMOTIVATIONAL_QUOTES.length);
      if (next === prev) {
        next = (prev + 1) % DEMOTIVATIONAL_QUOTES.length;
      }
      return next;
    });
  };

  return (
    <article className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-block rounded-md bg-accent-indigo/10 px-2.5 py-1 text-xs font-medium text-accent-indigo">
          Daily Demotivation
        </span>

        <button
          type="button"
          onClick={handleNextQuote}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg
            className="h-3.5 w-3.5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          <span></span>
        </button>
      </div>

      <blockquote className="font-display text-2xl font-bold leading-snug text-ink">
        &ldquo;{quote.text}&rdquo;
      </blockquote>

      <p className="text-sm text-ink-secondary">
        - {quote.attribution}
      </p>
    </article>
  );
}
