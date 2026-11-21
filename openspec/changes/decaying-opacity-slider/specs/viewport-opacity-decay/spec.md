# Spec Delta

## Purpose

Progressively decays the dashboard viewport opacity from 100% to 0% over idle duration while providing an interactive top-center Sakuga slider indicator to monitor and manually adjust or restore opacity.

## ADDED Requirements

### Requirement: Gradual Viewport Opacity Decay
The application SHALL progressively reduce viewport opacity from 100% toward 0% during periods of user inactivity or over time.

#### Scenario: Continuous opacity decay over inactive duration
- **WHEN** the user remains idle with no interaction for more than 5 seconds
- **THEN** the system steadily decrements the viewport opacity percentage toward 0% over a defined decay interval

#### Scenario: Activity pauses or slows decay
- **WHEN** user interaction (keyboard, mouse move, or touch) occurs
- **THEN** the application temporarily halts decay and restores or holds the current opacity level

### Requirement: Top-Center Sakuga Slider Indicator
The application SHALL render an interactive Sakuga VFX slider centered at the top of the interface displaying the live opacity value from 0 to 100 percent.

#### Scenario: Real-time slider thumb reflection
- **WHEN** the viewport opacity decrements over time
- **THEN** the top-center slider thumb and tooltip bubble update in synchronization with the decaying opacity value

#### Scenario: Manual slider adjustment
- **WHEN** the user drags the slider thumb or changes its position
- **THEN** the viewport opacity immediately updates to match the user-selected slider value

### Requirement: Wakeup and Low-Opacity Accessibility
The application SHALL ensure the top-center slider and recovery controls remain visible and interactable even when the viewport reaches 0% opacity.

#### Scenario: Reaching zero opacity
- **WHEN** the opacity reaches 0%
- **THEN** the dashboard canvas fades completely out while the top-center slider control remains legible and clickable to restore opacity back to 100%

#### Scenario: Dragging slider to revive interface
- **WHEN** the user drags the slider up from 0% toward 100%
- **THEN** the dashboard opacity fades back into view according to the slider value
