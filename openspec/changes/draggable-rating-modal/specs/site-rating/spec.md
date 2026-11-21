# Spec Delta

## Purpose

Enables free pointer dragging for rating modal instances and ensures immediate, reliable dismissal when five-star ratings are submitted.

## ADDED Requirements

### Requirement: Free Window Dragging
The system SHALL allow users to freely drag and reposition any active rating modal instance across the viewport using pointer or mouse events on the modal header.

#### Scenario: User drags modal by header
- **WHEN** user presses down and drags the modal header bar
- **THEN** the system updates the modal's screen coordinates in real time following the pointer movement.

#### Scenario: Top-level stacking on interaction
- **WHEN** user clicks or drags a modal instance
- **THEN** the system brings that modal instance to the top of the stacking order.

### Requirement: Reliable Five-Star Dismissal
The system SHALL dismiss the rating modal immediately when 5 stars are selected on a single modal, or when all accumulated modal instances are satisfied.

#### Scenario: Single modal rated 5 stars closes immediately
- **WHEN** user selects 5 stars on the primary rating modal
- **THEN** the system immediately marks the rating complete and closes the modal overlay.

#### Scenario: All active modals rated 5 stars
- **WHEN** all spawned modal instances have each received a 5-star rating
- **THEN** the system dismisses all modal overlays from the screen.
