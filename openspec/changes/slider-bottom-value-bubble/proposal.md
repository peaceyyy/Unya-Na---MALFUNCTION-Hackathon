# Proposal

## Why

In the top-center navbar placement, having the Sakuga slider's percentage speech bubble positioned above the slider track crowds the top edge of the viewport and creates awkward visual clipping against the window boundary. Reorienting the indicator speech bubble to sit underneath the slider track with an upward-pointing indicator tail provides natural visual hierarchy and prevents any collision with the top of the screen.

## What Changes

- **Downward Speech Bubble Orientation**:
  - Reposition the `.val` indicator bubble in the slider component from above the track (`top: -30px`) to below the track (`top: 40px`).
  - Invert the pointer tail (`.val::after`) to emerge from the top edge of the bubble pointing upward toward the slider thumb.
  - Invert the rotational pivot (`transform-origin: 50% -50%`) so inertial tilt behaves realistically while dragging below the thumb.
- **Support Placement Configuration**:
  - Enable custom placement or downward orientation on `<sakuga-slider>` (via an attribute such as `bubble="bottom"` or default downward orientation for top-mounted bars).
- **Navbar Layout Alignment**:
  - Re-center the slider in `Navbar.jsx` with natural vertical alignment without needing awkward top paddings or offsets.

## Capabilities

### New Capabilities
- `slider-downward-bubble`: Customizes or configures the Sakuga Slider custom element so its floating numeric value bubble renders beneath the track with an inverted indicator tail and downward tilt kinematics.

### Modified Capabilities
<!-- None -->

## Impact

- Modifies `public/sakuga-vfx/slider.js` to support or implement downward positioning for `.val`.
- Updates `src/app/components/SakugaSlider.jsx` and `src/app/layout/Navbar.jsx` to take advantage of clean vertical centering.
