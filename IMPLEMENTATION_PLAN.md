# IMPLEMENTATION PLAN — The Device

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + CSS custom properties for LCARS tokens
- **Controls:** Custom React components with pointer event physics (no library)
- **Display:** HTML Canvas — oscilloscope noise + entity rendering
- **Audio:** Web Audio API — synthesised sounds, no audio files
- **Hosting:** Vercel (free tier)
- **AI coding tool:** Claude Code — CLAUDE.md in project root loads all context automatically

## Architecture principle

Each control type is a standalone reusable component with its own physics simulation. The control components emit normalised values (0–1 or discrete positions). A central `DeviceState` object holds all control values. The oscilloscope reads `DeviceState` and renders accordingly.

```
Controls (emit values)
  → DeviceState (central state object)
  → EntityResolver (maps state to entity proximity)
  → OscilloscopeDisplay (renders noise or entity based on proximity)
  → AudioEngine (triggers sounds based on interactions)
```

---

## Phase 1 — Project setup

**Goal:** Running Next.js app with LCARS shell layout, no working controls yet.

- [ ] `npx create-next-app@latest the-device --typescript --tailwind --app`
- [ ] Set up LCARS CSS custom properties (colour tokens, font stack)
- [ ] Load condensed font (Swiss 911 or Helvetica Neue Condensed via Google Fonts / local)
- [ ] Build panel shell: full-viewport dark layout, amber corner pieces, zone dividers
- [ ] Placeholder boxes for each zone (controls left, display centre, controls right, status strips)
- [ ] Deploy to Vercel — establish the live URL early

**Done when:** Dark LCARS panel shell is live at Vercel URL. No controls functional yet.

---

## Phase 2 — Rotary dial component

**Goal:** One perfect rotary dial. Get the physics right before building anything else.

- [ ] `RotaryDial` component — accepts `value`, `onChange`, `min`, `max`, `steps` props
- [ ] Pointer events: `pointerdown` → `pointermove` → `pointerup` on the document
- [ ] Physics: calculate rotation from pointer delta (vertical drag = rotation)
- [ ] Momentum: on `pointerup`, apply remaining velocity that decelerates over ~300ms
- [ ] Deceleration: `requestAnimationFrame` loop with friction coefficient (~0.85 per frame)
- [ ] Clamp to min/max with a slight elastic overshoot then snap back
- [ ] LCARS styling: amber ring, tick mark, glow on active state
- [ ] Tick sound: Web Audio API — short tone on each degree crossing a tick position
- [ ] Works on touch (pointer events cover both)

**Done when:** One dial spins with satisfying momentum, sounds on each tick, glows when active.

---

## Phase 3 — Remaining control components

**Goal:** All 6–8 controls built and emitting values to `DeviceState`.

- [ ] **Vertical slider** — drag physics, glide resistance, amber thumb, glow on active
- [ ] **Toggle switch (2-position)** — snap mechanic, overshoot + settle, bloop sound
- [ ] **Toggle switch (3-position)** — same as 2-position, three stops
- [ ] **Momentary button** — press inset animation, two-tone sound, amber flash
- [ ] **DeviceState** — central state object, all control values normalised to 0–1
- [ ] Place all controls in the panel zones per the layout spec in DESIGN_GUIDELINES.md
- [ ] Label plates: all-caps condensed amber text under each control

**Done when:** All controls on panel, all emitting values, panel looks like LCARS hardware.

---

## Phase 4 — Oscilloscope display

**Goal:** Canvas display showing noise state, reading DeviceState.

- [ ] Canvas element filling the display zone, `#000500` background
- [ ] Scanline overlay (CSS)
- [ ] Screen vignette (CSS box-shadow inset)
- [ ] Noise renderer: chaotic waveform animation, phosphor amber colour, `requestAnimationFrame`
- [ ] `NO SIGNAL DETECTED` readout text (LCARS style, small, amber)
- [ ] LCARS data strips left and right of the canvas (decorative, static for now)
- [ ] Noise intensity responds to DeviceState — subtle variation as controls move (not entity resolution yet)

**Done when:** Oscilloscope shows animated amber noise, responds subtly to control movement.

---

## Phase 5 — Entity system

**Goal:** 5+ entities discoverable by finding correct control combinations.

### Entity definition

Each entity is defined as:
```typescript
type Entity = {
  id: string
  name: string           // e.g. "NEURAL LATTICE FORM — CLASS IV"
  controlTarget: {       // the "correct" control state for this entity
    freqMod: number      // 0–1
    resCoeff: number     // 0–1
    phaseShift: number   // 0–7 (stepped)
    gainDelta: number    // 0–1
    bandFilt: number     // 0–1
    polInv: boolean
    scanMode: 0 | 1 | 2
  }
  tolerance: number      // how close controls need to be (0.1 = tight, 0.25 = forgiving)
  renderFn: (ctx, t) => void  // canvas drawing function
  bioReadings: string[]  // fake data strip labels when resolved
}
```

### Entity resolver

- Reads DeviceState every frame
- Calculates proximity score: weighted distance from each entity's `controlTarget`
- `proximity = 0` → full noise, `proximity = 1` → full entity
- Returns `{ entity: Entity | null, proximity: number }`

### Oscilloscope states (driven by resolver)

- `proximity < 0.3` → pure noise (amber)
- `0.3 ≤ proximity < 0.7` → partial — noise begins to cohere, green starts bleeding in, rising shimmer sound triggers once
- `proximity ≥ 0.7` → full resolution — entity render function takes over, three-note chime, data strips populate

### Entity render functions (5 for POC)

Each entity is procedurally drawn on canvas. All: phosphor green, bioluminescent, alien.

1. **Neural lattice** — interconnected nodes pulsing with slow electrical arcs
2. **Radial filament** — concentric rings with extending tendrils, breathing
3. **Crystalline mass** — angular faceted form rotating slowly, refracting light
4. **Fluid membrane** — amoebic shape with shifting internal topology
5. **Wave collapse** — interference pattern that collapses and re-expands rhythmically

- [ ] Define 5 entity configs with spread-out control targets
- [ ] Build EntityResolver function
- [ ] Implement oscilloscope state transitions (noise → partial → full)
- [ ] Build 5 entity canvas render functions
- [ ] Wire rising shimmer and three-note chime to resolution events
- [ ] Populate LCARS data strips with entity bio-readings on full resolution

**Done when:** Visitor can find at least 3 entities by experimenting with controls.

---

## Phase 6 — Polish

**Goal:** Full LCARS aesthetic, sounds, glow effects, feels complete.

- [ ] Amber glow effects on all active controls (CSS box-shadow)
- [ ] Alert light (red) on the status strip — pulses slowly when no entity found, steadies on resolution
- [ ] Background hum (Web Audio, very low volume, constant)
- [ ] LCARS corner pieces (CSS or SVG, amber, rounded L-shapes)
- [ ] Full label set on all controls (engraved style — small, all-caps, amber)
- [ ] Entity name and classification displayed in LCARS data strips on resolution
- [ ] Scanline and vignette polish on the display
- [ ] Verify all sounds work (no audio autoplay policy issues — trigger on first user interaction)
- [ ] Final Vercel deploy, share URL

**Done when:** The panel looks and sounds like it belongs on the Enterprise. Feels complete.

---

## Dependency order

```
Phase 1 (shell)
  → Phase 2 (first dial — proves physics)
  → Phase 3 (remaining controls)
  → Phase 4 (oscilloscope + noise)
  → Phase 5 (entity system)
  → Phase 6 (polish)
```

Each phase is a shippable checkpoint. Stop after any phase if time is short — Phase 2 alone is already impressive.
