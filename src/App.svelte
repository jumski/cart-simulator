<script lang="ts">
  import Scene from './Scene.svelte';
  import ControlPanel from './ControlPanel.svelte';
</script>

<main id="app">
  <div class="main-container">
    <div class="top-panel">
      <div class="controls-area">
        <ControlPanel />
      </div>
    </div>
    
    <div class="scene-container">
      <Scene />
    </div>
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .main-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .top-panel {
    width: 100%;
    background-color: var(--color-panel);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    max-height: 180px;
  }
  
  .controls-area {
    width: 400px; /* Fixed width for controls */
    min-width: 350px;
    background-color: var(--color-panel);
  }
  
  .scene-container {
    flex: 1;
    min-height: 500px;
    width: 100%;
    background-color: var(--color-background);
  }
  
  @media (max-width: 1024px) {
    .top-panel {
      flex-direction: column;
      max-height: none;
    }
    
    .controls-area {
      width: 100%;
    }
    
    .scene-container {
      min-height: 400px;
    }
  }
</style>