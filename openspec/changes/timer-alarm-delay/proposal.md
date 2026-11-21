# Proposal

## Why

In the "Protected Break" station, the countdown timer currently runs down but lacks an audible and visual alarm when time expires. Furthermore, true to Unya Na's philosophy of intentional deferral, users need a prominent emergency delay control (a "red button") that allows postponing the alarm for another hour, both during the active countdown and when the alarm is actively sounding.

## What Changes

- **Break Timer Alarm System**:
  - Add an audio and visual alarm trigger that activates when the countdown timer reaches 00:00.
  - Implement Web Audio API synthesis for a pleasant, zero-dependency ringing chime/alarm sound.
  - Provide a visual ringing state on the timer display when the countdown completes.
- **Red Emergency Delay Control ("Wait Another Hour")**:
  - Add a dedicated, high-contrast red postpone button to Station 3.
  - While the timer is counting down: clicking the red button immediately adds +1 hour (+3,600 seconds) to the remaining time.
  - When the alarm is sounding at 00:00: clicking the red button silences the current alarm and schedules the countdown for 1 hour (60:00), which will sound the alarm again once that hour expires.
  - Provide an accessible stop / reset control to dismiss the alarm cleanly when the break is concluded.

## Capabilities

### New Capabilities
- `break-timer-alarm`: Audio and visual alarm notification on break timer expiration, paired with an emergency red 1-hour delay control available both during countdown and upon alarm trigger.

### Modified Capabilities
<!-- None -->

## Impact

- Modifies `src/app/App.jsx` in Station 3 (Protected Break timer).
- Adds Web Audio synthesizer helper or audio synthesis hook within the timer component.
- Updates styling for the red postpone control and ringing alarm states.
