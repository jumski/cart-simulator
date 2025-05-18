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
    // Position the track optimally - dashboard is more compact now
    TRACK_Y = Math.min(500, height * 0.5 + 80); // Y position of the track, moved up since dashboard is smaller
    TRACK_START_X = 20; // Track starts closer to the left edge for more horizontal space
    TRACK_END_X = width - 20; // Track extends closer to right edge for more horizontal space
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
  
  // Function has been simplified - only keeping the velocity arrow
  // Graphs have been removed as requested
  
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
  
  // Graph functions removed as requested to keep the visualization clean and focused
  
  // Energy and power visualization functions have been removed
  // Only keeping force vectors and velocity arrow visualization
  // Circular gauges for speed and power are shown in the dashboard

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
    
    // Dashboard dimensions - keep to the left side of the screen, leave room for controls on right
    const DASH_HEIGHT = 150;
    const DASH_WIDTH = width - 420; // Leave space for controls panel
    const DASH_X = 10;
    const DASH_Y = 10;
    
    // Draw dashboard background with a subtle gradient
    const dashGradient = ctx.createLinearGradient(DASH_X, DASH_Y, DASH_X, DASH_Y + DASH_HEIGHT);
    dashGradient.addColorStop(0, 'rgba(240, 240, 245, 0.9)');
    dashGradient.addColorStop(1, 'rgba(230, 230, 240, 0.9)');
    
    ctx.fillStyle = dashGradient;
    ctx.fillRect(DASH_X, DASH_Y, DASH_WIDTH, DASH_HEIGHT);
    
    // Subtle border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(DASH_X, DASH_Y, DASH_WIDTH, DASH_HEIGHT);
    
    // Add small label in corner to identify dashboard
    ctx.fillStyle = '#777777';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'left';
    ctx.fillText('GAUGES', DASH_X + 5, DASH_Y + 12);
    
    // No title - maximizing space
    
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
    
    // Function to draw a more compact linear gauge
    function drawLinearGauge(x: number, y: number, width: number, label: string, value: number, unit: string, minVal: number, maxVal: number, color: string): void {
      if (!ctx) return;
      
      // Compact layout with label and value on the same line
      // Left side label
      ctx.fillStyle = '#000000';
      ctx.font = '11px Roboto';
      ctx.textAlign = 'left';
      ctx.fillText(label, x, y);
      
      // Right side value
      ctx.font = 'bold 11px Roboto';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1) + ' ' + unit, x + width - 5, y);
      
      // Draw gauge background - tighter placement
      const gaugeLength = width - 5;
      const gaugeHeight = 5; // Thinner gauge
      const gaugeX = x;
      const gaugeY2 = y + 7; // Closer to the label
      
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
      ctx.lineWidth = 0.5; // Thinner border
      ctx.strokeRect(gaugeX, gaugeY2, gaugeLength, gaugeHeight);
      
      // More compact min/max values
      ctx.font = '8px Roboto';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText(minVal.toString(), gaugeX, gaugeY2 + gaugeHeight + 7);
      ctx.textAlign = 'right';
      ctx.fillText(maxVal.toString(), gaugeX + gaugeLength, gaugeY2 + gaugeHeight + 7);
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
      
      // Draw gauge background (filled semi-circle)
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, startAngle, endAngle);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw outer circle (gauge track)
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle);
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#eeeeee';
      ctx.stroke();
      
      // Draw inner gradient for 3D effect
      ctx.beginPath();
      ctx.arc(x, y, radius - 6, startAngle, endAngle);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#dddddd';
      ctx.stroke();
      
      // Draw value arc with gradient
      const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, shadeColor(color, -20)); // Darker version for gradient effect
      
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, valueAngle);
      ctx.lineWidth = 12;
      ctx.strokeStyle = gradient;
      ctx.stroke();
      
      // Draw bezel around gauge
      ctx.beginPath();
      ctx.arc(x, y, radius + 10, startAngle, endAngle);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#aaaaaa';
      ctx.stroke();
      
      // Draw center cap
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#333333';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw gauge needle with shadow effect
      // First draw shadow
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2); // Offset for shadow
      ctx.lineTo(x + Math.cos(valueAngle) * radius * 0.95 + 2, y + Math.sin(valueAngle) * radius * 0.95 + 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.stroke();
      
      // Then draw needle
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(valueAngle) * radius * 0.95, y + Math.sin(valueAngle) * radius * 0.95);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#990000';
      ctx.stroke();
      
      // Draw tick marks and numbers
      const numTicks = 10; // More ticks for finer gradation
      
      for (let i = 0; i <= numTicks; i++) {
        const tickAngle = startAngle + (i / numTicks) * totalAngle;
        const tickInnerRadius = i % 2 === 0 ? radius * 0.78 : radius * 0.85; // Major vs minor ticks
        const tickOuterRadius = radius * 1.05;
        const textRadius = radius * 1.2;
        
        // Draw the tick mark
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(tickAngle) * tickInnerRadius, y + Math.sin(tickAngle) * tickInnerRadius);
        ctx.lineTo(x + Math.cos(tickAngle) * tickOuterRadius, y + Math.sin(tickAngle) * tickOuterRadius);
        ctx.lineWidth = i % 2 === 0 ? 2 : 1; // Thicker lines for major ticks
        ctx.strokeStyle = '#333333';
        ctx.stroke();
        
        // Draw tick value for major ticks
        if (i % 2 === 0) {
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
      
      // Draw decorative ring for car-like appearance
      ctx.beginPath();
      ctx.arc(x, y, radius + 7, startAngle - 0.1, endAngle + 0.1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#555555';
      ctx.stroke();
      
      // Draw label in more prominent position
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + radius * 0.6);
      
      // Draw value in a digital display style box
      // Draw box background
      const valueBoxWidth = 80;
      const valueBoxHeight = 30;
      const valueBoxX = x - valueBoxWidth / 2;
      const valueBoxY = y + radius * 0.8;
      
      // Draw box with subtle gradient
      const boxGradient = ctx.createLinearGradient(valueBoxX, valueBoxY, valueBoxX, valueBoxY + valueBoxHeight);
      boxGradient.addColorStop(0, '#f8f8f8');
      boxGradient.addColorStop(1, '#e0e0e0');
      
      ctx.fillStyle = boxGradient;
      ctx.fillRect(valueBoxX, valueBoxY, valueBoxWidth, valueBoxHeight);
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(valueBoxX, valueBoxY, valueBoxWidth, valueBoxHeight);
      
      // Draw value text
      ctx.fillStyle = color;
      ctx.font = 'bold 18px monospace'; // Monospace for digital look
      ctx.fillText(value.toFixed(1) + ' ' + unit, x, valueBoxY + valueBoxHeight/2 + 1);
    }
    
    // Helper function to darken/lighten a color
    function shadeColor(color: string, percent: number): string {
      // Handle CSS variable
      if (color.startsWith('var(')) {
        color = getCssVar(color.slice(4, -1));
      }
      
      let R = parseInt(color.substring(1, 3), 16);
      let G = parseInt(color.substring(3, 5), 16);
      let B = parseInt(color.substring(5, 7), 16);

      R = Math.floor(R * (100 + percent) / 100);
      G = Math.floor(G * (100 + percent) / 100);
      B = Math.floor(B * (100 + percent) / 100);

      R = (R < 255) ? R : 255;  
      G = (G < 255) ? G : 255;  
      B = (B < 255) ? B : 255;  

      const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
      const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
      const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

      return "#" + RR + GG + BB;
    }
    
    // Create a more compact layout
    // Draw circular gauges for speed and power side by side
    const GAUGE_SPACING = DASH_WIDTH / 5;
    const GAUGE_RADIUS = Math.min(DASH_HEIGHT * 0.35, GAUGE_SPACING * 0.8);
    
    // Left side speedometer
    drawCircularGauge(DASH_X + GAUGE_SPACING, DASH_Y + DASH_HEIGHT/2 - 5, 
                       GAUGE_RADIUS, Math.abs(velocity), 0, 15, 
                       "Speed", "m/s", getCssVar('--color-blue'));
    
    // Right side power meter
    drawCircularGauge(DASH_X + GAUGE_SPACING * 2.5, DASH_Y + DASH_HEIGHT/2 - 5, 
                      GAUGE_RADIUS, Math.abs(powerValues.instantW), 0, 300, 
                      "Power", "W", 'orange');
    
    // Draw remaining linear gauges to the right
    const lineGaugeX = DASH_X + GAUGE_SPACING * 4;
    const lineGaugeWidth = DASH_WIDTH - GAUGE_SPACING * 4 - 10;
    
    // Draw different sets of gauges depending on friction state
    const gaugeSpacing = 25; // Vertical spacing between gauges
    const gaugeStartY = DASH_Y + 30;
    
    if (parameters.frictionMu > 0) {
      // When friction is enabled, show all forces
      // Vertical stack of linear gauges on the right side
      drawLinearGauge(lineGaugeX, gaugeStartY, lineGaugeWidth, "Force", forceValues.appliedN, "N", 0, 30, getCssVar('--color-green'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing, lineGaugeWidth, "Friction", Math.abs(forceValues.frictionN), "N", 0, 10, getCssVar('--color-blue'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing * 2, lineGaugeWidth, "Net Force", forceValues.sumN, "N", 0, 30, getCssVar('--color-red'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing * 3, lineGaugeWidth, "Accel.", acceleration, "m/s²", 0, 10, getCssVar('--color-red'));
    } else {
      // When no friction, show fewer gauges
      drawLinearGauge(lineGaugeX, gaugeStartY, lineGaugeWidth, "Force", forceValues.appliedN, "N", 0, 30, getCssVar('--color-green'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing, lineGaugeWidth, "Accel.", acceleration, "m/s²", 0, 10, getCssVar('--color-red'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing * 2, lineGaugeWidth, "Position", position, "m", 0, 10, getCssVar('--color-primary'));
      drawLinearGauge(lineGaugeX, gaugeStartY + gaugeSpacing * 3, lineGaugeWidth, "Energy", energyValues.EkJ, "J", 0, 100, 'purple');
    }
    
    // Time and status removed to save space
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
    // Simplified to focus only on the most important visual elements
    
    // Draw force vectors (from forces mode)
    drawForces();
    
    // Draw velocity arrow (from motion mode) if there's significant velocity
    if (Math.abs(get(vMS)) > 0.01) {
      drawVelocityArrow();
    }
    
    // Graphs have been removed to keep the visualization clean and focused
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