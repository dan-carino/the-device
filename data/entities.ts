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
    id: "neural-lattice",
    name: "NEURAL LATTICE FORM",
    class: "CLASS IV",
    rarity: "COMMON",
    target: { freqMod: 0.2, resCoeff: 0.7, phaseShift: 0.5, gain: 0.6 },
    weights: { freqMod: 0.35, resCoeff: 0.30, phaseShift: 0.15, gain: 0.20 },
    bioReading: "CARBON-BASED NEURAL NET — ELECTROSYNTHETIC",
  },
  {
    id: "radial-filament",
    name: "RADIAL FILAMENT ENTITY",
    class: "CLASS II",
    rarity: "UNCOMMON",
    target: { freqMod: 0.8, resCoeff: 0.3, phaseShift: 0.2, gain: 0.4 },
    weights: { freqMod: 0.40, resCoeff: 0.25, phaseShift: 0.20, gain: 0.15 },
    bioReading: "RADIOGENIC FILAMENT CLUSTER — NON-CORPOREAL",
  },
  {
    id: "crystalline-mass",
    name: "CRYSTALLINE MASS",
    class: "CLASS VII",
    rarity: "UNCOMMON",
    target: { freqMod: 0.5, resCoeff: 0.9, phaseShift: 0.8, gain: 0.3 },
    weights: { freqMod: 0.20, resCoeff: 0.40, phaseShift: 0.25, gain: 0.15 },
    bioReading: "SILICON-LATTICE STRUCTURE — QUASI-SENTIENT",
  },
  {
    id: "fluid-membrane",
    name: "FLUID MEMBRANE FORM",
    class: "CLASS I",
    rarity: "COMMON",
    target: { freqMod: 0.35, resCoeff: 0.15, phaseShift: 0.65, gain: 0.85 },
    weights: { freqMod: 0.25, resCoeff: 0.20, phaseShift: 0.30, gain: 0.25 },
    bioReading: "PLASMA-BASED MEMBRANE — SELF-REPLICATING",
  },
  {
    id: "wave-collapse",
    name: "WAVE COLLAPSE PATTERN",
    class: "CLASS IX",
    rarity: "RARE",
    target: { freqMod: 0.65, resCoeff: 0.55, phaseShift: 0.1, gain: 0.9 },
    weights: { freqMod: 0.30, resCoeff: 0.25, phaseShift: 0.30, gain: 0.15 },
    bioReading: "QUANTUM-COHERENT WAVE STATE — ANOMALOUS",
  },
];

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
