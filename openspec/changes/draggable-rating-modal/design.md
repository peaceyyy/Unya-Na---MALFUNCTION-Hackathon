# Design

## Context

The initial recursive modal implementation created multiple dialog instances upon sub-5-star ratings, but lacked drag repositioning and delayed or failed to cleanly dismiss when 5 stars were selected. Users need the ability to drag windows out of the way and have 5-star submissions resolve and close promptly.

## Goals / Non-Goals

**Goals:**
- Implement pointer-based dragging on the modal header (`onPointerDown`, `setPointerCapture`, `onPointerMove`, `onPointerUp`).
- Bring clicked or dragged modals to the front by updating a dynamic `zIndex` or reordering instances.
- Ensure 5-star selection invokes `onClose` reliably without hanging or requiring external refresh.
- Provide a clean close button or explicit confirmation dismissal when 5 stars are given.

**Non-Goals:**
- Persisting dragged coordinates in localStorage across browser restarts.
- Resizing modal dimensions.

## Decisions

### 1. Pointer Events with Capture for Dragging
- **Decision**: Use `e.currentTarget.setPointerCapture(e.pointerId)` on the modal header. Track start pointer `(e.clientX, e.clientY)` and delta to update `offsetX` and `offsetY`.
- **Rationale**: Pointer capture avoids losing mouse events if the cursor moves quickly outside the header area.

### 2. Immediate 5-Star Dismissal Handling
- **Decision**: When `rating === 5` on the sole modal instance, invoke `onClose()` immediately (or after a brief 300ms celebration animation), and also offer a direct `[ Done / Close ]` button. For multi-modal cascades, allow each 5-starred modal to either close immediately or close all when the last 5-star is awarded.
- **Rationale**: Eliminates user frustration when clicking 5 stars and waiting for an invisible or failed timer.

### 3. Z-Index Active Elevation
- **Decision**: Maintain a `topModalId` state. Clicking any part of a modal raises its `zIndex` above the others.
- **Rationale**: Gives natural desktop OS window management behavior.

## Risks / Trade-offs

- **[Risk] Dragging off-screen boundaries** → **Mitigation**: Clamp modal coordinates to viewport bounds so windows cannot be lost outside the visible screen.
