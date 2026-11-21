# Proposal: Flashlight Dark Mode

## Why

In keeping with the playful, disruptive spirit of Unproductive OS, dark mode should not be a conventional inverted color scheme. Instead, entering dark mode plunges the screen into a pitch-black room where the only visible area is a narrow, moving flashlight beam following the cursor.

## What Changes

- Introduce global theme state management (e.g. `ThemeContext` / provider) tracking whether standard light mode or flashlight dark mode is active.
- Connect the top navigation bar's theme toggle button to activate/deactivate flashlight mode.
- Render a full-screen flashlight overlay when dark mode is enabled, painting the viewport black while masking or cutting out a circular radial gradient around the mouse cursor coordinates.
- Ensure the flashlight overlay does not block user interactions with underlying controls (`pointer-events: none`) while preserving clear visibility for the toggle control.
- Persist theme state or keep it accessible globally across layouts and feature widgets.

## Capabilities

### New Capabilities
- `flashlight-theme`: Global theme state provider, flashlight cursor tracking, radial gradient masking overlay, and theme toggle controls.

### Modified Capabilities

<!-- None -->

## Impact

- `src/app/layout/Navbar.jsx`: Theme toggle button wired to the global theme context.
- `src/app/layout/DashboardLayout.jsx`: Injects the flashlight overlay component when dark mode is active.
- New context/hook in `src/app/` (or `src/context/` / `src/hooks/`) providing `useTheme` and `ThemeProvider`.
- New overlay component (e.g. `FlashlightOverlay.jsx`) rendering the radial flashlight effect with cursor tracking.
