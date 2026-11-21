import React, { useState, useEffect } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './components/WidgetCard';
import { APP_REGISTRY, getAppById } from './appRegistry';
import YesterdayWeather from '../features/extras/YesterdayWeather';
import DemotivationalQuote from '../features/quotes/DemotivationalQuote';
import RatingModalManager from '../features/rating/RatingModal';
import LoginGate from '../features/captcha/LogicGate';
import LoginPage from '../features/auth/LoginPage';
import AvoidantButton from '../features/avoidant-button/AvoidantButton';
import UnnecessaryVoid from '../features/extras/UnnecessaryVoid';
import { usePower } from './context/PowerContext';
import { preloadPoseDetector } from '../features/dance/poseDetector';

function readHashAppId() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  return raw || null;
}

export default function App() {
  // Authentication stages: 'login' | 'captcha' | 'boss' | 'authenticated'
  const [authStage, setAuthStage] = useState(() => {
    try {
      return sessionStorage.getItem('unproductive_auth') === 'true' ? 'authenticated' : 'login';
    } catch {
      return 'login';
    }
  });
  const { setPowerEnabled } = usePower();
  const [activeAppId, setActiveAppId] = useState(readHashAppId);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAppId(readHashAppId());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Power cuts only happen while someone is signed in.
  useEffect(() => {
    setPowerEnabled(authStage === 'authenticated');
  }, [authStage, setPowerEnabled]);

  // Warm up the dance pose model in the background, so the dance screen opens quickly.
  useEffect(() => {
    if (authStage === 'authenticated') preloadPoseDetector();
  }, [authStage]);

  const handleAuthenticated = () => {
    try {
      sessionStorage.setItem('unproductive_auth', 'true');
    } catch {}
    setAuthStage('authenticated');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('unproductive_auth');
      localStorage.removeItem('unproductive_auth');
    } catch {}
    setAuthStage('login');
  };

  if (authStage === 'login') {
    return <LoginPage onLogin={() => setAuthStage('captcha')} />;
  }

  if (authStage === 'captcha') {
    return (
      <LoginGate
        onLogin={() => setAuthStage('boss')}
        onBack={() => setAuthStage('login')}
      />
    );
  }

  if (authStage === 'boss') {
    return (
      <AvoidantButton
        onVictory={handleAuthenticated}
        onBack={() => setAuthStage('captcha')}
      />
    );
  }

  const activeApp = activeAppId ? getAppById(activeAppId) : null;

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
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
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
                <h2 className="text-xl font-semibold text-ink">
                  {activeApp.title} is unavailable
                </h2>
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
        <section
          aria-label="Daily overview"
          className="flex h-full w-[min(100%,23rem)] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-canvas px-4 py-6 sm:px-6 sm:py-8"
        >
          <YesterdayWeather />
          <DemotivationalQuote />
        </section>

        <section
          aria-labelledby="dashboard-apps"
          className="flex h-full shrink-0 flex-col overflow-y-auto px-[clamp(1.5rem,6vw,7rem)] py-4 sm:py-5"
        >
          <div className="my-auto space-y-4 py-1">
            <h2 id="dashboard-apps" className="text-xl font-semibold tracking-tight text-ink">Apps</h2>
            <div className="flex items-stretch border-l border-border">
              {APP_REGISTRY.map((app) => (
                <WidgetCard
                  key={app.id}
                  id={app.id}
                  title={app.title}
                  tagline={app.tagline}
                  isReady={Boolean(app.component)}
                  isExpanded={expandedAppId === app.id}
                  onToggle={() => setExpandedAppId((current) => current === app.id ? null : app.id)}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-label="Feedback"
          className="flex h-full w-56 shrink-0 items-center px-6 sm:px-8"
        >
          <button
            type="button"
            onClick={() => setIsRatingOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors"
          >
            Rate your experience
          </button>
        </section>

        {/* The Unnecessary Void: 12,000px+ easter egg corridor */}
        <UnnecessaryVoid onOpenRating={() => setIsRatingOpen(true)} />
      </DashboardLayout>

      {/* Five-Star Rating Modal Manager (rendered outside horizontal scroll container) */}
      <RatingModalManager
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />
    </>
  );
}
