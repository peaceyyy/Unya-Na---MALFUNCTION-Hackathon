# Proposal

## Why

In keeping with the humorous anti-productivity philosophy of Unya Na, the interface should reflect the user's growing inertia. As time passes without productive activity (or over an idle duration), the entire dashboard viewport opacity progressively decays from 100% down to 0%, metaphorically dissolving the workspace. An interactive top-center Sakuga VFX slider acts as both a visual indicator and a tactile override to adjust or restore opacity.

## What Changes

- **Progressive Opacity Decay Engine**: Introduce an idle/interval decay timer that gradually decrements viewport opacity from 100% to 0% over a configurable decay period (e.g., decaying over several minutes of idle time, or controllable interval).
- **Interactive Sakuga Slider Indicator**: Mount `<sakuga-slider>` at the top center of the application (embedded in the navbar or top overlay) to display the live opacity percentage.
- **Bi-directional Opacity Control**:
  - As opacity decays automatically, the slider's value and visual thumb smoothly track the current opacity.
  - Users can grab and drag the slider at any time to manually adjust or restore opacity back to 100%.
  - User activity (pointer movement, key presses, or slider interaction) can either slow, pause, or restore the opacity based on user interaction.
- **Zero Opacity Threshold Behavior**: When opacity reaches 0%, provide a gentle wake-up hint or ensure the top-center slider remains accessible so users can always restore visibility.

## Capabilities

### New Capabilities
- `viewport-opacity-decay`: Manages progressive viewport opacity reduction over time/inactivity, synchronization with a top-center `<sakuga-slider>` indicator, and manual opacity adjustment/restoration.

### Modified Capabilities
<!-- None -->

## Impact

- **New Asset**: Registers `public/sakuga-vfx/slider.js` in `index.html` as a custom element script.
- **State & Context**: Introduces opacity state management (or extends existing theme/inactivity context) to broadcast opacity percentage across the layout.
- **UI Components**:
  - Updates `src/app/layout/Navbar.jsx` to render the centered `<sakuga-slider>` indicator.
  - Updates `src/app/layout/DashboardLayout.jsx` or root container to apply the dynamic `opacity` style.
- **Dependencies**: Uses `finktheartist/sakuga-vfx/slider` custom element.
