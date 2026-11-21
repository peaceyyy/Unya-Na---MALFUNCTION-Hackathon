# Tasks

## 1. Custom Element Enhancement

- [x] 1.1 Update `public/sakuga-vfx/slider.js` to observe `bubble` attribute and define scoped styles for `:host([bubble="bottom"]) .val` and upward arrow `.val::after`.
- [x] 1.2 Verify downward bubble styling and spring kinematics in `slider.js` to ensure the bubble tilts smoothly as the thumb moves.

## 2. Component Wrapper & Navbar Refinement

- [x] 2.1 Update `src/app/components/SakugaSlider.jsx` to pass `bubble="bottom"` and set clean vertical dimensions.
- [x] 2.2 Refine vertical centering in `src/app/layout/Navbar.jsx` so the slider and downward bubble are completely visible and unclipped.

## 3. Verification

- [x] 3.1 Verify interactive slider dragging, passive decay, and live percentage updates with the downward bubble.
- [x] 3.2 Verify production build passes cleanly via `bun run build`.
