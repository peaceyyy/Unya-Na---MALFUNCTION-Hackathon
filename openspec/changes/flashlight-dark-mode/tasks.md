# Tasks

## 1. Global Theme State

- [x] 1.1 Create `src/app/context/ThemeContext.jsx` with `ThemeProvider` and `useTheme` hook supporting `'light'` and `'flashlight'` states (defaulting to `'light'`), verifying context export and state toggling.
- [x] 1.2 Wrap `<App />` with `<ThemeProvider>` in `src/main.jsx`, verifying that children can consume the theme context without errors.

## 2. Flashlight Overlay & Cursor Tracking

- [x] 2.1 Create `src/app/components/FlashlightOverlay.jsx` with a full-screen fixed layout, radial-gradient aperture, and `pointer-events: none`, verifying that the spotlight circle renders correctly.
- [x] 2.2 Add pointer and touch tracking listeners to `FlashlightOverlay.jsx` that update `--cursor-x` and `--cursor-y` style properties in real time, verifying smooth cursor tracking.
- [x] 2.3 Mount `FlashlightOverlay` in `src/app/layout/DashboardLayout.jsx` when flashlight mode is active, verifying that underlying UI elements remain clickable through the beam.

## 3. Navbar Integration & Verification

- [x] 3.1 Wire the toggle button in `src/app/layout/Navbar.jsx` to `toggleTheme()`, updating icons and text (`☀️ Light` vs `🔦 Flashlight`), verifying that clicking toggles the dark room overlay on and off.
- [x] 3.2 Execute `bun run build` to verify zero compile or bundle errors across Vite and Tailwind CSS.
