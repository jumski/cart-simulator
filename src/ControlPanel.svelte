<script lang="ts">
  import { 
    GameState, 
    params, 
    running, 
    timeS 
    // mode removed as visualization modes are now merged
  } from './lib/GameState';
  
  // Friction checkbox state 
  let noFriction: boolean = $params.frictionMu === 0;
  
  // When sliders change, update the GameState
  function updateMass(value: string | number): void {
    GameState.updateParam('massKg', Number(value));
  }
  
  function updateForce(value: string | number): void {
    GameState.updateParam('forceN', Number(value));
  }
  
  function updateFriction(value: string | number): void {
    GameState.updateParam('frictionMu', Number(value));
  }
  
  function updateAngle(value: string | number): void {
    GameState.updateParam('angleDeg', Number(value));
  }
  
  function updateDuration(value: string | number): void {
    GameState.updateParam('durationS', Number(value));
  }
  
  // Toggle friction on/off
  function toggleFriction(checked: boolean): void {
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
    <h2 class="section-title">Physics Controls</h2>
    
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
        on:input={(e) => updateMass(e.currentTarget.value)}
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
        on:input={(e) => updateForce(e.currentTarget.value)}
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
        on:input={(e) => updateFriction(e.currentTarget.value)}
        disabled={noFriction}
        class="slider-root {noFriction ? 'disabled' : ''}"
      />
      
      <!-- No Friction Checkbox -->
      <div class="checkbox-wrapper">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            checked={noFriction}
            on:change={(e) => toggleFriction((e.currentTarget as HTMLInputElement).checked)}
          />
          No friction (μ = 0) — simplified mode
        </label>
      </div>
      
      <!-- Information about what happens with no friction -->
      {#if noFriction}
        <div class="info-note">
          In simplified mode, only applied force is shown
        </div>
      {/if}
    </div>
    
    <!-- Angle is removed, always flat (0°) -->
    
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
        on:input={(e) => updateDuration(e.currentTarget.value)}
        class="slider-root"
      />
    </div>
  </section>

  <!-- Visualization Mode section removed as all elements are now shown in a single comprehensive view -->

  <section class="controls-section">
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
  </section>
</div>

<style>
  .control-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    box-sizing: border-box;
    overflow-y: auto;
  }
  
  section {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-gray);
  }
  
  section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--color-text);
    text-align: center;
  }
  
  
  /* Slider styles */
  .parameter-slider {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  
  .parameter-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    font-size: 12px;
  }
  
  .parameter-value {
    width: 50px;
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
  
  /* Info note style */
  .info-note {
    margin-top: 5px;
    padding: 5px 10px;
    background-color: rgba(0, 200, 0, 0.1);
    border-left: 3px solid var(--color-green);
    font-size: 12px;
    line-height: 1.3;
    border-radius: 2px;
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
    gap: 10px;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  .button-primary {
    width: 100px;
    height: 36px;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    font-size: 14px;
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
    width: 80px;
    height: 36px;
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    border-radius: 4px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .button-secondary:hover {
    background-color: rgba(45, 140, 255, 0.05);
  }
</style>