# Design

## Context

Station 3 ("Protected Break") in `src/app/App.jsx` provides a countdown timer (`secondsLeft`) and basic controls (`Start/Pause Break`, `+15m`). Currently, when the timer runs out, it simply stops at 00:00 without ringing or offering a specialized deferral action. See `proposal.md` for background.

## Goals / Non-Goals

**Goals:**
- Provide a zero-dependency synthesized audio alarm using the Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) that plays a gentle chime when the countdown reaches 00:00.
- Implement visual ringing alert state on the timer display when time expires.
- Introduce a prominent red "Wait +1 Hour" emergency postpone button in Station 3 that adds 3,600 seconds to the timer during countdown and reschedules the alarm for an hour later when ringing.
- Support dismissing and resetting the alarm cleanly.

**Non-Goals:**
- Persisting running countdown across page reloads in localStorage.
- System push notifications (OS-level notifications).
- External `.mp3` / `.wav` audio asset downloads.

## Decisions

### 1. Web Audio API for Zero-Dependency Chime Synthesis
- **Decision**: Synthesize a pleasant repeating harmonic bell/chime using the browser's built-in `AudioContext` (e.g. 520Hz and 660Hz sine tones with decaying gain envelope).
- **Rationale**: Avoids asset loading failures, CORS issues, or external file dependencies. Automatically silences when dismissed.
- **Alternatives considered**: Bundling an `.mp3` audio file (adds bundle weight and potential load delays) or using the browser's default system beep (harsh and platform-inconsistent).

### 2. Red Emergency Postpone Action Placement and Flow
- **Decision**: Place the red postpone button (`Wait +1 Hour` / `Push +1h`) as an emergency control in Station 3.
  - During countdown: Clicking immediately extends `secondsLeft` by 3,600 and resumes countdown.
  - While alarm is ringing at 00:00: The red button highlights as the primary action to silence the alarm, set `secondsLeft` to 3,600, and immediately start the 1-hour delay.
- **Rationale**: Directly satisfies the user's requirement ("create a red thing that makes it wait for another hour, then sound the alarm at that time") while aligning with the theme of Unya Na.
- **Alternatives considered**: A dropdown menu with multiple durations (less immediate, lacks the single dramatic "red button" feel).

### 3. Alarm State Management
- **Decision**: Manage `isAlarmRinging` as a dedicated state in Station 3. When `secondsLeft` transitions to 0 while `timerRunning` is true, set `isAlarmRinging = true` and `timerRunning = false`.
- **Rationale**: Isolates the alarm presentation from ordinary paused states and provides clear triggers for audio playback and UI changes.

## Risks / Trade-offs

- **[Risk] AudioContext Autoplay Policies** → **Mitigation**: Audio is triggered only after the user has interacted with the page (started the break timer or clicked postpone), which satisfies browser user-gesture requirements. Ensure `audioCtx.resume()` is called gracefully.
- **[Risk] Visual contrast with primary palette** → **Mitigation**: Use Tailwind `rose-600` (`#E11D48`) with white text and `bg-rose-50` border treatments to ensure WCAG AA contrast (4.5:1+) against light and dark backgrounds.
