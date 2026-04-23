# DESIGN GUIDELINES — The Device

## Aesthetic reference

**Star Trek TNG / LCARS (Library Computer Access and Retrieval System)**
Designed by Michael Okuda. The defining visual language of 24th-century Starfleet technology.

Key qualities to capture:
- Information-dense but never cluttered — every element has a reason
- Warm amber/orange on absolute black — glowing from within, not lit from outside
- Rounded corner pieces that frame panels and sections
- Horizontal colour bands organising the layout into functional zones
- Physical controls (where present) look like they belong to the same illuminated system

---

## Colour palette

| Name | Hex | Usage |
|---|---|---|
| Void black | `#000000` | Panel background — pure black, no tint |
| LCARS amber | `#FF9900` | Primary accent — dials, active states, key labels |
| LCARS dark orange | `#CC6600` | Secondary accent — inactive panels, borders |
| LCARS blue | `#9999FF` | Secondary accent — data readouts, alternate zones |
| LCARS lavender | `#CC99CC` | Tertiary accent — decorative strips, light labels |
| LCARS red | `#FF4444` | Alert / warning — the single red indicator light |
| Phosphor green | `#00FF88` | Oscilloscope waveform — the entity display only |
| Phosphor amber | `#FFAA00` | Oscilloscope noise state — static default |
| Panel grey | `#111111` | Slight depth — recessed areas behind controls |

**Rule:** Never use white. Never use grey as a neutral. Every colour should read as part of the LCARS system.

---

## Typography

**Primary:** Swiss 911 Ultra Compressed BT (or fallback: Helvetica Neue Condensed Bold, or `font-stretch: ultra-condensed` on a condensed sans)

**Rules:**
- All labels: ALL CAPS, letter-spacing 0.15em
- Readout numbers: tabular-nums, monospaced
- No decorative or serif type anywhere
- Label size: 9–11px — LCARS labels are small and precise
- Use amber (`#FF9900`) for active labels, dark orange (`#CC6600`) for inactive

**Label naming convention (on the physical controls):**
Labels are plausibly technical but not literally descriptive. They should feel like real instrument nomenclature.
- `FREQ. MOD. α` not `Frequency`
- `RES. COEFF.` not `Resonance`
- `PHASE SHIFT` not `Phase`
- `GAIN Δ` not `Signal Gain`
- `BAND FILT.` not `Band Filter`
- `POL. INV.` not `Polarity`
- `SCAN MODE` not `Scan Mode`
- `INIT. SCAN` not `Initiate`

---

## Control design

Physical controls styled within the LCARS language — not matte industrial hardware.

### Rotary dial
- Circular face, dark panel grey background
- Amber ring around the perimeter — illuminated, glows on active rotation
- White tick mark at current position (the only white element allowed)
- Amber dot at 12 o'clock (origin marker)
- No numbers on face — pure position reading
- Subtle amber glow radiates outward when being actively turned
- Bezels: thin amber border, slightly rounded edges

### Slider (vertical)
- Thin dark track, full height of the slider zone
- Thumb: rounded rectangle, amber fill, slightly wider than the track
- Track fill below thumb: dark orange `#CC6600`
- Track above thumb: `#222` (empty)
- Subtle glow on the thumb when active

### Toggle switch (2 or 3 position)
- Illuminated housing: dark panel with amber border
- Switch position indicator: lit amber dot at current position
- Snap animation: the dot snaps to position with a slight overshoot
- OFF state: dark orange dot (dimmed), ON state: full amber dot

### Button (momentary)
- Rectangular, LCARS corner radius (~4px)
- Amber fill at rest, white flash on press, returns to amber
- Pressed state: slight depth inset
- Label above or below in LCARS label style

---

## Oscilloscope / readout display

The centrepiece of the panel. A dark screen with CRT-adjacent qualities.

**Frame:** LCARS decorative strips flank the screen left and right — vertical amber/orange/blue bars with small label readouts (`BIO-SCAN ACTIVE`, `LIFE FORM ANALYSIS`, etc.)

**Screen interior:**
- Background: `#000500` (near-black with faint green tint — like a phosphor screen)
- Subtle scanline overlay (CSS repeating-linear-gradient, 2px lines, ~5% opacity)
- Faint screen curvature vignette at edges

**Three visual states:**

1. **Static / noise** — chaotic waveform. Phosphor amber (`#FFAA00`). High-frequency noise, no coherent pattern. Small text readout: `NO SIGNAL DETECTED`.

2. **Partial resolution** — noise begins to cohere. Waveform starts forming repeated patterns. Colour shifts toward phosphor green. Readout: `SIGNAL DETECTED — ANALYSING`. Subtle pulse in the emerging pattern.

3. **Full resolution** — entity appears. Phosphor green (`#00FF88`). Stable, animated, alive. The entity pulses slowly. Readout: `LIFE FORM IDENTIFIED`. LCARS data strips populate with fake bio-readings.

---

## Panel layout

The overall panel is a wide horizontal instrument console. Sections separated by LCARS-style horizontal and vertical amber strips.

**Layout zones (left to right):**
1. **Status strip** (far left, narrow) — vertical amber strip, system status indicators, alert light
2. **Primary controls** — the main dial cluster (3 rotary dials in a row or triangle)
3. **Oscilloscope display** (centre) — the largest element, flanked by LCARS data strips
4. **Secondary controls** (right of display) — sliders, switches, button
5. **Readout strip** (far right, narrow) — vertical strip with scan data, entity classification when found

**Corner pieces:** Rounded L-shaped amber pieces at the corners of the panel — the most iconic LCARS element.

---

## Sound

Characteristic LCARS interaction audio. All sounds are short, clean, electronic.

| Interaction | Sound |
|---|---|
| Dial turn (each tick) | Soft click + faint ascending/descending tone |
| Switch snap | Short sharp bloop |
| Button press | Two-tone bip |
| Partial resolution | Rising shimmer tone (plays once when entity starts to emerge) |
| Full resolution | Three-note ascending chime (iconic Starfleet sound) |
| Background | Near-silence — faint electrical hum only, very low volume |

All sounds: Web Audio API synthesis (no audio files). Keep them subtle — they add texture, not noise.

---

## Anti-patterns

- No white backgrounds anywhere
- No rounded-corner "card" UI patterns (this is hardware, not a web app)
- No drop shadows (LCARS uses flat colour, not shadows)
- No gradients on UI elements (flat colour only — glows are CSS box-shadow, not gradients on fill)
- No sans-serif that reads as "modern web" (Inter, SF Pro, etc.)
- No cute or friendly creature designs — entities should be alien, strange, bioluminescent
- No progress bars or loading indicators — the oscilloscope IS the feedback
- No hover tooltips explaining controls
