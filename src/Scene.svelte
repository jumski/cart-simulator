<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GameState, gameStore, type GameStateType } from './lib/GameState';
  
  // Reference to the canvas element
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Keep track of canvas dimensions for responsive design
  let width = 896; // Default from spec (70% of 1280px)
  let height = 720; // Default from spec
  
  // Constants for rendering
  const TRACK_Y = 540; // Y position of the track
  const TRACK_START_X = 0;
  const TRACK_END_X = 800;
  const SCALE_FACTOR = 80; // 1 meter = 80 pixels
  const CART_WIDTH = 120;
  const CART_HEIGHT = 70;
  
  // Store subscription
  let unsubscribe: () => void;
  
  // Handle resize
  function handleResize() {
    if (canvas) {
      // Get actual size of canvas container
      const container = canvas.parentElement;
      if (container) {
        // Set canvas size to match container
        width = container.clientWidth;
        height = container.clientHeight;
        
        // Update canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Re-render after resize
        render(GameState.state);
      }
    }
  }
  
  // Helper to get CSS variable values
  function getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Functions for drawing scene elements
  function drawTrack() {
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(TRACK_START_X, TRACK_Y);
    ctx.lineTo(TRACK_END_X, TRACK_Y);
    ctx.strokeStyle = getCssVar('--color-gray');
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  function drawRamp(angleDeg: number) {
    if (!ctx || angleDeg === 0) return;
    
    // Only draw ramp if angle > 0
    const rampLength = 400; // 0-400px as per spec
    const rampHeight = rampLength * Math.sin(angleDeg * Math.PI / 180);
    
    // Draw ramp
    ctx.beginPath();
    ctx.moveTo(0, TRACK_Y);
    ctx.lineTo(rampLength, TRACK_Y - rampHeight);
    ctx.lineTo(rampLength, TRACK_Y);
    ctx.closePath();
    ctx.fillStyle = getCssVar('--color-ramp');
    ctx.fill();
  }
  
  function drawCart(xM: number) {
    if (!ctx) return;
    
    // Convert meters to pixels
    const xPixels = xM * SCALE_FACTOR;
    
    // Calculate cart position (centered on x)
    const cartX = xPixels - CART_WIDTH / 2;
    const cartY = TRACK_Y - CART_HEIGHT;
    
    // Draw cart body
    ctx.fillStyle = getCssVar('--color-primary');
    ctx.fillRect(cartX, cartY, CART_WIDTH, CART_HEIGHT);
    
    // Draw cart outline
    ctx.strokeStyle = getCssVar('--color-outline');
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX, cartY, CART_WIDTH, CART_HEIGHT);
    
    // Draw wheels
    const wheelRadius = 10;
    ctx.fillStyle = '#000000';
    
    // Left wheel
    ctx.beginPath();
    ctx.arc(cartX + 30, TRACK_Y, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right wheel
    ctx.beginPath();
    ctx.arc(cartX + CART_WIDTH - 30, TRACK_Y, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawScale() {
    if (!ctx) return;
    
    // Draw scale markings every 1m (80px)
    for (let i = 0; i <= 10; i++) {
      const x = i * SCALE_FACTOR;
      
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(x, TRACK_Y + 5);
      ctx.lineTo(x, TRACK_Y + 15);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label every 2m
      if (i % 2 === 0) {
        ctx.fillStyle = '#000000';
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(`${i} m`, x, TRACK_Y + 30);
      }
    }
  }
  
  // Function to draw power visualization with meter and graph
  function drawPower(state: GameStateType) {
    if (!ctx) return;
    
    // Draw digital power display
    drawPowerDigitalDisplay(state);
    
    // Draw analog power meter
    drawPowerMeter(state);
    
    // Draw power-time graph
    drawPowerGraph(state);
  }
  
  // Function to draw digital power display
  function drawPowerDigitalDisplay(state: GameStateType) {
    if (!ctx) return;
    
    // Position of the display
    const x = 100;
    const y = 100;
    
    // Draw display background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, 150, 50);
    ctx.strokeStyle = getCssVar('--color-primary');
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 150, 50);
    
    // Draw power text
    ctx.fillStyle = getCssVar('--color-green');
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P = ${Math.abs(state.power.instantW).toFixed(0)} W`, x + 75, y + 25);
  }
  
  // Function to draw power meter
  function drawPowerMeter(state: GameStateType) {
    if (!ctx) return;
    
    // Meter constants
    const METER_X = 300;
    const METER_Y = 100;
    const METER_RADIUS = 60;
    const MAX_POWER = 300; // Watts
    
    // Calculate power percentage (-1 to 1)
    const powerPercent = Math.max(-1, Math.min(1, state.power.instantW / MAX_POWER));
    
    // Draw meter background
    ctx.beginPath();
    ctx.arc(METER_X, METER_Y, METER_RADIUS, 0, Math.PI, true);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw tick marks and labels
    for (let i = -5; i <= 5; i++) {
      // Angle in radians (-180° to 0°)
      const angle = Math.PI - (i / 5) * Math.PI;
      const innerRadius = METER_RADIUS - 10;
      const outerRadius = METER_RADIUS;
      
      // Calculate tick positions
      const innerX = METER_X + innerRadius * Math.cos(angle);
      const innerY = METER_Y + innerRadius * Math.sin(angle);
      const outerX = METER_X + outerRadius * Math.cos(angle);
      const outerY = METER_Y + outerRadius * Math.sin(angle);
      
      // Draw tick line
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label
      if (i % 2 === 0) {
        const labelX = METER_X + (outerRadius + 15) * Math.cos(angle);
        const labelY = METER_Y + (outerRadius + 15) * Math.sin(angle);
        
        ctx.fillStyle = '#000000';
        ctx.font = '12px Roboto';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.abs(i * MAX_POWER / 5)}W`, labelX, labelY);
      }
    }
    
    // Draw needle
    const needleAngle = Math.PI - powerPercent * Math.PI;
    const needleLength = METER_RADIUS - 10;
    
    ctx.beginPath();
    ctx.moveTo(METER_X, METER_Y);
    ctx.lineTo(
      METER_X + needleLength * Math.cos(needleAngle),
      METER_Y + needleLength * Math.sin(needleAngle)
    );
    ctx.strokeStyle = getCssVar('--color-red');
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw needle pivot
    ctx.beginPath();
    ctx.arc(METER_X, METER_Y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }
  
  // Function to draw power-time graph
  function drawPowerGraph(state: GameStateType) {
    if (!ctx) return;
    
    // Graph dimensions and position
    const GRAPH_WIDTH = 800;
    const GRAPH_HEIGHT = 120;
    const GRAPH_Y = TRACK_Y + 50; // Below the track
    const GRAPH_X = 0;
    
    // Power and time constants
    const MAX_POWER = 300; // Watts
    const POWER_SCALE = GRAPH_HEIGHT / (2 * MAX_POWER); // pixels per Watt
    const MAX_TIME = 10; // seconds to show
    const TIME_SCALE = GRAPH_WIDTH / MAX_TIME; // pixels per second
    
    // Draw graph background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    
    // Draw power axis (horizontal line at middle)
    const Y_AXIS = GRAPH_Y + GRAPH_HEIGHT / 2;
    ctx.beginPath();
    ctx.moveTo(GRAPH_X, Y_AXIS);
    ctx.lineTo(GRAPH_X + GRAPH_WIDTH, Y_AXIS);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw time markers
    for (let t = 0; t <= MAX_TIME; t += 1) {
      const x = GRAPH_X + t * TIME_SCALE;
      
      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, Y_AXIS - 5);
      ctx.lineTo(x, Y_AXIS + 5);
      ctx.strokeStyle = '#888888';
      ctx.stroke();
      
      // Draw label every 2 seconds
      if (t % 2 === 0) {
        ctx.fillStyle = '#333333';
        ctx.font = '12px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(`${t}s`, x, Y_AXIS + 20);
      }
    }
    
    // Draw power labels
    for (let p = -MAX_POWER; p <= MAX_POWER; p += MAX_POWER) {
      const y = Y_AXIS - p * POWER_SCALE;
      
      // Draw tick
      ctx.beginPath();
      ctx.moveTo(GRAPH_X, y);
      ctx.lineTo(GRAPH_X + 10, y);
      ctx.strokeStyle = '#888888';
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#333333';
      ctx.font = '12px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText(`${p}W`, GRAPH_X + 15, y);
    }
    
    // Draw power graph from logged data points
    if (state.power.log.length > 1) {
      ctx.beginPath();
      
      // Start from the first point
      const firstPoint = state.power.log[0];
      ctx.moveTo(
        GRAPH_X + firstPoint.t * TIME_SCALE, 
        Y_AXIS - firstPoint.P * POWER_SCALE
      );
      
      // Connect all points
      for (let i = 1; i < state.power.log.length; i++) {
        const point = state.power.log[i];
        ctx.lineTo(
          GRAPH_X + point.t * TIME_SCALE, 
          Y_AXIS - point.P * POWER_SCALE
        );
      }
      
      ctx.strokeStyle = getCssVar('--color-green');
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  // Function to draw energy visualization
  function drawEnergy(state: GameStateType) {
    if (!ctx) return;
    
    // Constants for bar charts
    const BAR_WIDTH = 60;
    const MAX_HEIGHT = 100; // 100px = 200J
    const ENERGY_SCALE = 0.5; // px per Joule
    const BAR_SPACING = 80;
    
    // Calculate cart center position (for bar placement)
    const cartXPixels = state.xM * SCALE_FACTOR;
    const barY = TRACK_Y - CART_HEIGHT - 20 - MAX_HEIGHT; // Above the cart
    
    // Calculate bar heights (clamped to MAX_HEIGHT)
    const kineticHeight = Math.min(state.energy.EkJ * ENERGY_SCALE, MAX_HEIGHT);
    const potentialHeight = Math.min(state.energy.EpJ * ENERGY_SCALE, MAX_HEIGHT);
    const workHeight = Math.min(state.energy.WJ * ENERGY_SCALE, MAX_HEIGHT);
    
    // Draw kinetic energy bar
    const kineticX = cartXPixels - BAR_SPACING;
    drawEnergyBar(kineticX, barY, BAR_WIDTH, kineticHeight, getCssVar('--color-red'), 'Ek', state.energy.EkJ);
    
    // Draw potential energy bar
    const potentialX = cartXPixels;
    drawEnergyBar(potentialX, barY, BAR_WIDTH, potentialHeight, getCssVar('--color-green'), 'Ep', state.energy.EpJ);
    
    // Draw work bar
    const workX = cartXPixels + BAR_SPACING;
    drawEnergyBar(workX, barY, BAR_WIDTH, workHeight, getCssVar('--color-blue'), 'W', state.energy.WJ);
    
    // Draw scale
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(kineticX - 20, barY + MAX_HEIGHT);
    ctx.lineTo(workX + BAR_WIDTH + 20, barY + MAX_HEIGHT);
    ctx.stroke();
    
    // Draw scale markers
    for (let j = 0; j <= 200; j += 50) {
      const y = barY + MAX_HEIGHT - j * ENERGY_SCALE;
      
      ctx.beginPath();
      ctx.moveTo(kineticX - 5, y);
      ctx.lineTo(kineticX, y);
      ctx.stroke();
      
      ctx.fillStyle = '#000000';
      ctx.font = '12px Roboto';
      ctx.textAlign = 'right';
      ctx.fillText(`${j} J`, kineticX - 8, y + 4);
    }
  }
  
  // Helper function to draw an energy bar
  function drawEnergyBar(x: number, y: number, width: number, height: number, color: string, label: string, value: number) {
    if (!ctx) return;
    
    // Draw bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x, y, width, MAX_HEIGHT);
    
    // Draw the energy bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y + MAX_HEIGHT - height, width, height);
    
    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, MAX_HEIGHT);
    
    // Draw label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 20);
    
    // Draw value
    ctx.fillText(`${value.toFixed(1)} J`, x + width / 2, y - 5);
  }
  
  // Function to draw motion visualization (velocity arrow and graphs)
  function drawMotion(state: GameStateType) {
    if (!ctx) return;
    
    // Draw velocity arrow
    drawVelocityArrow(state);
    
    // Draw motion graphs
    drawMotionGraphs(state);
  }
  
  // Function to draw velocity arrow
  function drawVelocityArrow(state: GameStateType) {
    if (!ctx) return;
    
    // Skip if velocity is very small
    if (Math.abs(state.vMS) < 0.01) return;
    
    // Constants for arrow drawing
    const VELOCITY_SCALE = 15; // pixels per m/s
    const ARROW_HEAD_SIZE = 10;
    
    // Calculate cart center position (for vector origin)
    const cartXPixels = state.xM * SCALE_FACTOR;
    const cartYCenter = TRACK_Y - CART_HEIGHT - 20; // Above the cart
    
    // Calculate arrow dimensions
    const arrowLength = Math.abs(state.vMS) * VELOCITY_SCALE;
    const arrowDirection = Math.sign(state.vMS);
    
    // Start position
    const startX = cartXPixels;
    const startY = cartYCenter;
    
    // End position
    const endX = startX + arrowLength * arrowDirection;
    const endY = startY;
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.strokeStyle = getCssVar('--color-blue');
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY - ARROW_HEAD_SIZE / 2);
    ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY + ARROW_HEAD_SIZE / 2);
    ctx.closePath();
    ctx.fillStyle = getCssVar('--color-blue');
    ctx.fill();
    
    // Draw the label
    ctx.fillStyle = getCssVar('--color-blue');
    ctx.font = 'bold 14px Roboto';
    ctx.textBaseline = 'middle';
    
    if (arrowDirection > 0) {
      ctx.textAlign = 'left';
      ctx.fillText(`v = ${Math.abs(state.vMS).toFixed(1)} m/s`, endX + 5, endY);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(`v = ${Math.abs(state.vMS).toFixed(1)} m/s`, endX - 5, endY);
    }
  }
  
  // Function to draw motion graphs (x-t, v-t, a-t)
  function drawMotionGraphs(state: GameStateType) {
    if (!ctx) return;
    
    // Graph dimensions and position
    const GRAPH_WIDTH = 800;
    const GRAPH_HEIGHT = 120;
    const GRAPH_Y = TRACK_Y + 50; // Below the track
    const GRAPH_X = 0;
    
    // Time constants
    const MAX_TIME = 10; // seconds to show
    const TIME_SCALE = GRAPH_WIDTH / MAX_TIME; // pixels per second
    
    // Draw graph background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    
    // Draw time axis
    const Y_AXIS = GRAPH_Y + GRAPH_HEIGHT / 2;
    ctx.beginPath();
    ctx.moveTo(GRAPH_X, Y_AXIS);
    ctx.lineTo(GRAPH_X + GRAPH_WIDTH, Y_AXIS);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw time markers
    for (let t = 0; t <= MAX_TIME; t += 1) {
      const x = GRAPH_X + t * TIME_SCALE;
      
      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, Y_AXIS - 5);
      ctx.lineTo(x, Y_AXIS + 5);
      ctx.strokeStyle = '#888888';
      ctx.stroke();
      
      // Draw label every 2 seconds
      if (t % 2 === 0) {
        ctx.fillStyle = '#333333';
        ctx.font = '12px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(`${t}s`, x, Y_AXIS + 20);
      }
    }
    
    // Draw position graph (x-t)
    if (state.timeS > 0) {
      const POSITION_SCALE = GRAPH_HEIGHT / 4 / 10; // 10m max range
      
      ctx.beginPath();
      ctx.moveTo(GRAPH_X, Y_AXIS - state.xM * POSITION_SCALE);
      ctx.lineTo(GRAPH_X + state.timeS * TIME_SCALE, Y_AXIS - state.xM * POSITION_SCALE);
      ctx.strokeStyle = getCssVar('--color-green');
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = getCssVar('--color-green');
      ctx.font = '12px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText('x(t)', GRAPH_X + 10, GRAPH_Y + 15);
    }
    
    // Draw velocity graph (v-t)
    if (state.timeS > 0) {
      const VELOCITY_SCALE = GRAPH_HEIGHT / 4 / 5; // 5m/s max range
      
      ctx.beginPath();
      ctx.moveTo(GRAPH_X, Y_AXIS - 0);
      ctx.lineTo(GRAPH_X + state.timeS * TIME_SCALE, Y_AXIS - state.vMS * VELOCITY_SCALE);
      ctx.strokeStyle = getCssVar('--color-blue');
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = getCssVar('--color-blue');
      ctx.font = '12px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText('v(t)', GRAPH_X + 10, GRAPH_Y + 30);
    }
    
    // Draw acceleration graph (a-t)
    if (state.timeS > 0) {
      const ACCELERATION_SCALE = GRAPH_HEIGHT / 4 / 2; // 2m/s² max range
      
      ctx.beginPath();
      ctx.moveTo(GRAPH_X, Y_AXIS - 0);
      ctx.lineTo(GRAPH_X + state.timeS * TIME_SCALE, Y_AXIS - state.aMS2 * ACCELERATION_SCALE);
      ctx.strokeStyle = getCssVar('--color-red');
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = getCssVar('--color-red');
      ctx.font = '12px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText('a(t)', GRAPH_X + 10, GRAPH_Y + 45);
    }
  }
  
  // Function to draw force vectors
  function drawForces(state: GameStateType) {
    if (!ctx) return;
    
    // Constants for vector drawing
    const FORCE_SCALE = 5; // pixels per Newton
    const ARROW_HEAD_SIZE = 10;
    
    // Calculate cart center position (for vector origin)
    const cartXPixels = state.xM * SCALE_FACTOR;
    const cartYCenter = TRACK_Y - CART_HEIGHT / 2;
    
    // Helper function to draw a force vector
    function drawForceVector(force: number, yOffset: number, color: string, label: string) {
      // Skip if force is zero or very small
      if (Math.abs(force) < 0.1) return;
      
      // Calculate arrow dimensions
      const arrowLength = Math.abs(force) * FORCE_SCALE;
      const arrowDirection = Math.sign(force);
      
      // Start position (cart center + offset)
      const startX = cartXPixels;
      const startY = cartYCenter + yOffset;
      
      // End position
      const endX = startX + arrowLength * arrowDirection;
      const endY = startY;
      
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, startY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw the arrow head
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY - ARROW_HEAD_SIZE / 2);
      ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY + ARROW_HEAD_SIZE / 2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw the label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Roboto';
      ctx.textBaseline = 'middle';
      
      if (arrowDirection > 0) {
        ctx.textAlign = 'left';
        ctx.fillText(`${label} = ${force.toFixed(1)} N`, endX + 5, endY);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(`${label} = ${Math.abs(force).toFixed(1)} N`, endX - 5, endY);
      }
    }
    
    // Draw each force vector with vertical spacing
    // Total Force (Sum)
    drawForceVector(state.forces.sumN, -30, getCssVar('--color-red'), 'ΣF');
    
    // Applied Force
    drawForceVector(state.forces.appliedN, 0, getCssVar('--color-green'), 'F');
    
    // Friction Force
    drawForceVector(state.forces.frictionN, 30, getCssVar('--color-blue'), 'F_fr');
  }
  
  // Main render function
  function render(state: GameStateType) {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw static elements
    drawRamp(state.params.angleDeg);
    drawTrack();
    drawScale();
    
    // Draw cart at current position
    drawCart(state.xM);
    
    // Mode-specific rendering
    if (state.mode === 'forces') {
      drawForces(state);
    } else if (state.mode === 'motion') {
      drawMotion(state);
    } else if (state.mode === 'energy') {
      drawEnergy(state);
    } else if (state.mode === 'power') {
      drawPower(state);
    }
  }
  
  onMount(() => {
    // Get canvas context
    ctx = canvas.getContext('2d');
    
    // Initialize canvas size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Subscribe to state changes
    unsubscribe = gameStore.subscribe(render);
    
    // Initial render
    render(GameState.state);
  });
  
  onDestroy(() => {
    // Clean up
    if (unsubscribe) unsubscribe();
    window.removeEventListener('resize', handleResize);
  });
</script>

<div class="scene-wrapper">
  <canvas bind:this={canvas} width={width} height={height}></canvas>
</div>

<style>
  .scene-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
</style>