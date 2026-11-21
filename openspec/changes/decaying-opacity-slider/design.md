# Design

## Context

The Unya Na dashboard currently features a horizontal multi-app layout (`DashboardLayout`), an inactivity tracker, and a theme switcher in `Navbar.jsx`. See `proposal.md` for motivation. To introduce the decaying opacity mechanism, the layout needs a mechanism to track live opacity from 100% down to 0% and synchronize it with the newly installed Sakuga VFX range slider (`finktheartist/sakuga-vfx/slider`).

## Goals / Non-Goals

**Goals:**
- Provide a clean, centralized `OpacityContext` or custom hook (`useOpacityDecay`) managing opacity percentage (0–100), decay rate, and user override state.
- Mount `<sakuga-slider>` at the top center of the application header (`Navbar.jsx`), displaying the live percentage.
- Smoothly reflect opacity reductions onto the dashboard workspace (`DashboardLayout.jsx`) while keeping top-center slider controls and core navigation accessible.
- Support bidirectional control: passive decay updates the slider thumb, and dragging the slider updates viewport opacity in real time.

**Non-Goals:**
- Irreversibly locking users out when reaching 0% opacity.
- Storing degraded opacity in `localStorage` across page reloads (page refreshes will start at 100%).

## Decisions

### 1. Opacity State & Decay Lifecycle
- **Decision**: Manage opacity within an `OpacityProvider` in `src/app/context/OpacityContext.jsx`. The state maintains `opacity` (number 0–100, default 100), `isPaused`, and decay rate. A decay timer decrements opacity over time (e.g. 1% every 1–2 seconds of inactivity, or configurable slope) down to 0%.
- **Rationale**: Keeps opacity decoupled from individual components and allows both the `DashboardLayout` container and `Navbar` slider to subscribe without prop drilling.
- **Alternatives considered**: Storing opacity in local state in `Navbar.jsx` and passing it up via callbacks (less scalable and prone to synchronization issues).

### 2. Sakuga Slider Top-Center Integration
- **Decision**: Position `<sakuga-slider>` in `src/app/layout/Navbar.jsx` using an absolute center container (`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2`).
- **Rationale**: Guarantees the slider is always centered horizontally across viewports without crowding the left brand icon or right theme controls.
- **Alternatives considered**: Placing the slider in a floating toast or modal (less intuitive as a persistent system status bar indicator).

### 3. Sakuga Slider Styling & Scale
- **Decision**: Override the default custom element margin (`margin: 0`) and scale it (`transform: scale(0.72)`) with `--sk-slider-width: 170px` to fit cleanly within the 56px (`h-14`) Navbar while leaving room for the `.val` bubble and anime cumulus cloud effects.
- **Rationale**: The stock `:host` margin is `30px 0 0` and width is `230px`, which would overflow the Navbar without proper sizing constraints.

### 4. Viewport Opacity Scope
- **Decision**: Apply `style={{ opacity: opacity / 100 }}` to `<main>` inside `DashboardLayout.jsx`, while keeping `<header>` (`Navbar`) at full opacity.
- **Rationale**: If the header also faded to 0%, the user would lose the ability to see or drag the slider, effectively bricking the session. Keeping the top bar visible satisfies the "indicator" requirement and ensures usability.

## Risks / Trade-offs

- **[Risk] State update loops between custom element and React state** → **Mitigation**: Maintain a `isDraggingRef` in the slider wrapper; only sync `el.value` from state when the user is not actively dragging the slider thumb.
- **[Risk] Low opacity rendering text illegible** → **Mitigation**: The top-center slider remains at full opacity with high contrast tooltip bubbles (`.val`), clearly showing the revival mechanism.
