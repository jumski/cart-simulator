<script lang="ts">
  import Scene from './Scene.svelte';
  import ControlPanel from './ControlPanel.svelte';
</script>

<main id="app">
  <div class="controls-bar">
    <ControlPanel />
  </div>
  <div class="scene-container">
    <Scene />
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background);
  }
  
  .controls-bar {
    width: 100%;
    background-color: #f5f5f8;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    z-index: 100;
  }
  
  .scene-container {
    flex: 1;
    width: 100%;
    position: relative;
    overflow: hidden;
  }
</style>