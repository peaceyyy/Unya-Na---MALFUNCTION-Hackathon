# Spec Delta

## Purpose

Enables downward orientation for the Sakuga slider's numeric value speech bubble so the indicator renders underneath the slider track without clipping against top viewport boundaries.

## ADDED Requirements

### Requirement: Downward Value Bubble Placement
The slider component SHALL support rendering its numeric value speech bubble beneath the slider track.

#### Scenario: Value bubble renders below the thumb
- **WHEN** the slider is configured or rendered in downward bubble orientation
- **THEN** the `.val` element is positioned underneath the slider track with its pointer tail oriented upward toward the thumb

#### Scenario: Dynamic tilt and positioning follow thumb
- **WHEN** the slider thumb is dragged or transitions along the track
- **THEN** the bottom value bubble translates horizontally with the thumb and rotates according to spring inertia

### Requirement: Clean Vertical Alignment in Navigation
The application header SHALL accommodate the downward value bubble without requiring negative or artificial top offsets.

#### Scenario: Top-center slider visibility
- **WHEN** the slider is rendered at the top center of the application header
- **THEN** both the slider track and the downward-pointing value bubble remain completely within view without colliding with the top of the browser window
