# Design

## Context

The project is structured with Vite, React 19, and Tailwind CSS v4. The components currently exist as empty stub files under `src/app/` and `src/app/layout/`. The application requires a horizontal canvas experience where sideways scrolling is the primary interaction model, with no content yet populated. See proposal.md for background motivation.

## Goals / Non-Goals

**Goals:**
- Provide a responsive full-height (`100vh` / `100dvh`), horizontally scrollable container across desktop and mobile screens.
- Implement native horizontal scroll ergonomics (`overflow-x: auto`, `overscroll-behavior-x: contain`) with styled scrollbars.
- Attach an efficient wheel event listener to the layout container that translates vertical scroll wheel deltas (`deltaY`) into horizontal scroll offsets (`scrollLeft`).
- Maintain clean, blank panel placeholders to establish the horizontal canvas without filler content.

**Non-Goals:**
- Implementing actual widget cards, widgets data, or productivity tools (deferred to subsequent changes).
- Introducing third-party scroll animation libraries (e.g., Locomotive Scroll, GSAP); lightweight React hooks and native CSS overflow are preferred.

## Decisions

- **Decision: Native Flex/Grid track with CSS `overflow-x: auto`**
  - *Rationale*: Modern browsers provide hardware-accelerated horizontal scrolling with touch gestures and trackpads natively.
  - *Alternatives considered*: Absolute positioned canvas with manual CSS transform translations (complex, poor accessibility).
- **Decision: Wheel delta translation via `useEffect` event listener**
  - *Rationale*: Standard vertical mouse scroll wheels do not natively scroll horizontal containers without holding Shift. Attaching a non-passive wheel event listener that maps `e.deltaY` to `container.scrollLeft` ensures immediate intuitive navigation for desktop mouse users.
  - *Alternatives considered*: Relying on Shift+Wheel (poor discoverability and clunky UX).
- **Decision: Scoped styles in `DashboardLayout.module.css`**
  - *Rationale*: Keeps custom scrollbar and track behaviors modularized within `DashboardLayout.module.css` while leveraging Tailwind for atomic layout properties.
  - *Alternatives considered*: Pure global CSS (less modular).

## Risks / Trade-offs

- **[Trackpad dual-axis interference]** → Guard wheel translation by checking if `Math.abs(e.deltaX) > Math.abs(e.deltaY)` to preserve native horizontal swipe gestures without double-scrolling.
- **[Cross-browser scrollbar aesthetics]** → Use standard `scrollbar-width: thin` and `scrollbar-color` properties alongside `::-webkit-scrollbar` pseudo-elements.
