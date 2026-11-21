# Proposal

## Why

In the five-star rating modal experience, rating 5 stars does not cleanly dismiss the modal, leaving the user blocked. In addition, when multiple recursive modal instances accumulate across the screen, users cannot reposition them, obscuring underlying dialogs and UI elements. Adding free dragging and an immediate, reliable 5-star dismissal ensures the playful experience is delightful and functional.

## What Changes

- Fix the 5-star completion behavior: when an individual modal instance receives 5 stars, it resolves and can be immediately dismissed. Once all active modal instances receive 5 stars, the entire modal system reliably closes without delay.
- Enable free window dragging: allow users to grab any modal instance by its header or card surface and drag it freely across the viewport with pointer/mouse events.
- Stacking order & focus: clicking or dragging a modal instance brings it to the top of the z-index stack.

## Capabilities

### New Capabilities
- `site-rating`: Handles interactive rating selection, recursive modal spawning on sub-5-star ratings, free pointer-based modal dragging, and reliable 5-star dismissal.

### Modified Capabilities
<!-- None -->

## Impact

- Modifies `src/features/rating/RatingModal.jsx` and `src/features/rating/RatingModal.module.css`.
- Ensures mounting location in `src/app/App.jsx` handles backdrop portals or unconstrained fixed positioning correctly.
