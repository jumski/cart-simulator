<script>
  import { 
    GameState, 
    params, 
    running, 
    timeS, 
    mode 
  } from './lib/GameState';
  
  // Friction checkbox state 
  let noFriction = $params.frictionMu === 0;
  
  // When sliders change, update the GameState
  function updateMass(value) {
    GameState.updateParam('massKg', Number(value));
  }
  
  function updateForce(value) {
    GameState.updateParam('forceN', Number(value));
  }
  
  function updateFriction(value) {
    GameState.updateParam('frictionMu', Number(value));
  }
  
  function updateAngle(value) {
    GameState.updateParam('angleDeg', Number(value));
  }
  
  function updateDuration(value) {
    GameState.updateParam('durationS', Number(value));
  }
  
  // Toggle friction on/off
  function toggleFriction(checked) {
    noFriction = checked;
    if (noFriction) {
      GameState.updateParam('frictionMu', 0);
    }
  }
  
  // Keep noFriction in sync with frictionMu
  $: noFriction = $params.frictionMu === 0;
</script>

<div class="control-panel">
  <section class="parameters-section">
    <h2 class="section-title">Parameters</h2>
    
    <!-- Mass Slider -->
    <div class="parameter-slider">
      <div class="parameter-label">
        <span>Mass [kg]</span>
        <span class="parameter-value">{$params.massKg.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min="1"
        max="10"
        step="0.1"
        value={$params.massKg}
        on:input={(e) => updateMass(e.target.value)}
        class="slider-root"
      />
    </div>
    
    <!-- Force Slider -->
    <div class="parameter-slider">
      <div class="parameter-label">
        <span>Force [N]</span>
        <span class="parameter-value">{$params.forceN.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min="0"
        max="30"
        step="0.5"
        value={$params.forceN}
        on:input={(e) => updateForce(e.target.value)}
        class="slider-root"
      />
    </div>
    
    <!-- Friction Slider -->
    <div class="parameter-slider">
      <div class="parameter-label">
        <span>Friction μ</span>
        <span class="parameter-value">{$params.frictionMu.toFixed(2)}</span>
      </div>
      <input 
        type="range" 
        min="0"
        max="0.5"
        step="0.01"
        value={$params.frictionMu}
        on:input={(e) => updateFriction(e.target.value)}
        disabled={noFriction}
        class="slider-root {noFriction ? 'disabled' : ''}"
      />
      
      <!-- No Friction Checkbox -->
      <div class="checkbox-wrapper">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            checked={noFriction}
            on:change={(e) => toggleFriction(e.target.checked)}
          />
          No friction (μ = 0)
        </label>
      </div>
    </div>
    
    <!-- Angle Slider -->
    <div class="parameter-slider">
      <div class="parameter-label">
        <span>Ramp [°]</span>
        <span class="parameter-value">{$params.angleDeg.toFixed(0)}</span>
      </div>
      <input 
        type="range" 
        min="0"
        max="30"
        step="1"
        value={$params.angleDeg}
        on:input={(e) => updateAngle(e.target.value)}
        class="slider-root"
      />
    </div>
    
    <!-- Duration Slider -->
    <div class="parameter-slider">
      <div class="parameter-label">
        <span>Duration [s]</span>
        <span class="parameter-value">{$params.durationS.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min="0"
        max="10"
        step="0.1"
        value={$params.durationS}
        on:input={(e) => updateDuration(e.target.value)}
        class="slider-root"
      />
    </div>
  </section>

  <section class="mode-section">
    <h2 class="section-title">Visualization Mode</h2>
    <div class="view-mode-group">
      <!-- Forces Mode -->
      <button 
        class="view-mode-button {$mode === 'forces' ? 'active' : ''}"
        on:click={() => GameState.setMode('forces')}
        aria-pressed={$mode === 'forces'}
        aria-label="Forces visualization mode"
      >
        Forces
      </button>
      
      <!-- Motion Mode -->
      <button 
        class="view-mode-button {$mode === 'motion' ? 'active' : ''}"
        on:click={() => GameState.setMode('motion')}
        aria-pressed={$mode === 'motion'}
        aria-label="Motion visualization mode"
      >
        Motion
      </button>
      
      <!-- Energy Mode -->
      <button 
        class="view-mode-button {$mode === 'energy' ? 'active' : ''}"
        on:click={() => GameState.setMode('energy')}
        aria-pressed={$mode === 'energy'}
        aria-label="Energy visualization mode"
      >
        Energy
      </button>
      
      <!-- Power Mode -->
      <button 
        class="view-mode-button {$mode === 'power' ? 'active' : ''}"
        on:click={() => GameState.setMode('power')}
        aria-pressed={$mode === 'power'}
        aria-label="Power visualization mode"
      >
        Power
      </button>
    </div>
  </section>

  <section class="controls-section">
    <h2 class="section-title">Controls</h2>
    
    <div class="controls-group">
      <!-- Start/Pause Button -->
      <button 
        class="button-primary {$running ? 'paused' : ''}"
        on:click={() => $running ? GameState.pause() : GameState.start()}
        aria-label={$running ? 'Pause simulation' : 'Start simulation'}
      >
        {$running ? 'PAUSE' : 'START'}
      </button>
      
      <!-- Reset Button -->
      <button 
        class="button-secondary"
        on:click={() => GameState.reset()}
        aria-label="Reset simulation"
      >
        RESET
      </button>
    </div>
    
    <!-- Timer Display -->
    <div class="timer-display">
      Time: <span class="timer-value">{$timeS.toFixed(1)} s</span>
    </div>
  </section>
</div>

<style>
  .control-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-sizing: border-box;
    overflow-y: auto;
  }
  
  section {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-gray);
  }
  
  section:last-child {
    border-bottom: none;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-text);
  }
  
  .placeholder-content {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .placeholder-content p {
    margin: 0.5rem 0;
  }
  
  /* Slider styles */
  .parameter-slider {
    width: 100%;
    margin-bottom: 1.5rem;
  }
  
  .parameter-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 14px;
  }
  
  .parameter-value {
    width: 60px;
    text-align: right;
    font-weight: bold;
  }
  
  .slider-root {
    width: 100%;
    height: 20px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  .slider-root::-webkit-slider-runnable-track {
    background-color: rgba(0, 0, 0, 0.1);
    height: 4px;
    border-radius: 2px;
  }
  
  .slider-root::-moz-range-track {
    background-color: rgba(0, 0, 0, 0.1);
    height: 4px;
    border-radius: 2px;
  }
  
  .slider-root::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background-color: white;
    border: 2px solid var(--color-primary);
    border-radius: 50%;
    margin-top: -6px;
  }
  
  .slider-root::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background-color: white;
    border: 2px solid var(--color-primary);
    border-radius: 50%;
  }
  
  .slider-root:focus {
    outline: none;
  }
  
  .slider-root:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(45, 140, 255, 0.2);
  }
  
  .slider-root:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(45, 140, 255, 0.2);
  }
  
  .slider-root.disabled {
    opacity: 0.5;
  }
  
  /* Checkbox styles */
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .checkbox-container input {
    accent-color: var(--color-primary);
  }
  
  /* View mode styles */
  .view-mode-group {
    display: flex;
    flex-direction: row;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  
  .view-mode-button {
    width: 80px;
    height: 32px;
    border: 1px solid var(--color-primary);
    background-color: transparent;
    color: var(--color-primary);
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .view-mode-button:hover {
    background-color: rgba(45, 140, 255, 0.1);
  }
  
  .view-mode-button.active {
    background-color: var(--color-primary);
    color: white;
  }
  
  /* Controls styles */
  .controls-group {
    display: flex;
    gap: 20px;
    margin-bottom: 1.5rem;
  }
  
  .button-primary {
    width: 160px;
    height: 48px;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .button-primary:hover {
    opacity: 0.9;
  }
  
  .button-primary.paused {
    background-color: var(--color-red);
  }
  
  .button-secondary {
    width: 120px;
    height: 48px;
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    border-radius: 4px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .button-secondary:hover {
    background-color: rgba(45, 140, 255, 0.05);
  }
  
  .timer-display {
    margin-top: 1rem;
    font-size: 16px;
  }
  
  .timer-value {
    font-weight: 700;
    color: var(--color-primary);
  }
</style>