<script lang="ts">
  import { gameStore } from './lib/GameState';
  import { onMount } from 'svelte';
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