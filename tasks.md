# TASKS — The Device

Each task is scoped to one AI session. Start each session with: "Read all planning docs (MASTER_PLAN.md, DESIGN_GUIDELINES.md, IMPLEMENTATION_PLAN.md, USER_JOURNEYS.md), then execute the next unchecked task."

---

## Phase 1 — Project setup

- [x] **Task 1.1** — Initialise Next.js project
  - `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
  - Remove default Next.js boilerplate (page content, globals.css defaults)
  - Set up LCARS CSS custom properties in `globals.css`: colour tokens, font stack
  - Install any needed deps (none expected beyond defaults)

- [x] **Task 1.2** — LCARS panel shell
  - Full-viewport dark layout (`#000000` background, no scroll)
  - Panel frame: amber corner pieces (CSS, rounded L-shapes at all four corners)
  - Horizontal amber divider strip across the middle third
  - Vertical amber strip at left edge and right edge (status strips)
  - Three placeholder zones: left controls, centre display, right controls
  - Each zone: dark panel grey (`#111111`) inset, amber border
  - Deploy to Vercel — confirm live URL

---

## Phase 2 — Rotary dial

- [x] **Task 2.1** — Rotary dial physics
  - `components/RotaryDial.tsx` — props: `value` (0–1), `onChange`, `steps` (optional, default continuous)
  - Pointer events: `pointerdown` on dial → capture pointer → `pointermove` on document → `pointerup`
  - Rotation calculation: vertical pointer delta → degrees (1px = ~1°, calibrate to feel right)
  - Momentum: store velocity on each `pointermove`. On `pointerup`, run deceleration loop via `requestAnimationFrame`. Friction ~0.87 per frame.
  - Clamp to 0–1 range with 8° elastic overshoot then snap back
  - `onChange` fires on each value change during momentum

- [x] **Task 2.2** — Rotary dial visual
  - Circular face: `#111111` background, thin amber border (`#FF9900`)
  - Amber ring: a 4px arc around the perimeter, positioned at dial rotation angle
  - White tick mark: 2px line at current rotation position, from centre outward
  - Amber dot at 12 o'clock (fixed origin marker)
  - Active state (pointer held): `box-shadow: 0 0 12px #FF9900` glow radiating out
  - Smooth rotation transform via CSS `transform: rotate(Xdeg)`

- [x] **Task 2.3** — Rotary dial sound
  - Web Audio API: create `AudioContext` on first user interaction
  - Tick sound: short sine wave burst (40ms, frequency ~800Hz, quick fade out)
  - Trigger on each N degrees crossed (e.g. every 5°)
  - Volume: very subtle — background texture, not prominent
  - Place one dial in the left controls zone. Verify physics and sound feel correct.

---

## Phase 3 — Remaining controls

- [x] **Task 3.1** — Vertical slider component
  - `components/VerticalSlider.tsx` — props: `value` (0–1), `onChange`
  - Drag physics: pointer delta → value change, with slight resistance (multiply delta by 0.8)
  - Smooth glide: on release, slight momentum (less than dial — 200ms, friction 0.7)
  - Visual: dark track, amber thumb (rounded rect), dark orange track fill below thumb
  - Active glow on thumb when dragging

- [x] **Task 3.2** — Toggle switch component
  - `components/ToggleSwitch.tsx` — props: `positions` (2 or 3), `value`, `onChange`
  - Click/tap advances to next position
  - Snap animation: CSS transition with slight overshoot (cubic-bezier spring)
  - Visual: illuminated housing, amber dot at current position, dark orange at others
  - Bloop sound on snap: short square wave burst, 60ms

- [x] **Task 3.3** — INIT. SCAN button + scan state
  - `components/MomentaryButton.tsx` — props: `label`, `onPress`
  - Press: inset animation (2px transform), amber → white flash → back to amber
  - Two-tone sound: two quick sine bursts at different frequencies (100ms apart)
  - Release: spring back

- [x] **Task 3.4** — DeviceState + panel layout
  - `hooks/useDeviceState.ts` — central state for all control values, normalised 0–1
  - Place all controls in correct zones per DESIGN_GUIDELINES.md layout spec
  - Add LCARS label plates under each control (all-caps, condensed, amber, 9px)
  - Controls: FREQ. MOD. α (dial), RES. COEFF. (dial), PHASE SHIFT (dial, 8 steps), GAIN Δ (slider), BAND FILT. (slider), POL. INV. (2-pos switch), SCAN MODE (3-pos switch), INIT. SCAN (button)

---

## Phase 4 — Oscilloscope display

- [x] **Task 4.1** — Canvas noise renderer + live waveform
  - `components/OscilloscopeDisplay.tsx` — canvas filling the display zone
  - Background: `#000500` (near-black, faint green phosphor tint)
  - Noise waveform: animated sine waves with random frequency/amplitude noise injected each frame
  - Colour: phosphor amber (`#FFAA00`)
  - `requestAnimationFrame` loop — smooth 60fps animation
  - `NO SIGNAL DETECTED` readout text — LCARS style, bottom of display, 9px amber

- [x] **Task 4.2** — Scanline + vignette + LCARS frame
  - CSS scanline overlay: `repeating-linear-gradient` 2px lines, 5% opacity black
  - CSS vignette: `box-shadow: inset 0 0 60px rgba(0,0,0,0.8)`
  - LCARS data strips: left and right of canvas — vertical amber/orange/blue bars, static label text
    - Left strip: `BIO-SCAN`, `FREQ. ANALYSIS`, `LIFE FORM DET.`
    - Right strip: `STATUS: SCANNING`, `SENSITIVITY: —`, `CLASS: —`

- [x] **Task 4.3** — Noise responds to DeviceState
  - Wire DeviceState into OscilloscopeDisplay
  - Noise texture shifts subtly as controls change — frequency and amplitude vary with FREQ. MOD. α and GAIN Δ
  - Not entity resolution yet — just texture variation to make the screen feel responsive

---

## Phase 5 — Entity system

- [x] **Task 5.1** — Entity definitions + EntityResolver
  - Define 5 entity configs in `data/entities.ts` — spread control targets across the dial space
  - Entity names: `NEURAL LATTICE FORM — CLASS IV`, `RADIAL FILAMENT ENTITY — CLASS II`, `CRYSTALLINE MASS — CLASS VII`, `FLUID MEMBRANE FORM — CLASS I`, `WAVE COLLAPSE PATTERN — CLASS IX`
  - `EntityResolver` function: takes DeviceState, returns `{ entity, proximity }` (0–1)
  - Proximity calculation: weighted Euclidean distance from each entity's control target, normalised

- [x] **Task 5.2** — Oscilloscope state transitions
  - `proximity < 0.3` → pure noise (amber, as before)
  - `0.3–0.7` → partial: noise starts organising, colour interpolates amber → green, readout: `SIGNAL DETECTED — ANALYSING`
  - `≥ 0.7` → full resolution: entity render takes over, readout: `LIFE FORM IDENTIFIED`
  - Rising shimmer sound on crossing 0.3 threshold (upward sweep tone, 400ms)
  - Three-note ascending chime on crossing 0.7 threshold

- [x] **Task 5.3** — Entity canvas render functions (entities 1–3)
  - `NEURAL LATTICE`: 8–12 nodes in loose cluster, arcing electrical connections between nodes, slow pulse
  - `RADIAL FILAMENT`: concentric rings, tendrils extending and retracting rhythmically
  - `CRYSTALLINE MASS`: polygonal faceted form, slow rotation, refraction glint effect
  - All: phosphor green (`#00FF88`), subtle glow, animated at 60fps

- [x] **Task 5.4** — Entity canvas render functions (entities 4–5) + data strips
  - `FLUID MEMBRANE`: amoebic blob shape using sin-based perlin noise on border, shifting internal topology
  - `WAVE COLLAPSE`: interference pattern from two wave sources that collapses and re-expands
  - Wire entity bio-readings into right LCARS data strip on full resolution:
    - `CLASS: [entity class]`
    - `STATUS: CONFIRMED`
    - `SENSITIVITY: [random fake value]`
  - Alert light: pulses amber when `proximity < 0.7`, steadies on full resolution

---

## Phase 6 — Polish

- [x] **Task 6.1** — Glow + ambient effects
  - Amber glow (`box-shadow`) on all controls when active
  - Alert light component: pulsing amber circle on left status strip, steadies on entity found
  - Background hum: Web Audio oscillator, very low frequency (~60Hz), very low volume (~0.03 gain), starts on first interaction

- [ ] **Task 6.2** — Final layout + label pass
  - Review all label text — correct LCARS abbreviation style
  - Ensure all LCARS corner pieces render correctly at different viewport widths
  - Verify colour tokens are consistent everywhere
  - Check font rendering — condensed, all-caps, amber

- [ ] **Task 6.3** — Audio polish + browser compatibility
  - Verify all sounds trigger correctly (no autoplay policy violations)
  - Ensure AudioContext is created on first pointer interaction
  - Test sound mix — nothing too loud or too quiet
  - Test in Chrome, Firefox, Safari

- [ ] **Task 6.4** — Final deploy + QA
  - Full Vercel deploy
  - Test all 5 entities are discoverable by a fresh visitor within 5 minutes
  - Verify physics feel on trackpad and mouse
  - Screenshot for portfolio use
  - Update `_The Device.md` in Second Brain with live URL

---

## Backlog (post-POC)

- Mobile layout pass
- Entity codex UI — catalogue of found entities with rarity
- Aggregate data — "X visitors have found this entity"
- Multi-session persistence — entity finds remembered via localStorage
- 3 additional entities (expand to 8 total)
- Shareable entity resolution state
