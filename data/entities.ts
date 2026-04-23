// Entity definitions — each entity "lives" at a specific control configuration.
// When the user dials in close to these values, the entity resolves from the noise.

export interface EntityTarget {
  freqMod: number;    // 0–1
  resCoeff: number;   // 0–1
  phaseShift: number; // 0–1
  gain: number;       // 0–1
  bandFilter: number; // 0–1
}

export interface EntityRequirements {
  polarity?: 0 | 1;      // must match exactly; undefined = any
  scanMode?: 0 | 1 | 2;  // must match exactly; undefined = any
}

export interface Entity {
  id: string;
  name: string;
  class: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "ANOMALOUS";
  target: EntityTarget;
  // Weights: how much each control matters for this entity's proximity calc.
  // Zero-weight controls are ignored — they don't need to be adjusted.
  weights: EntityTarget;
  // Discrete switch requirements — must all be satisfied to lock in.
  requires?: EntityRequirements;
  // Description shown when fully resolved
  bioReading: string;
}

export const ENTITIES: Entity[] = [
  {
    // COMMON — 2 controls: freqMod + resCoeff
    id: "klingon",
    name: "KLINGON",
    class: "CLASS M · HUMANOID",
    rarity: "COMMON",
    target: { freqMod: 0.2, resCoeff: 0.75, phaseShift: 0.5, gain: 0.5, bandFilter: 0.5 },
    weights: { freqMod: 0.55, resCoeff: 0.45, phaseShift: 0, gain: 0, bandFilter: 0 },
    bioReading: "QoʼnoS-TYPE BIOSIGNATURE — WARRIOR CASTE CONFIRMED",
  },
  {
    // COMMON — 2 controls: phaseShift + gain
    id: "vulcan",
    name: "VULCAN",
    class: "CLASS M · HUMANOID",
    rarity: "COMMON",
    target: { freqMod: 0.5, resCoeff: 0.5, phaseShift: 0.65, gain: 0.85, bandFilter: 0.5 },
    weights: { freqMod: 0, resCoeff: 0, phaseShift: 0.45, gain: 0.55, bandFilter: 0 },
    bioReading: "VULCAN-TYPE SIGNATURE — ELEVATED NEURAL SUPPRESSION FIELD",
  },
  {
    // UNCOMMON — 3 controls: freqMod + resCoeff + phaseShift
    id: "romulan",
    name: "ROMULAN",
    class: "CLASS M · HUMANOID",
    rarity: "UNCOMMON",
    target: { freqMod: 0.8, resCoeff: 0.3, phaseShift: 0.2, gain: 0.5, bandFilter: 0.5 },
    weights: { freqMod: 0.40, resCoeff: 0.35, phaseShift: 0.25, gain: 0, bandFilter: 0 },
    bioReading: "RIHANNSU-TYPE SIGNATURE — CLOAKING RESONANCE DETECTED",
  },
  {
    // UNCOMMON — 3 controls: resCoeff + gain + bandFilter
    id: "ferengi",
    name: "FERENGI",
    class: "CLASS M · HUMANOID",
    rarity: "UNCOMMON",
    target: { freqMod: 0.5, resCoeff: 0.85, phaseShift: 0.5, gain: 0.25, bandFilter: 0.7 },
    weights: { freqMod: 0, resCoeff: 0.40, phaseShift: 0, gain: 0.32, bandFilter: 0.28 },
    bioReading: "FERENGINAR-TYPE SIGNATURE — HEIGHTENED AUDITORY NODES",
  },
  {
    // RARE — all 5 continuous controls + polarity=INV + scanMode=DEEP
    id: "borg",
    name: "BORG",
    class: "CLASS Ω · CYBERNETIC",
    rarity: "RARE",
    target: { freqMod: 0.65, resCoeff: 0.55, phaseShift: 0.1, gain: 0.9, bandFilter: 0.4 },
    weights: { freqMod: 0.22, resCoeff: 0.20, phaseShift: 0.22, gain: 0.20, bandFilter: 0.16 },
    requires: { polarity: 1, scanMode: 2 },
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
    { name: "frequency modulation", dir: state.freqMod      < entity.target.freqMod      ? "higher" : "lower" },
    { name: "resonance coefficient", dir: state.resCoeff    < entity.target.resCoeff     ? "higher" : "lower" },
    { name: "phase shift",           dir: state.phaseShift  < entity.target.phaseShift   ? "higher" : "lower" },
    { name: "gain",                  dir: state.gain        < entity.target.gain         ? "higher" : "lower" },
    { name: "band filter",           dir: state.bandFilter  < entity.target.bandFilter   ? "higher" : "lower" },
  ];
  const gaps = [
    entity.weights.freqMod    * Math.abs(state.freqMod    - entity.target.freqMod),
    entity.weights.resCoeff   * Math.abs(state.resCoeff   - entity.target.resCoeff),
    entity.weights.phaseShift * Math.abs(state.phaseShift - entity.target.phaseShift),
    entity.weights.gain       * Math.abs(state.gain       - entity.target.gain),
    entity.weights.bandFilter * Math.abs(state.bandFilter - entity.target.bandFilter),
  ];
  const maxIdx = gaps.indexOf(Math.max(...gaps));
  return candidates[maxIdx];
}

/**
 * Returns which switch requirement is unmet, if any.
 * Used by Riker to hint obliquely without naming the exact setting.
 */
export type SwitchIssue = "polarity" | "scanMode" | null;

export function getSwitchIssue(state: DeviceState, entity: Entity): SwitchIssue {
  if (!entity.requires) return null;
  if (entity.requires.polarity !== undefined && state.polarity !== entity.requires.polarity) {
    return "polarity";
  }
  if (entity.requires.scanMode !== undefined && state.scanMode !== entity.requires.scanMode) {
    return "scanMode";
  }
  return null;
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
  bandFilter: number;
  polarity: number;   // 0 | 1
  scanMode: number;   // 0 | 1 | 2
}

function proximityTo(state: DeviceState, entity: Entity): number {
  const { target, weights } = entity;
  const totalWeight =
    weights.freqMod + weights.resCoeff + weights.phaseShift + weights.gain + weights.bandFilter;

  const distance =
    weights.freqMod    * Math.abs(state.freqMod    - target.freqMod) +
    weights.resCoeff   * Math.abs(state.resCoeff   - target.resCoeff) +
    weights.phaseShift * Math.abs(state.phaseShift - target.phaseShift) +
    weights.gain       * Math.abs(state.gain       - target.gain) +
    weights.bandFilter * Math.abs(state.bandFilter - target.bandFilter);

  const normalised = 1 - distance / totalWeight;
  const curved = Math.pow(Math.max(0, normalised), 2.5);
  return Math.min(1, curved);
}

function requirementsMet(state: DeviceState, entity: Entity): boolean {
  if (!entity.requires) return true;
  if (entity.requires.polarity !== undefined && state.polarity !== entity.requires.polarity) return false;
  if (entity.requires.scanMode !== undefined && state.scanMode !== entity.requires.scanMode) return false;
  return true;
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

  // Entity only fully resolves if continuous proximity ≥ 0.7 AND all switch
  // requirements are met — otherwise it stays locked below the threshold.
  const locked = bestProx >= 0.7 && requirementsMet(state, best);

  return {
    entity: locked ? best : null,
    proximity: bestProx,
    nearestEntity: best,
    nearestProximity: bestProx,
  };
}
