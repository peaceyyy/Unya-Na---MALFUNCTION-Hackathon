import React, { useState, useEffect } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './components/WidgetCard';
import { APP_REGISTRY, getAppById } from './appRegistry';
import YesterdayWeather from '../features/extras/YesterdayWeather';
import DemotivationalQuote from '../features/quotes/DemotivationalQuote';
import RatingModalManager from '../features/rating/RatingModal';
import LoginPage from '../features/auth/LoginPage';

function readHashAppId() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  return raw || null;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('unproductive_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [activeAppId, setActiveAppId] = useState(readHashAppId);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('unproductive_auth', 'true');
    } catch {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('unproductive_auth');
    } catch {}
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAppId(readHashAppId());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeApp = activeAppId ? getAppById(activeAppId) : null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (activeApp) {
    const FeatureComponent = activeApp.component;

    return (
      <DashboardLayout scrollable={false} onLogout={handleLogout}>
        <div className="flex flex-1 flex-col px-6 py-6 md:px-10">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span aria-hidden="true">←</span>
                <span>Home</span>
              </a>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">
                  {activeApp.title}
                </h1>
                <p className="text-sm text-ink-secondary">{activeApp.tagline}</p>
              </div>
            </div>
          </div>

          {FeatureComponent ? (
            <div className="flex-1">
              <FeatureComponent />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
                <span className="inline-block rounded-md bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                  Coming soon
                </span>
                <h2 className="font-display text-xl font-bold text-ink">
                  {activeApp.title} is still being built
                </h2>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  This app slot is ready for integration. Once merged, wire{' '}
                  <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-ink">
                    {activeApp.featurePath}
                  </code>{' '}
                  in <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-ink">appRegistry.js</code>.
                </p>
                <div className="pt-2">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    Back to Unya na
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout scrollable={true} onLogout={handleLogout}>
        <h1 className="sr-only">Unya na Dashboard</h1>
        {/* Far-left Column: Daily Demotivational Quote + Yesterday's Weather */}
        <section
          aria-label="Daily overview"
          className="grid h-full min-w-[380px] max-w-[420px] shrink-0 grid-rows-[minmax(0,1fr)_auto_auto] gap-5 border-r border-border bg-canvas px-7 py-7"
        >
          <DemotivationalQuote />
          <YesterdayWeather />

          <p className="text-xs text-ink-muted">
            Scroll sideways to browse apps →
          </p>
        </section>

        {/* Main Horizontal Track: Single-row Apps */}
        <section
          aria-label="Apps"
          className="flex h-full shrink-0 flex-col justify-center gap-4 px-10 py-8"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Apps</h2>
              <p className="text-sm text-ink-secondary">
                Pick a tool. Ugma na ang uban.
              </p>
            </div>
            <span className="text-xs font-medium text-ink-muted">
              {APP_REGISTRY.length} apps
            </span>
          </div>

          <div className="flex flex-row items-stretch gap-5 pr-10">
            {APP_REGISTRY.map((app) => (
              <WidgetCard
                key={app.id}
                id={app.id}
                title={app.title}
                tagline={app.tagline}
                category={app.category}
                tone={app.tone}
                isReady={Boolean(app.component)}
              />
            ))}
          </div>
        </section>

        {/* End of the Line / Horizon */}
        <section
          aria-label="End of the line"
          className="flex h-full min-w-[320px] items-center justify-center p-8 shrink-0 text-center"
        >
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3.5 max-w-xs shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent font-bold">
              ✓
            </div>
            <h3 className="text-sm font-bold text-ink">
              End of the line
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              You reached the end without doing any work. Well done.
            </p>

            <button
              type="button"
              onClick={() => setIsRatingOpen(true)}
              className="w-full rounded-xl bg-accent py-2.5 px-3 text-xs font-semibold text-white shadow-xs hover:bg-accent-hover active:scale-98 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Rate your experience
            </button>

            <div className="text-xs font-semibold text-accent pt-1">
              ← Scroll back whenever you like
            </div>
          </div>
        </section>
      </DashboardLayout>

      {/* Five-Star Rating Modal Manager (rendered outside horizontal scroll container) */}
      <RatingModalManager
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />
    </>
  );
}
