# Proposal

## Why

To lean into the playful, tongue-in-cheek personality of "Unya Na", the application needs a satirical user feedback mechanism at the terminal end of the horizontal canvas. Instead of a typical passive review form, a recursive rating modal demands unconditional five-star approval: any rating below five stars spawns additional modal instances until all instances receive five stars.

## What Changes

- Add a new rating feature module located in `src/features/rating/`.
- Integrate visual star rating component via `finktheartist/sakuga-vfx/rating` (shadcn-compatible animated vfx rating component) or adapted equivalent fallback if package installation has environment constraints.
- Implement recursive / cascading modal logic: selecting anything less than 5 stars does not close the prompt—instead, it spawns an additional persistent rating modal instance with slightly offset positioning or stacked layering.
- Provide a trigger button or terminal milestone trigger at the end of the horizontal canvas (Station 5) to launch the rating experience.
- When 5 stars are selected across instances, resolve and dismiss the modals with a celebratory resolution state.

## Capabilities

### New Capabilities
- `site-rating`: Handles presentation, rating selection, recursive modal spawning on sub-5-star ratings, and resolution on 5-star submissions.

### Modified Capabilities
<!-- None -->

## Impact

- **New files**: `src/features/rating/RatingModal.jsx`, `src/features/rating/RatingModal.module.css` (or styling), and any component added via shadcn in `src/components/ui/`.
- **Modified files**: `src/app/App.jsx` to mount the rating trigger/modal at the canvas end.
- **Dependencies**: Potential shadcn / sakuga-vfx dependencies or peer dependencies (`lucide-react`, `framer-motion`, etc. if required by the sakuga-vfx rating component).
