# Tasks

## 1. Dragging Engine

- [x] 1.1 Implement pointer-based dragging (`onPointerDown`, `setPointerCapture`, `onPointerMove`, `onPointerUp`) on the modal header to freely reposition modal cards across the viewport.
- [x] 1.2 Implement dynamic z-index stacking elevation so clicked or dragged modals immediately come to the top.

## 2. Reliable Five-Star Dismissal

- [x] 2.1 Refactor 5-star resolution logic to immediately trigger modal dismissal upon selecting 5 stars on single or completed instances, with an explicit dismiss button.
- [x] 2.2 Relocate the `RatingModalManager` mount in `src/app/App.jsx` to render outside the horizontal scroll track so `position: fixed` overlays are never constrained by scroll container styling.

## 3. Verification

- [x] 3.1 Verify free window dragging and immediate 5-star dismissal across Light Mode and Flashlight Dark Mode.
- [x] 3.2 Verify clean production build via `bun run build`.
