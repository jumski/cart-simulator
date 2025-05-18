import { writable, derived, get } from 'svelte/store';

// Type definitions for our simulation
export type VisualizationMode = 'forces' | 'motion' | 'energy' | 'power';

interface Parameters {
  massKg: number;
  forceN: number;
  frictionMu: number;
  angleDeg: number;
  durationS: number;
}

interface Forces {
  sumN: number;
  appliedN: number;
  frictionN: number;
  gravityParallelN: number;
}

interface Energy {
  EkJ: number;  // Kinetic energy
  EpJ: number;  // Potential energy
  WJ: number;   // Work done
  lossJ: number; // Energy loss (optional)
}

interface Power {
  instantW: number;  // Instantaneous power
  log: Array<{t: number, P: number}>; // Power history for the graph
}

export interface GameStateType {
  // Controllable parameters
  params: Parameters;
  
  // Simulation status
  running: boolean;
  timeS: number;
  mode: VisualizationMode;
  
  // Physics values (read-only for UI)
  xM: number;     // Position in meters
  vMS: number;    // Velocity in meters/second
  aMS2: number;   // Acceleration in meters/second²
  forces: Forces;
  energy: Energy;
  power: Power;
}

// Physics constants
const GRAVITY = 9.81; // m/s²
const SIMULATION_STEP = 1/60; // 60 fps in seconds

// Initial state
const initialState: GameStateType = {
  params: {
    massKg: 2.0,
    forceN: 5.0,
    frictionMu: 0.0,
    angleDeg: 0,
    durationS: 3.0
  },
  running: false,
  timeS: 0.0,
  mode: 'forces',
  xM: 0.0,
  vMS: 0.0,
  aMS2: 0.0,
  forces: {
    sumN: 0.0,
    appliedN: 0.0,
    frictionN: 0.0,
    gravityParallelN: 0.0
  },
  energy: {
    EkJ: 0.0,
    EpJ: 0.0,
    WJ: 0.0,
    lossJ: 0.0
  },
  power: {
    instantW: 0.0,
    log: []
  }
};

// Create the main game state store
export const gameState = writable<GameStateType>({...initialState});

// Animation frame control
let animationFrameId: number | null = null;

// Calculate physics for a given time step
function calculatePhysics(state: GameStateType, dt: number): GameStateType {
  if (!state.running) return state;
  
  // Create a new state object to avoid mutating the original
  const newState = { ...state };
  
  // Update time
  newState.timeS += dt;
  
  // Check if force should still be applied
  const applyForce = newState.timeS <= state.params.durationS;
  
  // Calculate forces
  const sinAngle = Math.sin(state.params.angleDeg * Math.PI / 180);
  const cosAngle = Math.cos(state.params.angleDeg * Math.PI / 180);
  
  // Applied force (only if within duration)
  newState.forces = { ...state.forces };
  newState.forces.appliedN = applyForce ? state.params.forceN : 0;
  
  // Gravity parallel component (down the ramp)
  newState.forces.gravityParallelN = state.params.massKg * GRAVITY * sinAngle;
  
  // Friction force (opposite to motion direction)
  const frictionMagnitude = state.params.frictionMu * state.params.massKg * GRAVITY * cosAngle;
  
  // Friction is opposite to motion direction, or zero if not moving
  if (Math.abs(state.vMS) < 0.001) {
    // Static case - friction balances other forces up to maximum static friction
    const otherForces = newState.forces.appliedN + newState.forces.gravityParallelN;
    newState.forces.frictionN = Math.min(frictionMagnitude, Math.abs(otherForces)) * (otherForces > 0 ? -1 : 1);
  } else {
    // Dynamic case - friction opposes motion
    newState.forces.frictionN = -Math.sign(state.vMS) * frictionMagnitude;
  }
  
  // Sum of forces
  newState.forces.sumN = newState.forces.appliedN + newState.forces.gravityParallelN + newState.forces.frictionN;
  
  // Calculate acceleration (F = ma)
  newState.aMS2 = newState.forces.sumN / state.params.massKg;
  
  // Update velocity (v = v0 + a*t)
  newState.vMS = state.vMS + newState.aMS2 * dt;
  
  // Update position (x = x0 + v*t + 0.5*a*t^2)
  newState.xM = state.xM + newState.vMS * dt + 0.5 * newState.aMS2 * dt * dt;
  
  // Calculate energy values
  newState.energy = { ...state.energy };
  
  // Kinetic energy: Ek = 0.5 * m * v^2
  newState.energy.EkJ = 0.5 * state.params.massKg * Math.pow(newState.vMS, 2);
  
  // Potential energy: Ep = m * g * h  (where h = x * sin(angle) for a ramp)
  const height = newState.xM * sinAngle;
  newState.energy.EpJ = state.params.massKg * GRAVITY * height;
  
  // Work done by applied force: W = F * d
  const distanceTraveled = newState.xM - state.xM;
  if (applyForce && distanceTraveled > 0) {
    newState.energy.WJ += newState.forces.appliedN * distanceTraveled;
  }
  
  // Update power
  newState.power = { ...state.power };
  
  // Instantaneous power: P = F * v
  newState.power.instantW = newState.forces.appliedN * newState.vMS;
  
  // Log power for graph (sample every 0.1s)
  newState.power.log = [...state.power.log];
  if (newState.timeS % 0.1 < dt) {
    newState.power.log.push({ t: newState.timeS, P: newState.power.instantW });
  }
  
  return newState;
}

// Animation loop
function animationLoop(timestamp: number) {
  gameState.update(state => calculatePhysics(state, SIMULATION_STEP));
  animationFrameId = requestAnimationFrame(animationLoop);
}

// Create derived stores for each property to make them easier to access
export const params = derived(gameState, $state => $state.params);
export const running = derived(gameState, $state => $state.running);
export const timeS = derived(gameState, $state => $state.timeS);
export const mode = derived(gameState, $state => $state.mode);
export const xM = derived(gameState, $state => $state.xM);
export const vMS = derived(gameState, $state => $state.vMS);
export const aMS2 = derived(gameState, $state => $state.aMS2);
export const forces = derived(gameState, $state => $state.forces);
export const energy = derived(gameState, $state => $state.energy);
export const power = derived(gameState, $state => $state.power);

// Public GameState API
export const GameState = {
  // Get current state
  get state(): GameStateType {
    return get(gameState);
  },
  
  // Update a parameter
  updateParam<K extends keyof Parameters>(key: K, value: Parameters[K]) {
    gameState.update(state => ({
      ...state,
      params: {
        ...state.params,
        [key]: value
      }
    }));
  },
  
  // Change visualization mode
  setMode(newMode: VisualizationMode) {
    gameState.update(state => ({ ...state, mode: newMode }));
  },
  
  // Start simulation
  start() {
    gameState.update(state => ({ ...state, running: true }));
    
    // Start animation loop if not already running
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(animationLoop);
    }
  },
  
  // Pause simulation
  pause() {
    gameState.update(state => ({ ...state, running: false }));
    
    // Stop animation loop
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  },
  
  // Reset simulation
  reset() {
    // Stop animation if running
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Reset to initial state but keep current parameters and mode
    gameState.update(state => ({
      ...initialState,
      params: { ...state.params },
      mode: state.mode
    }));
  }
};