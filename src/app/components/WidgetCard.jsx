import React from 'react';
import styles from './WidgetCard.module.css';

export default function WidgetCard({ title, category, className = '', children }) {
  return (
    <article
      className={`group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 transition-all duration-200 hover:border-[#1752F0]/35 hover:shadow-md hover:shadow-slate-200/50 ${styles.card} ${className}`}
    >
      {/* Professional Header */}
      {(title || category) && (
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 select-none">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1752F0] opacity-80" />
            {title && (
              <h3 className="text-xs font-bold tracking-tight text-slate-900">
                {title}
              </h3>
            )}
          </div>

          {category && (
            <span className="rounded-md border border-[#1752F0]/20 bg-[#1752F0]/5 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-[#1752F0]">
              {category}
            </span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">{children}</div>
    </article>
  );
}
