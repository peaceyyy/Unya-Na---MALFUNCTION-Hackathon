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
    <details className="group shrink-0 rounded-xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-5 [&::-webkit-details-marker]:hidden">
        Daily quote
        <svg className="size-4 text-ink-muted group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="space-y-4 border-t border-border p-4 sm:p-5">
        <figure className="space-y-2" aria-live="polite">
          <blockquote className="text-base font-medium leading-relaxed text-ink">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="text-sm text-ink-secondary">{quote.attribution}</figcaption>
        </figure>
        <button
          type="button"
          onClick={handleNextQuote}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors"
        >
          <svg className="size-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 7v5h-5m5 0a8 8 0 1 0-2.3 5.7" />
          </svg>
          Next quote
        </button>
      </div>
    </details>
  );
}
