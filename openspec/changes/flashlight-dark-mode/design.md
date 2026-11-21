# Design: Flashlight Dark Mode

## Context

The application currently defaults to a clean light mode layout with a constant top navigation bar and a horizontal scroll track. The top navigation bar includes an inactive theme toggle button. We want to implement an unconventional "flashlight dark mode" where the screen is plunged into darkness with a spotlight hole tracking the mouse cursor.

## Goals / Non-Goals

**Goals:**
- Provide a global `ThemeContext` exposing `theme`, `toggleTheme`, and `isFlashlight`.
- Create a performant `FlashlightOverlay` component that masks the viewport in pitch black while revealing a circular radial cutout centered on cursor coordinates.
- Ensure 60fps cursor tracking using CSS custom properties (`--cursor-x`, `--cursor-y`) updated via pointer events without trigger-heavy React state re-renders.
- Allow seamless click-through with `pointer-events: none` so all widgets, links, and the navbar remain fully interactive under the beam.
- Update the Navbar toggle button icon and text (`☀️ Light` vs `🔦 Flashlight` / `🌙 Dark`) dynamically based on active state.

**Non-Goals:**
- Inverting component CSS classes to dark palette colors (the novelty comes from illuminating the light-mode UI with a flashlight beam).
- Heavy canvas 2D animation libraries; CSS radial gradients and hardware-accelerated pointer updates provide native performance.

## Decisions

- **Decision 1: React Context (`ThemeProvider`) for global state**
  - *Rationale*: A lightweight React Context cleanly shares theme state across any page, widget, or layout component without external state libraries.
  - *Alternatives considered*: Local component state (not accessible across layouts), Zustand/Redux (overkill for boolean theme mode).
- **Decision 2: CSS Radial Gradient with CSS Custom Properties for cursor spotlight**
  - *Rationale*: Setting `element.style.setProperty('--cursor-x', `${e.clientX}px`)` avoids React re-renders on every `pointermove`, giving lag-free 60fps tracking.
  - *Alternatives considered*: React state for cursor `{x, y}` (causes 60+ re-renders per second of React component tree).
- **Decision 3: `pointer-events: none` on the overlay**
  - *Rationale*: Keeps the underlying dashboard fully clickable and operational without complex coordinate collision detection.
  - *Alternatives considered*: Masking clicks through DOM hit testing (fragile, breaks standard form and button focus).

## Risks / Trade-offs

- **[Cursor leaving window or before initial move]** → Default spotlight coordinates to the center of the viewport until the first pointer move event is detected.
- **[Touch screen compatibility]** → Listen to both `pointermove` and `touchmove` events so touch screens support panning the flashlight beam.
