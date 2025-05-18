<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { 
    GameState, 
    xM, 
    vMS, 
    aMS2, 
    params, 
    forces, 
    energy,
    power,
    timeS,
    running
    // mode not needed anymore since all visualizations are shown together
  } from './lib/GameState';
  
  // Reference to the canvas element
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  
  // Keep track of canvas dimensions for responsive design
  let width = 896; // Default from spec (70% of 1280px)
  let height = 720; // Default from spec
  
  // Constants for rendering - these will be calculated based on canvas dimensions
  let TRACK_Y: number;  // Y position of the track
  let TRACK_START_X: number; // Start position of track
  let TRACK_END_X: number; // End position of track
  
  // Update position constants based on canvas size
  function updatePositionConstants() {
    // Push the track down further to make room for the larger dashboard (170px from dashboard bottom)
    TRACK_Y = Math.min(550, height * 0.65 + 180); // Y position of the track
    TRACK_START_X = 50; // Start track 50px from left edge for better visibility
    TRACK_END_X = width - 50; // End track 50px from right edge
    console.log('Updated track positions:', { TRACK_Y, TRACK_START_X, TRACK_END_X, width, height });
  }
  
  // Initialize the constants
  updatePositionConstants();
  const SCALE_FACTOR = 80; // 1 meter = 80 pixels
  const CART_WIDTH = 120;
  const CART_HEIGHT = 70;
  const MAX_HEIGHT = 100; // Used for energy bars
  
  // Helper to get CSS variable values
  function getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Handle resize
  function handleResize(): void {
    if (canvas) {
      // Get actual size of canvas container
      const container = canvas.parentElement;
      if (container) {
        console.log('Container dimensions:', {
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight,
          offsetWidth: container.offsetWidth,
          offsetHeight: container.offsetHeight
        });
        
        // Set canvas size to match container, with minimum dimensions
        width = Math.max(container.clientWidth, 800);
        height = Math.max(container.clientHeight, 600);
        
        // Update canvas dimensions explicitly
        canvas.width = width;
        canvas.height = height;
        console.log('Updated canvas dimensions:', { width, height });
        
        // Update track positioning based on new canvas dimensions
        updatePositionConstants();
        
        // Re-render
        render();
      } else {
        console.error('Container not found');
      }
    } else {
      console.error('Canvas element not initialized');
    }
  }

  // Functions for drawing scene elements
  function drawTrack(): void {
    if (!ctx) return;
    
    console.log('Drawing track', { TRACK_START_X, TRACK_END_X, TRACK_Y });
    
    // Draw track line
    ctx.beginPath();
    ctx.moveTo(TRACK_START_X, TRACK_Y);
    ctx.lineTo(TRACK_END_X, TRACK_Y);
    ctx.strokeStyle = getCssVar('--color-gray');
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // For debugging, add a marker at the track start and end
    ctx.fillStyle = 'red';
    ctx.fillRect(TRACK_START_X - 5, TRACK_Y - 5, 10, 10);
    ctx.fillStyle = 'blue';
    ctx.fillRect(TRACK_END_X - 5, TRACK_Y - 5, 10, 10);
  }
  
  // No ramp drawing function - always flat surface
  
  function drawCart(positionM: number): void {
    if (!ctx) return;
    
    console.log('Drawing cart at position:', positionM);
    
    // Convert meters to pixels - add 100px offset from start to ensure cart is visible
    let xPixels;
    
    if (positionM === 0) {
      // When position is 0, put cart at a starting position near the left of track
      xPixels = TRACK_START_X + 100;
    } else {
      // Otherwise, convert meters to pixels with an offset to ensure it's visible
      xPixels = TRACK_START_X + 100 + positionM * SCALE_FACTOR;
    }
    
    // Calculate the min and max positions
    const minX = TRACK_START_X + 100;  // Start position with 100px offset 
    const maxX = TRACK_END_X - (CART_WIDTH / 2);  // End position
    
    // Limit cart to track edges
    xPixels = Math.max(minX, Math.min(xPixels, maxX));
    
    // Calculate cart position (centered on x)
    const cartX = xPixels - CART_WIDTH / 2;
    const cartY = TRACK_Y - CART_HEIGHT;
    
    console.log('Cart dimensions:', { cartX, cartY, width: CART_WIDTH, height: CART_HEIGHT });
    
    // Draw a very visually distinctive cart that's easy to see
    // Create gradient for cart body for better visual appearance
    const gradient = ctx.createLinearGradient(cartX, cartY, cartX, cartY + CART_HEIGHT);
    gradient.addColorStop(0, 'rgba(255, 50, 50, 1)');  // Bright red
    gradient.addColorStop(1, 'rgba(180, 30, 30, 1)');  // Darker red
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(cartX, cartY, CART_WIDTH, CART_HEIGHT);
    
    // Draw cart outline
    ctx.strokeStyle = 'black';
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
  
  function drawScale(): void {
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
  
  // Function to draw force vectors
  function drawForces(): void {
    if (!ctx) return;
    
    // Constants for vector drawing - much larger scale for better visibility
    const FORCE_SCALE = 25; // pixels per Newton (increased from 15)
    const ARROW_HEAD_SIZE = 15; // larger arrow head
    const MIN_ARROW_LENGTH = 60; // minimum length for better visibility of small forces
    
    // Calculate cart position (center of the cart)
    const cartXPixels = TRACK_START_X + 100 + get(xM) * SCALE_FACTOR;
    const cartCenterX = cartXPixels;
    const vectorOriginY = TRACK_Y - CART_HEIGHT - 80; // 80px above the cart for better visibility
    
    // Helper function to draw a force vector
    function drawForceVector(force: number, yOffset: number, color: string, label: string): void {
      if (!ctx || force === 0) return;
      
      // Calculate arrow dimensions
      let arrowLength = Math.abs(force) * FORCE_SCALE;
      
      // For very small forces, ensure they are still visible with minimum length
      if (arrowLength < MIN_ARROW_LENGTH && arrowLength > 0) {
        arrowLength = MIN_ARROW_LENGTH;
      }
      
      const arrowDirection = Math.sign(force);
      
      // Start position (above cart center + offset)
      const startX = cartCenterX;
      const startY = vectorOriginY + yOffset;
      
      // End position
      const endX = startX + arrowLength * arrowDirection;
      const endY = startY;
      
      // Draw the line - thicker for better visibility
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, startY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4; // even thicker line
      ctx.stroke();
      
      // Draw the arrow head - larger for better visibility
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY - ARROW_HEAD_SIZE / 2);
      ctx.lineTo(endX - ARROW_HEAD_SIZE * arrowDirection, endY + ARROW_HEAD_SIZE / 2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw the label
      ctx.fillStyle = color;
      ctx.font = 'bold 18px Roboto'; // even larger font
      ctx.textBaseline = 'middle';
      
      // Simplified value display for better understanding
      let valueText = "";
      if (Math.abs(force) < 0.5) {
        // For very small forces, just say "small" instead of tiny numbers
        valueText = "small";
      } else {
        // Otherwise round to 1 decimal place for clarity
        valueText = Math.abs(force).toFixed(1) + " N";
        
        // Add direction text for better understanding
        if (arrowDirection > 0) {
          valueText += " →";
        } else {
          valueText = "← " + valueText;
        }
      }
      
      // Position the text for better readability
      if (arrowDirection > 0) {
        ctx.textAlign = 'left';
        ctx.fillText(`${label}: ${valueText}`, endX + 15, endY);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(`${label}: ${valueText}`, endX - 15, endY);
      }
    }
    
    // Draw each force vector with spacing
    const forceValues = get(forces);
    const parameters = get(params);
    
    // Draw force vectors vertically centered, with clear spacing
    // Applied Force (top)
    drawForceVector(forceValues.appliedN, -40, getCssVar('--color-green'), 'Force');
    
    // Only show friction if friction coefficient is non-zero
    if (parameters.frictionMu > 0) {
      // Friction Force (middle)
      drawForceVector(forceValues.frictionN, 0, getCssVar('--color-blue'), 'Friction');
      
      // Total Force (bottom) - only show when friction exists (otherwise it's same as applied force)
      drawForceVector(forceValues.sumN, 40, getCssVar('--color-red'), 'Net Force');
    }
  }
  
  // Function to draw motion visualization (velocity arrow and graphs)
  function drawMotion(): void {
    if (!ctx) return;
    
    // Draw velocity arrow
    drawVelocityArrow();
    
    // Draw motion graphs
    drawMotionGraphs();
  }
  
  // Function to draw velocity arrow
  function drawVelocityArrow(): void {
    if (!ctx) return;
    
    // Get current velocity and position from stores
    const velocity = get(vMS);
    const position = get(xM);
    
    // Skip if velocity is very small
    if (Math.abs(velocity) < 0.01) return;
    
    // Constants for arrow drawing
    const VELOCITY_SCALE = 15; // pixels per m/s
    const ARROW_HEAD_SIZE = 10;
    
    // Calculate cart center position (for vector origin)
    const cartXPixels = position * SCALE_FACTOR;
    const cartYCenter = TRACK_Y - CART_HEIGHT - 20; // Above the cart
    
    // Calculate arrow dimensions
    const arrowLength = Math.abs(velocity) * VELOCITY_SCALE;
    const arrowDirection = Math.sign(velocity);
    
    // Start position
    const startX = cartXPixels;
    const startY = cartYCenter;
    
    // End position
    const endX = startX + arrowLength * arrowDirection;
    const endY = startY;
    
    // Draw the line
    if (ctx) {
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
        ctx.fillText(`v = ${Math.abs(velocity).toFixed(1)} m/s`, endX + 5, endY);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(`v = ${Math.abs(velocity).toFixed(1)} m/s`, endX - 5, endY);
      }
    }
  }
  
  // Function to draw a simplified, smaller motion graph
  function drawSimplifiedMotionGraph(): void {
    if (!ctx) return;
    
    // Graph dimensions and position - more compact
    const GRAPH_WIDTH = 400;
    const GRAPH_HEIGHT = 100;
    const GRAPH_Y = TRACK_Y + 50; // Below the track
    const GRAPH_X = width / 2 - GRAPH_WIDTH / 2; // Centered horizontally
    
    // Time constants
    const MAX_TIME = 5; // seconds to show (reduced for better visibility)
    const TIME_SCALE = GRAPH_WIDTH / MAX_TIME; // pixels per second
    
    // Create a reference that TypeScript knows is non-null
    const context = ctx!;
    
    // Draw graph background
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.strokeRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    
    // Graph title
    context.fillStyle = '#000000';
    context.font = 'bold 14px Roboto';
    context.textAlign = 'center';
    context.fillText('Motion Graph', GRAPH_X + GRAPH_WIDTH/2, GRAPH_Y - 5);
    
    // Draw time axis
    const Y_AXIS = GRAPH_Y + GRAPH_HEIGHT / 2;
    context.beginPath();
    context.moveTo(GRAPH_X, Y_AXIS);
    context.lineTo(GRAPH_X + GRAPH_WIDTH, Y_AXIS);
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    context.stroke();
    
    // Draw time markers
    for (let t = 0; t <= MAX_TIME; t += 1) {
      const x = GRAPH_X + t * TIME_SCALE;
      
      // Draw tick
      context.beginPath();
      context.moveTo(x, Y_AXIS - 5);
      context.lineTo(x, Y_AXIS + 5);
      context.strokeStyle = '#888888';
      context.stroke();
      
      // Draw all time labels
      context.fillStyle = '#333333';
      context.font = '10px Roboto';
      context.textAlign = 'center';
      context.fillText(`${t}s`, x, Y_AXIS + 15);
    }
    
    // Get current values
    const time = get(timeS);
    const position = get(xM);
    const velocity = get(vMS);
    const acceleration = get(aMS2);
    
    // Skip if simulation hasn't started yet
    if (time <= 0) return;
    
    // Draw all three graphs simultaneously, with a legend
    // Calculate scales
    const POSITION_SCALE = GRAPH_HEIGHT / 3 / 10; // 10m max range
    const VELOCITY_SCALE = GRAPH_HEIGHT / 3 / 5; // 5m/s max range
    const ACCELERATION_SCALE = GRAPH_HEIGHT / 3 / 2; // 2m/s² max range
    
    // Draw position graph (x-t)
    context.beginPath();
    context.moveTo(GRAPH_X, Y_AXIS - position * POSITION_SCALE);
    context.lineTo(GRAPH_X + time * TIME_SCALE, Y_AXIS - position * POSITION_SCALE);
    context.strokeStyle = getCssVar('--color-green');
    context.lineWidth = 2;
    context.stroke();
    
    // Draw velocity graph (v-t)
    context.beginPath();
    context.moveTo(GRAPH_X, Y_AXIS - 0);
    context.lineTo(GRAPH_X + time * TIME_SCALE, Y_AXIS - velocity * VELOCITY_SCALE);
    context.strokeStyle = getCssVar('--color-blue');
    context.lineWidth = 2;
    context.stroke();
    
    // Draw acceleration graph (a-t)
    context.beginPath();
    context.moveTo(GRAPH_X, Y_AXIS - 0);
    context.lineTo(GRAPH_X + time * TIME_SCALE, Y_AXIS - acceleration * ACCELERATION_SCALE);
    context.strokeStyle = getCssVar('--color-red');
    context.lineWidth = 2;
    context.stroke();
    
    // Draw legend
    const legendX = GRAPH_X + 10;
    const legendY = GRAPH_Y + 20;
    const legendSpacing = 25;
    
    // Position legend item
    context.strokeStyle = getCssVar('--color-green');
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(legendX, legendY);
    context.lineTo(legendX + 20, legendY);
    context.stroke();
    context.fillStyle = getCssVar('--color-green');
    context.font = '12px Roboto';
    context.textAlign = 'left';
    context.fillText('Position', legendX + 25, legendY + 4);
    
    // Velocity legend item
    context.strokeStyle = getCssVar('--color-blue');
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(legendX, legendY + legendSpacing);
    context.lineTo(legendX + 20, legendY + legendSpacing);
    context.stroke();
    context.fillStyle = getCssVar('--color-blue');
    context.font = '12px Roboto';
    context.textAlign = 'left';
    context.fillText('Velocity', legendX + 25, legendY + legendSpacing + 4);
    
    // Acceleration legend item
    context.strokeStyle = getCssVar('--color-red');
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(legendX, legendY + 2 * legendSpacing);
    context.lineTo(legendX + 20, legendY + 2 * legendSpacing);
    context.stroke();
    context.fillStyle = getCssVar('--color-red');
    context.font = '12px Roboto';
    context.textAlign = 'left';
    context.fillText('Acceleration', legendX + 25, legendY + 2 * legendSpacing + 4);
  }
  
  // Function to draw energy visualization
  function drawEnergy(): void {
    if (!ctx) return;
    
    // Constants for bar charts
    const BAR_WIDTH = 60;
    const MAX_HEIGHT = 100; // 100px = 200J
    const ENERGY_SCALE = 0.5; // px per Joule
    const BAR_SPACING = 80;
    
    // Get energy values from store
    const position = get(xM);
    const energyValues = get(energy);
    
    // Calculate cart center position (for bar placement)
    const cartXPixels = position * SCALE_FACTOR;
    const barY = TRACK_Y - CART_HEIGHT - 20 - MAX_HEIGHT; // Above the cart
    
    // Calculate bar heights (clamped to MAX_HEIGHT)
    const kineticHeight = Math.min(energyValues.EkJ * ENERGY_SCALE, MAX_HEIGHT);
    const potentialHeight = Math.min(energyValues.EpJ * ENERGY_SCALE, MAX_HEIGHT);
    const workHeight = Math.min(energyValues.WJ * ENERGY_SCALE, MAX_HEIGHT);
    
    // Draw kinetic energy bar
    const kineticX = cartXPixels - BAR_SPACING;
    drawEnergyBar(kineticX, barY, BAR_WIDTH, kineticHeight, getCssVar('--color-red'), 'Ek', energyValues.EkJ);
    
    // Draw potential energy bar
    const potentialX = cartXPixels;
    drawEnergyBar(potentialX, barY, BAR_WIDTH, potentialHeight, getCssVar('--color-green'), 'Ep', energyValues.EpJ);
    
    // Draw work bar
    const workX = cartXPixels + BAR_SPACING;
    drawEnergyBar(workX, barY, BAR_WIDTH, workHeight, getCssVar('--color-blue'), 'W', energyValues.WJ);
    
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
  function drawEnergyBar(x: number, y: number, width: number, height: number, color: string, label: string, value: number): void {
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
  
  // Function to draw power visualization with meter and graph
  function drawPower(): void {
    if (!ctx) return;
    
    // Draw digital power display
    drawPowerDigitalDisplay();
    
    // Draw analog power meter
    drawPowerMeter();
    
    // Draw power-time graph
    drawPowerGraph();
  }
  
  // Function to draw digital power display
  function drawPowerDigitalDisplay(): void {
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
    
    // Get power values from store
    const powerValues = get(power);
    
    // Draw power text
    ctx.fillStyle = getCssVar('--color-green');
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P = ${Math.abs(powerValues.instantW).toFixed(0)} W`, x + 75, y + 25);
  }
  
  // Function to draw power meter
  function drawPowerMeter(): void {
    if (!ctx) return;
    
    // Meter constants
    const METER_X = 300;
    const METER_Y = 100;
    const METER_RADIUS = 60;
    const MAX_POWER = 300; // Watts
    
    // Get power values from store
    const powerValues = get(power);
    
    // Calculate power percentage (-1 to 1)
    const powerPercent = Math.max(-1, Math.min(1, powerValues.instantW / MAX_POWER));
    
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
  function drawPowerGraph(): void {
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
    
    // Get power values from store
    const powerValues = get(power);
    
    // Draw power graph from logged data points
    if (powerValues.log.length > 1) {
      ctx.beginPath();
      
      // Start from the first point
      const firstPoint = powerValues.log[0];
      ctx.moveTo(
        GRAPH_X + firstPoint.t * TIME_SCALE, 
        Y_AXIS - firstPoint.P * POWER_SCALE
      );
      
      // Connect all points
      for (let i = 1; i < powerValues.log.length; i++) {
        const point = powerValues.log[i];
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

  // Force preview function removed as requested

  // Function to draw the physics dashboard at the top of the screen
  function drawPhysicsDashboard(): void {
    if (!ctx) return;
    
    // Get all the values from stores
    const parameters = get(params);
    const acceleration = get(aMS2);
    const velocity = get(vMS);
    const position = get(xM);
    const forceValues = get(forces);
    const energyValues = get(energy);
    const powerValues = get(power);
    const time = get(timeS);
    
    // Dashboard dimensions - increase height for circular gauges
    const DASH_HEIGHT = 150;
    const DASH_WIDTH = width - 20; // 10px margin on each side
    const DASH_X = 10;
    const DASH_Y = 10;
    
    // Draw dashboard background
    ctx.fillStyle = 'rgba(245, 245, 250, 0.9)';
    ctx.fillRect(DASH_X, DASH_Y, DASH_WIDTH, DASH_HEIGHT);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(DASH_X, DASH_Y, DASH_WIDTH, DASH_HEIGHT);
    
    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('PHYSICS DASHBOARD', DASH_X + DASH_WIDTH/2, DASH_Y + 15);
    
    // Draw subtitle
    ctx.font = '12px Roboto';
    ctx.fillText('Speed and power are shown as car-style gauges', DASH_X + DASH_WIDTH/2, DASH_Y + 32);
    
    // Draw separator line
    ctx.beginPath();
    ctx.moveTo(DASH_X, DASH_Y + 25);
    ctx.lineTo(DASH_X + DASH_WIDTH, DASH_Y + 25);
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();
    
    // Calculate positions for gauges and values
    const numGauges = 6;
    const gaugeWidth = DASH_WIDTH / numGauges;
    const gaugeY = DASH_Y + 45;
    
    // Function to draw a linear gauge with a value
    function drawLinearGauge(x: number, y: number, width: number, label: string, value: number, unit: string, minVal: number, maxVal: number, color: string): void {
      if (!ctx) return;
      
      // Draw label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText(label, x, y);
      
      // Draw value
      ctx.font = 'bold 14px Roboto';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(2) + ' ' + unit, x + width * 0.95, y);
      
      // Draw gauge background
      const gaugeLength = width * 0.9;
      const gaugeHeight = 6;
      const gaugeX = x;
      const gaugeY2 = y + 10;
      
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(gaugeX, gaugeY2, gaugeLength, gaugeHeight);
      
      // Calculate fill width based on value
      const normalizedValue = (value - minVal) / (maxVal - minVal);
      const fillWidth = Math.max(0, Math.min(1, normalizedValue)) * gaugeLength;
      
      // Draw gauge fill
      ctx.fillStyle = color;
      ctx.fillRect(gaugeX, gaugeY2, fillWidth, gaugeHeight);
      
      // Draw gauge border
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1;
      ctx.strokeRect(gaugeX, gaugeY2, gaugeLength, gaugeHeight);
      
      // Draw min/max values
      ctx.font = '9px Roboto';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText(minVal.toString(), gaugeX, gaugeY2 + gaugeHeight + 10);
      ctx.textAlign = 'right';
      ctx.fillText(maxVal.toString(), gaugeX + gaugeLength, gaugeY2 + gaugeHeight + 10);
    }
    
    // Function to draw a circular car-style gauge
    function drawCircularGauge(x: number, y: number, radius: number, value: number, minVal: number, maxVal: number, label: string, unit: string, color: string): void {
      if (!ctx) return;
      
      // Angles for the gauge arc (from -135 to +135 degrees, converted to radians)
      const startAngle = -135 * Math.PI / 180;
      const endAngle = 135 * Math.PI / 180;
      const totalAngle = endAngle - startAngle;
      
      // Calculate value angle
      const normalizedValue = Math.min(1, Math.max(0, (value - minVal) / (maxVal - minVal)));
      const valueAngle = startAngle + normalizedValue * totalAngle;
      
      // Draw outer circle (gauge background)
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#eeeeee';
      ctx.stroke();
      
      // Draw value arc
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, valueAngle);
      ctx.lineWidth = 12;
      ctx.strokeStyle = color;
      ctx.stroke();
      
      // Draw center cap
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#333333';
      ctx.fill();
      
      // Draw gauge needle
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(valueAngle) * radius * 0.95, y + Math.sin(valueAngle) * radius * 0.95);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#990000';
      ctx.stroke();
      
      // Draw tick marks and numbers
      const numTicks = 6; // 6 segments for 5 tick marks
      
      for (let i = 0; i <= numTicks; i++) {
        const tickAngle = startAngle + (i / numTicks) * totalAngle;
        const tickInnerRadius = radius * 0.8;
        const tickOuterRadius = radius * 1.05;
        const textRadius = radius * 1.2;
        
        // Draw the tick mark
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(tickAngle) * tickInnerRadius, y + Math.sin(tickAngle) * tickInnerRadius);
        ctx.lineTo(x + Math.cos(tickAngle) * tickOuterRadius, y + Math.sin(tickAngle) * tickOuterRadius);
        ctx.lineWidth = i % (numTicks/2) === 0 ? 3 : 1; // Thicker lines for major ticks
        ctx.strokeStyle = '#333333';
        ctx.stroke();
        
        // Draw tick value for major ticks
        if (i % (numTicks/2) === 0) {
          const tickValue = minVal + (i / numTicks) * (maxVal - minVal);
          ctx.fillStyle = '#333333';
          ctx.font = 'bold 12px Roboto';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            tickValue.toString(), 
            x + Math.cos(tickAngle) * textRadius, 
            y + Math.sin(tickAngle) * textRadius
          );
        }
      }
      
      // Draw label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + radius * 0.65);
      
      // Draw value
      ctx.fillStyle = color;
      ctx.font = 'bold 18px Roboto';
      ctx.fillText(value.toFixed(1) + ' ' + unit, x, y + radius * 0.85);
    }
    
    // First create a layout with the circular gauges for speed and power
    // Draw circular gauges for speed and power
    const DASH_THIRD = DASH_WIDTH / 3;
    
    // Draw speedometer on the left side
    drawCircularGauge(DASH_X + DASH_THIRD * 0.5, DASH_Y + DASH_HEIGHT/2, 
                       DASH_HEIGHT * 0.4, Math.abs(velocity), 0, 15, 
                       "Speed", "m/s", getCssVar('--color-blue'));
    
    // Draw power meter on the right side
    drawCircularGauge(DASH_X + DASH_WIDTH - DASH_THIRD * 0.5, DASH_Y + DASH_HEIGHT/2, 
                      DASH_HEIGHT * 0.4, Math.abs(powerValues.instantW), 0, 300, 
                      "Power", "W", 'orange');
    
    // Draw remaining linear gauges in the middle section
    const middleX = DASH_X + DASH_THIRD;
    const middleWidth = DASH_THIRD;
    
    // Draw different sets of gauges depending on friction state
    if (parameters.frictionMu > 0) {
      // When friction is enabled, show all forces
      // Linear gauges in the middle section
      drawLinearGauge(middleX, DASH_Y + 30, middleWidth, "Applied Force", forceValues.appliedN, "N", 0, 30, getCssVar('--color-green'));
      drawLinearGauge(middleX, DASH_Y + 50, middleWidth, "Friction", Math.abs(forceValues.frictionN), "N", 0, 10, getCssVar('--color-blue'));
      drawLinearGauge(middleX, DASH_Y + 70, middleWidth, "Net Force", forceValues.sumN, "N", 0, 30, getCssVar('--color-red')); 
    } else {
      // When no friction, show fewer gauges
      // Linear gauges in the middle section
      drawLinearGauge(middleX, DASH_Y + 30, middleWidth, "Force", forceValues.appliedN, "N", 0, 30, getCssVar('--color-green'));
      drawLinearGauge(middleX, DASH_Y + 50, middleWidth, "Acceleration", acceleration, "m/s²", 0, 10, getCssVar('--color-red'));
      drawLinearGauge(middleX, DASH_Y + 70, middleWidth, "Position", position, "m", 0, 10, getCssVar('--color-primary'));
    }
    
    // Draw simulation time 
    ctx.font = '12px Roboto';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.fillText(`Time: ${time.toFixed(2)} s`, DASH_X + DASH_WIDTH - 10, DASH_Y + 75);
    
    // Draw simulation status
    const isRunning = get(running);
    ctx.textAlign = 'left';
    ctx.fillStyle = isRunning ? getCssVar('--color-green') : getCssVar('--color-red');
    ctx.fillText(`Status: ${isRunning ? 'Running' : 'Paused'}`, DASH_X + 10, DASH_Y + 75);
  }
  
  // Main render function
  function render(): void {
    if (!ctx) return;
    
    // Debug log to track render calls
    // Use get() to access store values without $ syntax
    const isRunning = get(running);
    const position = get(xM);
    const parameters = get(params);
    
    console.log('Rendering scene:', { 
      position, 
      width, 
      height, 
      parameters,
      isRunning
    });
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw physics dashboard at the top
    drawPhysicsDashboard();
    
    // Draw static elements (no ramp, always flat)
    drawTrack();
    drawScale();
    
    // Draw cart at current position
    drawCart(get(xM));
    
    // Draw all visualization elements in one comprehensive view
    // Priority to forces visualization, then other elements that don't conflict
    
    // Draw force vectors (from forces mode)
    drawForces();
    
    // Draw velocity arrow (from motion mode) if there's significant velocity
    if (Math.abs(get(vMS)) > 0.01) {
      drawVelocityArrow();
    }
    
    // Draw small motion graph below the track
    drawSimplifiedMotionGraph();
    
    // Force preview has been removed
  }
  
  onMount(() => {
    // Get canvas context
    ctx = canvas.getContext('2d');
    console.log('Canvas context initialized:', ctx);
    
    // Force explicit canvas size
    canvas.width = width;
    canvas.height = height;
    console.log('Canvas dimensions set:', { width, height });
    
    // Initialize canvas size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Ensure forces are calculated even before simulation starts
    // This makes the dashboard and preview show accurate values immediately
    GameState.updateForces(GameState.state);
    
    // Initial render - force a render immediately after mount
    setTimeout(() => {
      console.log('Forcing initial render');
      render();
    }, 100);
  });
  
  onDestroy(() => {
    // Clean up
    window.removeEventListener('resize', handleResize);
  });
  
  // Watch for changes in state to trigger render
  $: {
    if (ctx) {
      render();
    }
  }
  
  // Explicitly watch all store values to trigger render when they change
  $: if (ctx) {
    // We still need to use the $ syntax here to trigger reactivity
    // The $ syntax in a reactive statement is a Svelte-specific feature
    const _xM = $xM;
    const _vMS = $vMS;
    const _aMS2 = $aMS2;
    const _params = $params;
    const _forces = $forces;
    const _energy = $energy;
    const _power = $power;
    // _mode removed as we merged all visualization modes
    const _timeS = $timeS;
    const _running = $running;
    
    // Only log major changes to reduce console spam
    if (Math.abs(_xM) > 0.01 || Math.abs(_vMS) > 0.01) {
      console.log('State update detected', { 
        position: _xM, 
        velocity: _vMS, 
        acceleration: _aMS2, 
        running: _running 
      });
    }
    
    render();
  }
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
    background-color: var(--color-background);
    border: 1px solid #ccc;
  }
  
  canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    background-color: white;
  }
</style>