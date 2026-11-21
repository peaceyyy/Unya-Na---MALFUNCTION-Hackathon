# Spec Delta

## Purpose

Provides audio and visual alarm notifications when the Protected Break countdown timer reaches zero, alongside a dedicated red emergency postponement control that delays the alarm by one hour.

## ADDED Requirements

### Requirement: Audible and Visual Break Alarm
The system SHALL sound an audible synthesized chime and display a visual ringing indicator when the break countdown reaches 00:00.

#### Scenario: Alarm fires at 00:00
- **WHEN** countdown timer reaches 00:00 while running
- **THEN** system triggers audio chime playback and switches the timer display to an active ringing alert state.

#### Scenario: User silences active alarm
- **WHEN** user clicks the stop or dismiss control while the alarm is sounding
- **THEN** system silences the audio alarm and resets the timer display.

### Requirement: Red One-Hour Emergency Postpone Button
The system SHALL provide a dedicated red postpone control that adds one hour (3,600 seconds) to the timer and reschedules the alarm for that time.

#### Scenario: Postpone during countdown
- **WHEN** user clicks the red postpone control while the timer countdown is in progress
- **THEN** system adds 3,600 seconds to the remaining countdown and continues counting down.

#### Scenario: Postpone when alarm is ringing
- **WHEN** user clicks the red postpone control while the alarm is actively sounding at 00:00
- **THEN** system silences the alarm, sets remaining time to 3,600 seconds (60:00), restarts the countdown, and sounds the alarm again once that hour expires.
