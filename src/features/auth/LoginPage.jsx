import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states (mock auth, accepts any inputs)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) {
      onLogin();
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen overflow-hidden bg-[#f6f8fb] text-slate-900 select-none">
      {/* Decorative Layered Concentric Blue Arcs with Living Motion */}
      <div className="absolute inset-y-0 right-0 w-[45%] lg:w-[48%] h-full pointer-events-none overflow-hidden hidden lg:block z-0">
        <style>{`
          @keyframes arc-breathe-1 {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.025); }
          }
          @keyframes arc-breathe-2 {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.035); }
          }
          @keyframes arc-breathe-3 {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes orb-float-1 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
            50% { transform: translateY(-45px) translateX(-18px); opacity: 0.95; }
          }
          @keyframes orb-float-2 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.45; }
            50% { transform: translateY(55px) translateX(-22px); opacity: 0.9; }
          }
          @keyframes orb-float-3 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
            50% { transform: translateY(-30px) translateX(12px); opacity: 1; }
          }
          @keyframes pulse-shimmer {
            0%, 100% { opacity: 0.65; }
            50% { opacity: 0.95; }
          }
          @media (prefers-reduced-motion: reduce) {
            .animated-arc, .animated-orb { animation: none !important; }
          }
        `}</style>

        <svg
          className="h-full w-full object-cover"
          viewBox="0 0 600 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMaxYMid slice"
        >
          <defs>
            <linearGradient id="innerArcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#1752F0" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outermost Light Sky Blue Arc (Breathing) */}
          <path
            className="animated-arc"
            d="M260 -50 C 40 220, 40 580, 260 850 L 600 850 L 600 -50 Z"
            fill="#bfdbfe"
            fillOpacity="0.45"
            style={{
              animation: 'arc-breathe-1 14s ease-in-out infinite',
              transformOrigin: '550px 400px',
            }}
          />

          {/* Outer Soft Blue Arc (Breathing) */}
          <path
            className="animated-arc"
            d="M330 -50 C 130 220, 130 580, 330 850 L 600 850 L 600 -50 Z"
            fill="#60a5fa"
            fillOpacity="0.75"
            style={{
              animation: 'arc-breathe-2 11s ease-in-out infinite',
              transformOrigin: '550px 400px',
            }}
          />

          {/* Middle Vivid Blue Arc (Breathing) */}
          <path
            className="animated-arc"
            d="M400 -50 C 220 220, 220 580, 400 850 L 600 850 L 600 -50 Z"
            fill="#3b82f6"
            fillOpacity="0.9"
            style={{
              animation: 'arc-breathe-3 8s ease-in-out infinite',
              transformOrigin: '550px 400px',
            }}
          />

          {/* Innermost Royal Electric Blue Arc */}
          <path
            d="M470 -50 C 310 220, 310 580, 470 850 L 600 850 L 600 -50 Z"
            fill="url(#innerArcGlow)"
          />

          {/* Glowing Contour Stroke along the curve */}
          <path
            d="M470 -50 C 310 220, 310 580, 470 850"
            stroke="#93c5fd"
            strokeWidth="3.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
            className="animated-arc"
            style={{
              animation: 'pulse-shimmer 4s ease-in-out infinite',
            }}
          />

          {/* Floating Animated Luminous Motes along the curve */}
          <circle
            cx="320"
            cy="360"
            r="7"
            fill="#e0f2fe"
            filter="url(#softGlow)"
            className="animated-orb"
            style={{
              animation: 'orb-float-1 6s ease-in-out infinite',
            }}
          />
          <circle
            cx="345"
            cy="460"
            r="9"
            fill="#bae6fd"
            filter="url(#softGlow)"
            className="animated-orb"
            style={{
              animation: 'orb-float-2 7.5s ease-in-out infinite',
            }}
          />
          <circle
            cx="390"
            cy="240"
            r="6"
            fill="#ffffff"
            filter="url(#softGlow)"
            className="animated-orb"
            style={{
              animation: 'orb-float-3 5.5s ease-in-out infinite',
            }}
          />
          <circle
            cx="400"
            cy="580"
            r="5"
            fill="#e0f2fe"
            filter="url(#softGlow)"
            className="animated-orb"
            style={{
              animation: 'orb-float-1 8s ease-in-out infinite reverse',
            }}
          />
        </svg>
      </div>

      {/* Main Content: Left-Aligned Form Positioned with Balanced Vertical Spacing */}
      <div className="relative z-10 flex flex-1 flex-col justify-start px-8 pt-16 sm:px-14 sm:pt-20 lg:px-20 lg:pt-24 xl:pt-28 max-w-2xl">
        {/* Main Title & Badges */}
        <div className="space-y-2.5">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-wider uppercase text-[#1752F0]">
              UNYA NA
            </h1>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Rest is essential, so rest comes first
          </h2>

          <p className="text-sm font-medium text-slate-500">
            For procrastinators, by procrastinators
          </p>
        </div>

        {/* Segmented Log In / Sign Up Tab Pill Switcher */}
        <div className="mt-7 flex w-fit items-center rounded-full bg-slate-200/80 p-1 border border-slate-300/80">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`rounded-full px-6 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#1752F0] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`rounded-full px-6 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-[#1752F0] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

          {/* Forms */}
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4 max-w-md">
              {/* Email Input */}
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your student email"
                  aria-label="Student email"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                />
                <span className="pointer-events-none absolute right-4 text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-label="Password"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="mt-1.5 flex justify-end">
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Rest easy: any password works for Unya Na!');
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-[#1752F0] transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#1752F0] px-9 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0] focus-visible:ring-offset-2"
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4 max-w-md">
              {/* Full Name Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                />
                <span className="pointer-events-none absolute right-4 text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>

              {/* Student Email Input */}
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your student email"
                  aria-label="Student email"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                />
                <span className="pointer-events-none absolute right-4 text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
              </div>

              {/* Password Input */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  aria-label="Confirm Password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Create Account Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#1752F0] px-9 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1752F0] focus-visible:ring-offset-2"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
  );
}
