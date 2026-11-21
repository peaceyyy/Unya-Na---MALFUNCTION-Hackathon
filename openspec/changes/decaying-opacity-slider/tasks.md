# Tasks

## 1. Setup & Asset Registration

- [x] 1.1 Register `/sakuga-vfx/slider.js` script in `index.html` and verify the `<sakuga-slider>` custom element registers successfully in the browser.
- [x] 1.2 Scaffold `src/app/context/OpacityContext.jsx` with opacity state (default 100), decay interval timer, and activity listeners.

## 2. Slider Component & Navbar Mount

- [x] 2.1 Implement the `<sakuga-slider>` wrapper handling `:host` margin overrides, scale styling, and bidirectional event listeners (`input` and `change`).
- [x] 2.2 Mount the `<sakuga-slider>` in `src/app/layout/Navbar.jsx` at top center, verifying alignment alongside the brand logo and flashlight toggle.

## 3. Viewport Opacity Integration & Verification

- [x] 3.1 Apply dynamic opacity styling to `<main>` in `src/app/layout/DashboardLayout.jsx` while keeping `<Navbar>` fully legible and interactable at 0% opacity.
- [x] 3.2 Verify bidirectional interaction: passive decay smoothly animates the slider down to 0%, manual slider drags immediately adjust workspace opacity, and user activity pauses or restores opacity.
- [x] 3.3 Verify production build passes cleanly via `bun run build`.
