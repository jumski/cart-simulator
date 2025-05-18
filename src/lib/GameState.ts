import { writable, derived, get, type Writable, type Readable } from 'svelte/store';

// Type definitions for our simulation
export type VisualizationMode = 'forces' | 'motion' | 'energy' | 'power';

export interface PowerPoint {
  t: number; // Time in seconds
  P: number; // Power in Watts
}

export interface Parameters {
  massKg: number;
  forceN: number;
  frictionMu: number;
  angleDeg: number;
  durationS: number;
}

export interface Forces {
  sumN: number;
  appliedN: number;
  frictionN: number;
  gravityParallelN: number;
}

export interface Energy {
  EkJ: number;  // Kinetic energy
  EpJ: number;  // Potential energy
  WJ: number;   // Work done
  lossJ: number; // Energy loss (optional)
}

export interface Power {
  instantW: number;  // Instantaneous power
  log: Array<PowerPoint>; // Power history for the graph
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
    angleDeg: 0, // Always 0, ramp functionality removed
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
export const gameState: Writable<GameStateType> = writable<GameStateType>({...initialState});

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
  // Add debug log to see what's happening
  console.log('Physics step:', { 
    timeS: newState.timeS, 
    xM: newState.xM, 
    vMS: newState.vMS, 
    aMS2: newState.aMS2,
    running: newState.running,
    dt: dt
  });
  const applyForce = newState.timeS <= state.params.durationS;
  
  // Angle is always 0 (flat surface, no ramp)
  const sinAngle = 0; // sin(0) = 0
  const cosAngle = 1; // cos(0) = 1
  
  console.log('Flat surface (no ramp)');
  
  // Applied force (only if within duration)
  newState.forces = { ...state.forces };
  newState.forces.appliedN = applyForce ? state.params.forceN : 0;
  
  // No gravity parallel component (flat surface)
  newState.forces.gravityParallelN = 0;
  
  // Friction force (opposite to motion direction)
  const frictionMagnitude = state.params.frictionMu * state.params.massKg * GRAVITY;
  
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
  
  console.log('Physics calculations:', {
    acceleration: newState.aMS2,
    velocity: newState.vMS,
    position: newState.xM,
    force: newState.forces.sumN,
    mass: state.params.massKg
  });
  
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
  console.log('Animation frame', timestamp);
  gameState.update(state => calculatePhysics(state, SIMULATION_STEP));
  // Request the next frame
  animationFrameId = requestAnimationFrame(animationLoop);
}

// Create derived stores for each property to make them easier to access
export const params: Readable<Parameters> = derived(gameState, $state => $state.params);
export const running: Readable<boolean> = derived(gameState, $state => $state.running);
export const timeS: Readable<number> = derived(gameState, $state => $state.timeS);
export const mode: Readable<VisualizationMode> = derived(gameState, $state => $state.mode);
export const xM: Readable<number> = derived(gameState, $state => $state.xM);
export const vMS: Readable<number> = derived(gameState, $state => $state.vMS);
export const aMS2: Readable<number> = derived(gameState, $state => $state.aMS2);
export const forces: Readable<Forces> = derived(gameState, $state => $state.forces);
export const energy: Readable<Energy> = derived(gameState, $state => $state.energy);
export const power: Readable<Power> = derived(gameState, $state => $state.power);

// Define types for the GameState API
export interface GameStateAPI {
  readonly state: GameStateType;
  updateParam<K extends keyof Parameters>(key: K, value: Parameters[K]): void;
  setMode(newMode: VisualizationMode): void;
  start(): void;
  pause(): void;
  reset(): void;
}

// Public GameState API
export const GameState: GameStateAPI = {
  // Get current state
  get state(): GameStateType {
    return get(gameState);
  },
  
  // Update a parameter
  updateParam<K extends keyof Parameters>(key: K, value: Parameters[K]) {
    gameState.update(state => {
      // Create a new state with the updated parameter
      const newState = {
        ...state,
        params: {
          ...state.params,
          [key]: value
        }
      };
      
      // Recalculate forces even when not running (for preview)
      this.updateForces(newState);
      
      return newState;
    });
  },
  
  // Calculate forces based on parameters (used for preview)
  updateForces(state: GameStateType): void {
    // Angle is always 0 (flat surface, no ramp)
    const sinAngle = 0; // sin(0) = 0
    const cosAngle = 1; // cos(0) = 1
    
    // Force is directly applied (as configured)
    state.forces.appliedN = state.params.forceN;
    
    // No gravity parallel component since angle is always 0
    state.forces.gravityParallelN = 0;
    
    // Friction force on flat surface
    const frictionMagnitude = state.params.frictionMu * state.params.massKg * GRAVITY;
    
    // Static friction (we assume cart is stationary for preview)
    const otherForces = state.forces.appliedN + state.forces.gravityParallelN;
    if (Math.abs(otherForces) < frictionMagnitude) {
      // Forces balanced by static friction
      state.forces.frictionN = -otherForces;
    } else {
      // Max static friction opposite to net force direction
      state.forces.frictionN = -Math.sign(otherForces) * frictionMagnitude;
    }
    
    // Sum of forces
    state.forces.sumN = state.forces.appliedN + state.forces.gravityParallelN + state.forces.frictionN;
    
    // Also update acceleration for preview
    state.aMS2 = state.forces.sumN / state.params.massKg;
  },
  
  // Change visualization mode
  setMode(newMode: VisualizationMode) {
    gameState.update(state => ({ ...state, mode: newMode }));
  },
  
  // Start simulation
  start() {
    console.log('Starting simulation');
    
    // If force is zero, set it to a default value to ensure movement
    const currentState = get(gameState);
    if (currentState.params.forceN === 0 && currentState.params.angleDeg === 0) {
      console.log('Force is zero, setting to default value');
      gameState.update(state => {
        const newState = {
          ...state,
          params: {
            ...state.params,
            forceN: 5.0  // Default force to ensure movement
          }
        };
        
        // Update forces with new parameters
        this.updateForces(newState);
        
        return newState;
      });
    }
    
    // Update state and begin animation
    gameState.update(state => {
      const newState = { ...state, running: true };
      
      // Make sure forces are calculated before animation starts
      this.updateForces(newState);
      
      return newState;
    });
    
    // Start animation loop if not already running
    if (!animationFrameId) {
      console.log('Starting animation loop');
      animationFrameId = requestAnimationFrame(animationLoop);
    } else {
      console.log('Animation loop already running', animationFrameId);
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
    gameState.update(state => {
      const newState = {
        ...initialState,
        params: { ...state.params },
        mode: state.mode
      };
      
      // Make sure forces are calculated for the preview
      this.updateForces(newState);
      
      return newState;
    });
  }
};