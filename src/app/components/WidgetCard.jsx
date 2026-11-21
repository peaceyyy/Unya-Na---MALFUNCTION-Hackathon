import React from 'react';
import styles from './WidgetCard.module.css';

const TONE_BADGE = {
  blue: 'bg-accent/10 text-accent',
  indigo: 'bg-accent-indigo/10 text-accent-indigo',
  violet: 'bg-accent-violet/10 text-accent-violet',
};

const TONE_ICON = {
  blue: 'bg-accent text-white',
  indigo: 'bg-accent-indigo text-white',
  violet: 'bg-accent-violet text-white',
};

export default function WidgetCard({
  id,
  title,
  tagline,
  category,
  tone = 'blue',
  isReady = false,
}) {
  const badgeClass = TONE_BADGE[tone] || TONE_BADGE.blue;
  const iconClass = TONE_ICON[tone] || TONE_ICON.blue;
  const monogram = title
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <a
      href={`#${id}`}
      className={`group flex h-[280px] w-[264px] shrink-0 flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${styles.card}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg font-display text-sm font-bold ${iconClass}`}
            aria-hidden="true"
          >
            {monogram}
          </div>
          {category && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {category}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-bold leading-snug text-ink">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {tagline}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-medium">
        <span className="text-ink-muted">
          {isReady ? 'Open app' : 'Coming soon'}
        </span>
        <span
          className="text-accent transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </a>
  );
}
