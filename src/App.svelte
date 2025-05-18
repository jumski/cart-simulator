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