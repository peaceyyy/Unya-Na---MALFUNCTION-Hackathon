# Delayed Clock implementation plan

**Status** Proposed for review  
**Branch** `feat/delayed-clock`  
**Baseline** `5067fb4`

## Product requirements

Clock is an app inside Unya Na's dashboard. It shows the correct local time, lets users set an intentionally imprecise alarm, runs a timer with a misbehaving hourglass, and records stopwatch laps with a tiny race car. The core tasks must be accessible with the keyboard and usable on a narrow screen.

| Screen | Behavior | Acceptance criteria |
| --- | --- | --- |
| Clock and alarm | Set one alarm for today or tomorrow, optionally with a rushed note such as “meeting i think.” For a 7:00 AM target, the demo windows are 6:58–6:59 AM or 7:01–7:02 AM. Show both windows before arming and keep the selected ring time a surprise. | Each new occurrence samples one eligible window and one minute within it. Refreshing the view or changing tabs inside the dashboard does not reroll it. A visible alert reports the actual ring time and offset. Stop and Cancel act immediately. |
| Timer | Start, pause, resume, and reset a duration. Near completion, the hourglass sends sand back up once, then empties. | The digits count down normally. The deadline triggers one completion event regardless of the animation. Pause freezes the visual progress, reset clears the effect, and reduced motion swaps the sand level without animating it. |
| Stopwatch | Start, pause, resume, reset, and capture laps. Each lap sends an open-wheel car around an oval with an overcautious last corner. | Each press records its split immediately. A new press can restart the decorative animation while retaining every split. Reduced motion shows a finish state without racing the car. |

### Alarm behavior

- Calculate candidates for the selected date in the device's local time. The demo windows are 1–2 minutes early or 1–2 minutes late, with an equal chance for each available band. Choose once at arming and keep a single occurrence ID and due timestamp. Store the target and date separately for the UI.
- Filter out candidates that have already passed. Show the actual remaining options if one band is gone. If no candidates remain, prompt the user to select tomorrow or edit the time. Show day labels when a window crosses midnight. Flag nonexistent local target times on daylight saving transitions and show the offset if a repeated hour needs disambiguation.
- Use the end of the selected window's last minute as the initial delivery cutoff. If the tab resumes after the chosen time but within that window, deliver once and record the actual time. If the window has expired, show “Missed while the tab was inactive.” Keep that distinct from the deliberate early or late offset.
- Add snooze after the core ring flow. Try a fresh 3–7 minute snooze, clipped to the alarm's latest advertised time (7:02 AM in the example, through that minute). Show the resulting range before the user confirms, and explain when there's no eligible snooze left. A separately configurable cutoff and daily repeats can follow if the demo needs them.
- Add an explicit **Try alarm** action. Simulate an alarm eight seconds away with a possible ring three seconds early or four seconds late. Label the preview prominently, use the same alert controls, and leave any armed alarm in place. Defer preview audio if a real alert is active.

## Technical design

### Existing entry points

- The Clock launcher uses `delayed-alarm` in `src/app/appRegistry.js`. Register the new feature there, keep the `#delayed-alarm` URL, and update the late-only tagline to describe both outcomes.
- Build the views under `src/features/clock/`. The existing `src/features/extras/DelayedAlarm.jsx` is empty. Point the registry's feature path and component directly at the new Clock entry.
- Mount a small Clock state provider and the shared alert surface outside the hash-selected view in `src/main.jsx` or its app wrapper. The clock tools survive switching between dashboard routes in the same browser tab. Keep display ticks local to the visible tools so the dashboard does not repaint every second.
- Use the React components, Tailwind tokens in `src/app/App.css`, and CSS module conventions already in the project. Build the sand and car as local visual elements with CSS for their motion. This is a browser feature with in-memory session state and a short local or synthesized chime.

### Timing and delivery

| Concern | Design |
| --- | --- |
| Alarm and timer | Alarm uses a wall clock timestamp. Timer derives remaining time from a deadline and snapshots remaining time when paused. A scheduled callback requests a state check. Reconcile when the tab becomes visible and fire completion once per occurrence. |
| Stopwatch | Use `performance.now()` for elapsed time and capture the split at the button press. Derive each split from the current elapsed value minus the prior lap's elapsed value. Animation reads lap events. [High Resolution Time](https://www.w3.org/TR/hr-time-3/) |
| Alerts | Prepare audio on an Arm, Start, or Try button click. Always show a text alert, even if audio is blocked. Give the alarm and timer independent dismiss actions and play at most one chime at a time. Clean up callbacks and audio on cancellation or teardown so remounting in React Strict Mode cannot duplicate an alert. [Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) |
| Delivery scope | The first version works within one open dashboard tab. Browser suspension can defer delivery, and the feature starts fresh on reload. State this near Arm. A native or OS backed scheduler is a separate option if alarm delivery with a closed tab becomes a requirement. The recommendation for this branch is the in-app version. [HTML timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers), [Inactive tab timeouts](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#timeouts_in_inactive_tabs) |

Keep time arithmetic in small pure functions that accept the current timestamp and random source from the caller. Keep the alarm, preview, timer, and stopwatch distinct in state. Their controls and lifecycle differ. Share the alert surface and chime only where their behavior matches.

The existing OpenSpec change `timer-alarm-delay` describes a different Protected Break timer and a one-hour postpone button. This plan uses the Clock launcher and its own timer semantics.

## Delivery sequence

1. **Alarm and launcher.** Wire the existing Clock entry, show local time and the alarm form, and add the sampled ring, visible alert, and immediate Stop or Cancel. Use the same alert when a user navigates home with an armed alarm.
2. **Demo and hourglass.** Add Try alarm and the timer's start, pause, resume, and reset flow. Animate one reverse fill per countdown near the end. If the duration is too short for the effect to read, keep the standard display. Slices 1 and 2 form the hackathon demo.
3. **Racing stopwatch.** Add the lap list before the track animation. Use one static track and one movable car. Capture every lap even when a previous animation is in progress.
4. **Snooze and edge cases.** Add the bounded snooze. Walk through midnight, near-past alarm creation, simultaneous alerts, route changes, blocked audio, and narrow screens. Tighten the copy and control states before presenting the change for review.

## UI review during implementation

Use the existing dashboard as the design authority for color, type, spacing, and focus. Use tabular numerals and plain action labels for times and controls. The handwritten note, reversing sand, and racing lap supply the feature's character. Clock seconds and animation stay out of live announcements. Announce transitions such as armed, ringing, missed, and timer complete.

Use the project Vibe Check while authoring each slice. Inspect tokens, contrast, focus, keyboard access, small-screen overflow, reduced motion, real control handlers, and copy. File-based findings should name the file and line. Treat verifiable defects as findings and require repeated evidence before flagging stylistic patterns. The session selected antislop during. The two antislop skill files cited by the repository are absent, so the canonical BALAI design governance and Vibe Check provide the available guidance.

## Human review and later verification

Present the modified files for human review when implementation is ready. Run verification only after **“Human review approved; run verification.”** Browser automation and end-to-end checks require separate explicit approval.

After approval, prioritize deterministic checks for both alarm bands, cutoff handling, a single alert after a route or visibility change, pause and resume, and consecutive lap presses. The demo walkthrough is to open Clock, run Try alarm, set a 10-second timer and watch the sand reverse, then record two quick laps. Check usable focus, visible alert feedback without sound, and reduced motion when browser review is separately approved.

## Planning sources

- BALAI `/plan`, `/clarify`, and `/ui-audit` workflows, the Kairou planning guidance, the development constitution, the guideline index and its token guidance, and the specification template.
- BALAI Design Governance and the project Vibe Check checklist.
- The repository app registry, route handling, dashboard layout, theme tokens, and existing Protected Break OpenSpec proposal.
