# Design

## Context

The "Unya Na" operating canvas culminates at Station 5 (the Canvas Horizon terminal). As an interactive satirical closing milestone, the user will be presented with a rating prompt. To amplify the witty anti-work theme, the modal refuses poor reviews: anything under 5 stars creates another modal instance until every instance receives 5 stars.

## Goals / Non-Goals

**Goals:**
- Provide a clean modal component in `src/features/rating/RatingModal.jsx` and styling.
- Integrate the animated star rating element using `finktheartist/sakuga-vfx/rating` (via shadcn CLI or bundled implementation if network/registry requires).
- Maintain multi-instance modal state (array of active modal dialogs, each with its own coordinates/stack index and rating state).
- Seamless integration with the existing Flashlight Dark Mode and `#1752F0` color scheme.

**Non-Goals:**
- Storing ratings in a remote database or external analytics backend.
- Preventing the user from ever leaving the site (closing the browser tab remains normal).

## Decisions

### 1. Multi-instance modal manager via React state
- **Decision**: Manage active modal instances as an array of objects `[{ id: 1, offsetX: 0, offsetY: 0, rated: false }, ...]` inside a central state manager or `RatingModalManager`.
- **Rationale**: When a user picks 1-4 stars, appending a new modal object with randomized or staggered `(offsetX, offsetY)` creates an unmistakable visual cascade of modals demanding 5 stars.
- **Alternatives considered**: Simply shaking the modal without spawning new ones (less humorous, fails the user's explicit multi-instance requirement).

### 2. Sakuga-VFX Rating Star Component
- **Decision**: Execute `npx shadcn add finktheartist/sakuga-vfx/rating` to inspect and integrate the component into `src/components/ui/` or `src/features/rating/`. If the remote registry fails or dependencies are missing, implement the equivalent animated SVG particle star component.
- **Rationale**: Ensures the stars look dynamic and visually striking as requested by the user.

### 3. Canvas Horizon Integration
- **Decision**: Mount the rating trigger at Station 5 ("End of the line") with an inviting button: *"Rate your experience (Mandatory 5 stars)"*.
- **Rationale**: Keeps the flow natural at the very end of the horizontal canvas.

## Risks / Trade-offs

- **[Risk] Multiple modal stacking causing z-index or pointer-event lockups** → **Mitigation**: Stagger `z-index` per modal instance (`z-[60 + index]`) and allow clicking on any visible modal instance to rate it.
- **[Risk] shadcn remote registry registry resolution on Windows CLI** → **Mitigation**: Verify package installation during implementation; if CLI encounters network or schema conflicts, adapt the component cleanly within `src/features/rating/`.
