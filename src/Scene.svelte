  // Function to draw the physics gauges
  function drawPhysicsGauges(): void {
    if (!ctx) return;
    
    // Get all the values from stores
    const parameters = get(params);
    const acceleration = get(aMS2);
    const velocity = get(vMS);
    const position = get(xM);
    const forceValues = get(forces);
    const energyValues = get(energy);
    const powerValues = get(power);
    
    // Draw gauges background
    const gaugeGradient = ctx.createLinearGradient(GAUGES_X, GAUGES_Y, GAUGES_X, GAUGES_Y + GAUGES_HEIGHT);
    gaugeGradient.addColorStop(0, 'rgba(250, 250, 255, 0.7)');
    gaugeGradient.addColorStop(1, 'rgba(240, 240, 250, 0.7)');
    
    ctx.fillStyle = gaugeGradient;
    ctx.fillRect(GAUGES_X, GAUGES_Y, GAUGES_WIDTH, GAUGES_HEIGHT);
    
    // Subtle border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(GAUGES_X, GAUGES_Y, GAUGES_WIDTH, GAUGES_HEIGHT);
    
    // Draw circular gauges for speed and power
    const GAUGE_RADIUS = Math.min(GAUGES_HEIGHT * 0.38, GAUGES_WIDTH * 0.25);
    
    // Speed gauge on the left
    drawCircularGauge(
      GAUGES_X + GAUGES_WIDTH * 0.25, 
      GAUGES_Y + GAUGES_HEIGHT/2, 
      GAUGE_RADIUS, 
      Math.abs(velocity), 0, 15, 
      "Speed", "m/s", getCssVar('--color-blue')
    );
    
    // Power gauge on the right
    drawCircularGauge(
      GAUGES_X + GAUGES_WIDTH * 0.75, 
      GAUGES_Y + GAUGES_HEIGHT/2, 
      GAUGE_RADIUS, 
      Math.abs(powerValues.instantW), 0, 300, 
      "Power", "W", 'orange'
    );
  }