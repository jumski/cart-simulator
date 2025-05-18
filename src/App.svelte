<script lang="ts">
  import Scene from './Scene.svelte';
  import ControlPanel from './ControlPanel.svelte';
</script>

<main id="app">
  <div class="scene-container">
    <Scene />
  </div>
  
  <div class="panel-container">
    <ControlPanel />
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: row;
  }
  
  .scene-container {
    min-height: 600px;
    flex: 7;
    background-color: var(--color-background);
  }
  
  .panel-container {
    flex: 3;
    background-color: var(--color-panel);
  }
  
  @media (max-width: 1024px) {
    main {
      flex-direction: column;
      height: auto;
    }
    
    .scene-container, .panel-container {
      width: 100%;
    }
    
    .scene-container {
      min-height: 400px;
    }
  }
</style>