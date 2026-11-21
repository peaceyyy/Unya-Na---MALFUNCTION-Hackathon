# Tasks

## 1. Audio Synthesis & Alarm Trigger

- [ ] 1.1 Implement Web Audio API harmonic chime synthesizer helper in `src/app/utils/alarmSound.js` and verify it can trigger and silence audio without external assets.
- [ ] 1.2 Implement timer completion handling in `src/app/App.jsx` to transition to an active `isAlarmRinging` state with visual ringing display when the countdown reaches 00:00.

## 2. Red Emergency Postpone Action ("Wait +1 Hour")

- [ ] 2.1 Add the prominent red postpone button (`Wait +1 Hour`) in Station 3 that adds 3,600 seconds (+1 hour) to the timer during active countdown.
- [ ] 2.2 Implement alarm silencing and 1-hour rescheduling when clicking the red postpone button while the alarm is actively ringing at 00:00.
- [ ] 2.3 Add accessible dismiss/stop button and reset controls to allow concluding the alarm when desired.

## 3. Verification

- [ ] 3.1 Verify alarm ringing at 00:00, audio chime playback, and 1-hour postponement across Light Mode and Flashlight Dark Mode.
- [ ] 3.2 Verify clean production build via `bun run build`.
