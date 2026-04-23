# MASTER PLAN — The Device

## What it is

A mysterious piece of Starfleet-era hardware. A control panel with 6–8 physical controls — rotary dials, sliders, toggle switches, one button. No instructions. No labels that explain what it does. The visitor manipulates the controls and figures it out.

**The secret:** It's a life form scanner. The controls tune detection parameters. Static noise on the readout display gradually resolves into a living alien entity as the visitor finds the right configuration. The moment of first resolution is the reveal — and it happens through play, not explanation.

## Who it's for

Hiring managers opening the Playground section of Dan's portfolio. The experience is the signal — it demonstrates:
- Dan builds things that feel physically real in a browser
- Dan thinks in interaction and discovery, not just screens
- Dan has the technical range to build physics, generative art, and audio in one piece

## What done looks like (POC)

- [ ] LCARS-aesthetic panel: deep black background, amber/orange/blue colour strips, Okuda grid layout
- [ ] 6–8 controls with correct physics: weighted dial rotation, slider glide, switch snap, button press
- [ ] Oscilloscope/readout display with noise state
- [ ] At least 5 discoverable entity archetypes that resolve from noise when correct control combinations are hit
- [ ] Smooth noise → partial resolution → full entity transition
- [ ] Characteristic LCARS interaction sounds on control input
- [ ] Deployed to Vercel (POC URL)

## Emotional brief

```
VIBE: Starfleet engineering console — you're operating hardware aboard a Federation vessel.
      Purposeful. Technical. Alive with amber light in the dark.

REFERENCES:
  - TNG LCARS panels — the Okuda grid, warm amber/orange on black, rounded corner pieces
  - Enterprise-D ops consoles — physical controls alongside illuminated touchpanels
  - The tricorder readout — data resolving from noise, alien life signatures
  - HAL 9000 — quiet menace of a machine that knows more than you do

DESIGN SYSTEM:
  - Colors: #000000 (void black), #FF9900 (LCARS amber), #CC6600 (LCARS dark orange),
            #9999FF (LCARS blue), #CC99CC (LCARS lavender), #FF0000 (alert red)
  - Typography: condensed all-caps sans-serif (Swiss 911 Ultra Compressed or Helvetica Neue Condensed Bold)
  - Controls: illuminated bezels, warm amber glow, rounded profiles — not matte industrial metal
  - Display: dark readout screen, amber/blue waveform, LCARS data strips flanking the main view
  - Sound: characteristic LCARS bloops and beeps on interaction

USER GOAL: figure out what the device does — and find as many life forms as possible.
```

## Core interaction loop

1. Visitor arrives → sees a dark panel alive with amber glow
2. Starts manipulating controls — no instruction, pure curiosity
3. Oscilloscope shows chaotic noise
4. As controls approach a valid configuration, noise begins to organise — something is there
5. Entity resolves fully — it pulses, it's alive
6. Visitor understands: this is a life form scanner
7. Tries other configurations — discovers more entities

## What this is NOT (non-goals for POC)

- No instructions, tooltips, or onboarding
- No entity codex or catalogue UI (full build only)
- No aggregate data / "others found X" reveal (full build only)
- No mobile optimisation (desktop POC first)
- No multi-session persistence (full build only)
- Not a game with a score or win state
- Not a tutorial or educational tool
