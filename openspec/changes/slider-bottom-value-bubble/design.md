# Design

## Context

The Sakuga slider custom element (`public/sakuga-vfx/slider.js`) hardcodes its `.val` speech bubble position to `top: -30px` with a downward arrow. In compact top bar layouts such as `Navbar.jsx`, this position collides with the top viewport boundary. See `proposal.md` for user motivation.

## Goals / Non-Goals

**Goals:**
- Extend `<sakuga-slider>` in `public/sakuga-vfx/slider.js` to support downward bubble rendering via an optional attribute `bubble="bottom"` (or configurable orientation).
- Adjust `.val` placement styles, pointer arrow, and spring rotational pivot for realistic bottom-hung inertia.
- Update `SakugaSlider.jsx` and `Navbar.jsx` to render `<sakuga-slider bubble="bottom">` with balanced vertical centering.

**Non-Goals:**
- Altering the core canvas particles (speed lines, puffs, clouds, and crescent slices).
- Breaking existing default top-bubble behavior when `bubble="bottom"` is not specified.

## Decisions

### 1. `bubble="bottom"` Attribute in `slider.js`
- **Decision**: Add `'bubble'` to `static observedAttributes` in `public/sakuga-vfx/slider.js` and add scoped CSS rules:
  ```css
  :host([bubble="bottom"]) .val {
    top: 40px;
    transform-origin: 50% -60%;
  }
  :host([bubble="bottom"]) .val::after {
    top: auto;
    bottom: 100%;
    border-top: none;
    border-bottom: 7px solid var(--sk-ink);
  }
  ```
- **Rationale**: Keeps the component self-contained and flexible, allowing callers to choose `bubble="top"` (default) or `bubble="bottom"`.
- **Alternatives considered**: Manually hacking styles through DOM `el.shadowRoot.querySelector('.val').style` from React (fragile and prone to re-render race conditions).

### 2. Rotational Pivot & Kinematics
- **Decision**: Set `transform-origin: 50% -60%` on `:host([bubble="bottom"]) .val`.
- **Rationale**: When the speech bubble hangs below the thumb, its anchor point to the thumb is at the top of the bubble. Tilting with a negative origin correctly swings the bottom of the bubble backward as the thumb accelerates across the track.

### 3. Header Alignment in `Navbar.jsx`
- **Decision**: Position the slider directly at `top-1/2 -translate-y-1/2` in the navbar without manual pixel shims. The bottom bubble will float gracefully right beneath the slider track within the 56px navbar footprint.

## Risks / Trade-offs

- **[Risk] Downward bubble overlapping content below Navbar** → **Mitigation**: The navbar is 56px tall and the track is only 14px; the bubble positioned at `top: 40px` fits neatly within the lower half of the navbar bar without crossing the bottom border.
