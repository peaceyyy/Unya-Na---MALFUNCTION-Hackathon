# Spec Delta

## Purpose

Enables an unconventional flashlight dark mode where the screen is obscured in darkness except for a dynamic spotlight beam that tracks the user's cursor.

## ADDED Requirements

### Requirement: Global Theme State
The application SHALL maintain a persistent global theme state supporting light mode and flashlight dark mode, defaulting to light mode.

#### Scenario: Default theme on initial load
- **WHEN** the application loads for the first time
- **THEN** the active theme is set to light mode

#### Scenario: Toggle theme state
- **WHEN** the user triggers the theme toggle control
- **THEN** the theme state alternates between light mode and flashlight dark mode

### Requirement: Flashlight Obscuration Overlay
The application SHALL render a full-viewport obscuration overlay when flashlight dark mode is active, masking the screen with darkness except for a radial aperture centered on the pointer.

#### Scenario: Flashlight active
- **WHEN** flashlight dark mode is active
- **THEN** the full-screen darkness overlay is displayed with a transparent radial circular spotlight

#### Scenario: Light mode active
- **WHEN** light mode is active
- **THEN** no darkness overlay is rendered over the viewport

### Requirement: Cursor Tracking Spotlight
The spotlight aperture SHALL track the user cursor coordinates across the entire viewport in real time.

#### Scenario: Pointer movement updates spotlight
- **WHEN** the pointer moves to new viewport coordinates (x, y)
- **THEN** the transparent center of the radial gradient updates to match (x, y)

### Requirement: Interaction Pass-Through
The flashlight overlay SHALL not impede mouse, touch, or click interactions with underlying dashboard elements.

#### Scenario: Clicking elements under the spotlight
- **WHEN** the user clicks an interactive element while flashlight dark mode is active
- **THEN** the click event passes through the overlay and triggers the underlying element
