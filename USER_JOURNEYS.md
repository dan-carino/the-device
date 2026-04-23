# USER JOURNEYS — The Device

## Primary visitor journey

### Step 1 — Arrival

**What they see:**
- Full-viewport dark panel, alive with amber glow
- LCARS corner pieces, colour strips, label zones
- 6–8 illuminated controls — some dials, sliders, switches
- Centre display: oscilloscope showing chaotic amber noise
- Small text readout: `NO SIGNAL DETECTED`
- Faint electrical hum in the background

**What they think:**
- "What is this?"
- No instructions. No tooltip. No "try me" prompt.

**What they do:**
- Their hand moves to the first interesting control — probably a large dial

---

### Step 2 — First interaction

**What they do:** Grab a dial and rotate it.

**What happens:**
- Dial turns with weighted momentum — continues spinning after they let go, decelerates
- Amber ring glows brighter during rotation
- Each degree-crossing produces a soft tick sound
- Oscilloscope noise subtly shifts — texture changes, not dramatically

**What they think:**
- "OK that felt good"
- "Something happened on the screen — what?"
- They try another control

---

### Step 3 — Exploration

**What they do:** Start systematically moving controls — sliders up and down, switches toggling, more dials.

**What happens:**
- Each control responds with its own distinct physics and sound
- Noise on the oscilloscope shifts continuously as DeviceState changes
- Nothing resolves yet — they're still far from any entity's control target
- The alert light on the status strip pulses slowly

**What they think:**
- "There must be something I'm supposed to find"
- "The screen is definitely responding to something"
- They start trying combinations more intentionally

---

### Step 4 — Partial resolution

**What they do:** Approach a valid entity configuration (proximity 0.3–0.7).

**What happens:**
- Noise on the oscilloscope begins to cohere — a pattern starts forming within it
- Colour shifts from amber toward green
- A single rising shimmer tone plays (once, signals something is emerging)
- Readout changes: `SIGNAL DETECTED — ANALYSING`
- They freeze — "something's there"

**What they think:**
- "I'm getting closer to something"
- They start moving controls very carefully, trying to increase the coherence

---

### Step 5 — Full resolution

**What they do:** Hit proximity ≥ 0.7 on an entity.

**What happens:**
- Entity appears on the oscilloscope — phosphor green, animated, alive
- Three-note ascending chime plays
- Alert light steadies (stops pulsing)
- LCARS data strips populate: `LIFE FORM IDENTIFIED`, entity name, bio-readings
- The entity breathes, pulses, moves slowly

**What they think:**
- "Oh — it's a life form scanner"
- The whole device suddenly makes sense retroactively
- They feel clever for figuring it out

---

### Step 6 — Further exploration

**What they do:** Try to find more entities.

**What happens:**
- Moving controls away from the current entity causes it to dissolve back into noise
- They search for the next configuration
- Each entity has a different combination — some are adjacent, some require very different settings

**What they think:**
- "How many are there?"
- "Is there a pattern to the controls?"

---

## Edge cases

### Visitor moves controls too fast
- Physics should still feel weighted — momentum continues after they release
- No "wrong" states — every control position is valid, just not all produce entities

### Visitor finds entity immediately (lucky combination)
- Resolution should still feel earned — the partial → full transition takes ~1.5 seconds
- The shimmer tone before full resolution creates anticipation

### Visitor can't find any entity
- No hint system — this is intentional
- The partial resolution shimmer is the only guidance
- Tolerance is set forgivingly enough (~0.2) that casual exploration finds entities within 2–3 minutes

### Audio autoplay blocked by browser
- All sounds are triggered by the first pointer interaction
- No sounds attempt to play before the visitor has touched a control
- Background hum starts on first interaction (not on page load)

### Mobile visitor (out of scope for POC)
- Pointer events handle touch natively — controls will function
- Layout will not be optimised — acceptable for POC
- Note in a future task: mobile layout pass

### Visitor tries to share / screenshot
- No share mechanic in POC
- The URL is shareable as-is
- Future: "entity found" state could be shareable
