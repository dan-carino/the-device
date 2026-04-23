// Entity definitions — each entity "lives" at a specific control configuration.
// When the user dials in close to these values, the entity resolves from the noise.

export interface EntityTarget {
  freqMod: number;    // 0–1
  resCoeff: number;   // 0–1
  phaseShift: number; // 0–1
  gain: number;       // 0–1
  // bandFilter and scanMode are not part of the lock-in (they just affect texture)
}

export interface Entity {
  id: string;
  name: string;
  class: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "ANOMALOUS";
  target: EntityTarget;
  // Weights: how much each control matters for this entity's proximity calc
  weights: EntityTarget;
  // Description shown when fully resolved
  bioReading: string;
}

export const ENTITIES: Entity[] = [
  {
    // COMMON — 2 controls: freqMod + resCoeff only
    id: "klingon",
    name: "KLINGON",
    class: "CLASS M · HUMANOID",
    rarity: "COMMON",
    target: { freqMod: 0.2, resCoeff: 0.75, phaseShift: 0.5, gain: 0.5 },
    weights: { freqMod: 0.55, resCoeff: 0.45, phaseShift: 0, gain: 0 },
    bioReading: "QoʼnoS-TYPE BIOSIGNATURE — WARRIOR CASTE CONFIRMED",
  },
  {
    // COMMON — 2 controls: phaseShift + gain only
    id: "vulcan",
    name: "VULCAN",
    class: "CLASS M · HUMANOID",
    rarity: "COMMON",
    target: { freqMod: 0.5, resCoeff: 0.5, phaseShift: 0.65, gain: 0.85 },
    weights: { freqMod: 0, resCoeff: 0, phaseShift: 0.45, gain: 0.55 },
    bioReading: "VULCAN-TYPE SIGNATURE — ELEVATED NEURAL SUPPRESSION FIELD",
  },
  {
    // UNCOMMON — 3 controls: freqMod + resCoeff + phaseShift
    id: "romulan",
    name: "ROMULAN",
    class: "CLASS M · HUMANOID",
    rarity: "UNCOMMON",
    target: { freqMod: 0.8, resCoeff: 0.3, phaseShift: 0.2, gain: 0.5 },
    weights: { freqMod: 0.40, resCoeff: 0.35, phaseShift: 0.25, gain: 0 },
    bioReading: "RIHANNSU-TYPE SIGNATURE — CLOAKING RESONANCE DETECTED",
  },
  {
    // UNCOMMON — 3 controls: resCoeff + phaseShift + gain
    id: "ferengi",
    name: "FERENGI",
    class: "CLASS M · HUMANOID",
    rarity: "UNCOMMON",
    target: { freqMod: 0.5, resCoeff: 0.9, phaseShift: 0.8, gain: 0.25 },
    weights: { freqMod: 0, resCoeff: 0.40, phaseShift: 0.32, gain: 0.28 },
    bioReading: "FERENGINAR-TYPE SIGNATURE — HEIGHTENED AUDITORY NODES",
  },
  {
    // RARE — all 4 controls required
    id: "borg",
    name: "BORG",
    class: "CLASS Ω · CYBERNETIC",
    rarity: "RARE",
    target: { freqMod: 0.65, resCoeff: 0.55, phaseShift: 0.1, gain: 0.9 },
    weights: { freqMod: 0.28, resCoeff: 0.24, phaseShift: 0.26, gain: 0.22 },
    bioReading: "COLLECTIVE NEURAL INTERFACE — RESISTANCE IS FUTILE",
  },
];

export interface GapHint {
  name: string;   // human-readable control name for Riker's dialogue
  dir: "higher" | "lower";
}

/**
 * Returns the single control with the largest weighted distance from the
 * entity's target — i.e. the one that, if adjusted, would gain the most proximity.
 */
export function getBiggestGapHint(state: DeviceState, entity: Entity): GapHint {
  const candidates: GapHint[] = [
    {
      name: "frequency modulation",
      dir: state.freqMod < entity.target.freqMod ? "higher" : "lower",
    },
    {
      name: "resonance coefficient",
      dir: state.resCoeff < entity.target.resCoeff ? "higher" : "lower",
    },
    {
      name: "phase shift",
      dir: state.phaseShift < entity.target.phaseShift ? "higher" : "lower",
    },
    {
      name: "gain",
      dir: state.gain < entity.target.gain ? "higher" : "lower",
    },
  ];
  const gaps = [
    entity.weights.freqMod   * Math.abs(state.freqMod   - entity.target.freqMod),
    entity.weights.resCoeff  * Math.abs(state.resCoeff  - entity.target.resCoeff),
    entity.weights.phaseShift* Math.abs(state.phaseShift- entity.target.phaseShift),
    entity.weights.gain      * Math.abs(state.gain      - entity.target.gain),
  ];
  const maxIdx = gaps.indexOf(Math.max(...gaps));
  return candidates[maxIdx];
}

export interface ResolverResult {
  entity: Entity | null;
  proximity: number; // 0–1, 1 = fully locked in
  nearestEntity: Entity;
  nearestProximity: number;
}

export interface DeviceState {
  freqMod: number;
  resCoeff: number;
  phaseShift: number;
  gain: number;
}

function proximityTo(state: DeviceState, entity: Entity): number {
  const { target, weights } = entity;
  const totalWeight =
    weights.freqMod + weights.resCoeff + weights.phaseShift + weights.gain;

  const distance =
    weights.freqMod * Math.abs(state.freqMod - target.freqMod) +
    weights.resCoeff * Math.abs(state.resCoeff - target.resCoeff) +
    weights.phaseShift * Math.abs(state.phaseShift - target.phaseShift) +
    weights.gain * Math.abs(state.gain - target.gain);

  // Max possible distance is totalWeight * 1.0
  const normalised = 1 - distance / totalWeight;

  // Apply a curve so proximity "jumps" near the target
  // Proximity < 0.5 → stays near 0; proximity > 0.8 → rises sharply
  const curved = Math.pow(Math.max(0, normalised), 2.5);

  return Math.min(1, curved);
}

/**
 * Returns the nearest entity that has NOT yet been catalogued, plus its proximity.
 * Returns null if all entities have been found.
 */
export function getNearestUnfound(
  state: DeviceState,
  foundIds: string[]
): { entity: Entity; proximity: number } | null {
  const unfound = ENTITIES.filter(e => !foundIds.includes(e.id));
  if (unfound.length === 0) return null;

  let best = unfound[0];
  let bestProx = proximityTo(state, unfound[0]);
  for (const entity of unfound.slice(1)) {
    const prox = proximityTo(state, entity);
    if (prox > bestProx) { best = entity; bestProx = prox; }
  }
  return { entity: best, proximity: bestProx };
}

export function resolveEntity(state: DeviceState): ResolverResult {
  let best = ENTITIES[0];
  let bestProx = proximityTo(state, ENTITIES[0]);

  for (const entity of ENTITIES.slice(1)) {
    const prox = proximityTo(state, entity);
    if (prox > bestProx) {
      best = entity;
      bestProx = prox;
    }
  }

  return {
    entity: bestProx >= 0.7 ? best : null,
    proximity: bestProx,
    nearestEntity: best,
    nearestProximity: bestProx,
  };
}
