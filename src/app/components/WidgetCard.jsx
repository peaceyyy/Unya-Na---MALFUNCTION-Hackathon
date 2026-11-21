import React, { useEffect, useRef } from 'react';
import styles from './WidgetCard.module.css';

export default function WidgetCard({ id, title, tagline, isReady, isExpanded, onToggle }) {
  const descriptionId = `launcher-description-${id}`;
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!isExpanded || !panel) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollToPanel = () => {
      panel.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reduceMotion ? 'instant' : 'smooth',
      });
    };

    if (reduceMotion || panel.offsetWidth === panel.firstElementChild.offsetWidth) {
      scrollToPanel();
      return;
    }

    const handleRevealEnd = (event) => {
      if (event.target === panel) scrollToPanel();
    };

    panel.addEventListener('transitionend', handleRevealEnd);
    return () => panel.removeEventListener('transitionend', handleRevealEnd);
  }, [isExpanded]);

  return (
    <article className={`flex shrink-0 border-r border-border ${styles.card}`}>
      <h3 className="flex shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          className={`flex flex-col items-center justify-end px-6 py-8 text-ink hover:bg-surface-subtle/60 aria-expanded:bg-surface-subtle/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors sm:px-10 sm:py-12 ${styles.trigger}`}
        >
          <span className={styles.title}>{title}</span>
        </button>
      </h3>

      <div ref={panelRef} id={descriptionId} inert={!isExpanded} data-expanded={isExpanded} className={styles.panel}>
        <div className={`flex flex-col items-start justify-end gap-4 border-l border-border px-5 py-8 sm:px-10 sm:py-12 ${styles.description}`}>
          <p className="max-w-[32ch] text-base leading-relaxed text-ink-secondary sm:text-lg">{tagline}</p>
          {!isReady && <p className="text-xs text-ink-muted">Coming soon</p>}
          <a
            href={`#${id}`}
            aria-label={`Open ${title}`}
            className="inline-grid size-11 place-items-center rounded-md text-ink hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
