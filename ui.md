# Bits UI for Cart-1D

This document provides an overview of how we'll use Bits UI to implement the Cart-1D physics simulator interface.

## Documentation Links

Main documentation: https://bits-ui.com/llms.txt

Component-specific documentation:
- Checkbox: https://bits-ui.com/docs/components/checkbox/llms.txt
- Slider: https://bits-ui.com/docs/components/slider/llms.txt
- RadioGroup: https://bits-ui.com/docs/components/radio-group/llms.txt
- Button: https://bits-ui.com/docs/components/button/llms.txt

## Overview

Bits UI is a headless component library for Svelte focusing on:
- Accessibility
- Flexibility
- Developer experience
- TypeScript support

It follows a "bring your own styles" approach with minimal built-in styling.

## Installation

```bash
npm install bits-ui
```

## Component Structure and Implementation Plan

### 1. Slider Components for Parameters

We'll use Slider for all five parameter controls:
- Mass [kg]: 1-10 (step 0.1)
- Force [N]: 0-30 (step 0.5)
- Friction μ: 0-0.5 (step 0.01)
- Ramp [°]: 0-30 (step 1)
- Duration [s]: 0-10 (step 0.1)

Implementation example:
```svelte
<Slider.Root 
  type="single" 
  bind:value={GameState.params.massKg} 
  min={1} 
  max={10}
  step={0.1}
  class="w-[260px]"
>
  <Slider.Range class="h-2 bg-primary" />
  <Slider.Thumb class="h-5 w-5 rounded-full bg-white border-2 border-primary" />
</Slider.Root>
```

### 2. RadioGroup for Visualization Modes

We'll use RadioGroup for the four visualization modes:
- Forces
- Motion
- Energy
- Power

Implementation example:
```svelte
<RadioGroup.Root bind:value={GameState.mode} orientation="horizontal">
  <RadioGroup.Item value="forces" class="radio-item">Forces</RadioGroup.Item>
  <RadioGroup.Item value="motion" class="radio-item">Motion</RadioGroup.Item>
  <RadioGroup.Item value="energy" class="radio-item">Energy</RadioGroup.Item>
  <RadioGroup.Item value="power" class="radio-item">Power</RadioGroup.Item>
</RadioGroup.Root>
```

### 3. Checkbox for "No Friction"

We'll use Checkbox for the "No friction" toggle:

Implementation example:
```svelte
<Checkbox.Root 
  bind:checked={noFriction}
  on:change={() => {
    if (noFriction) {
      GameState.updateParam('frictionMu', 0);
    }
  }}
>
  {#snippet children({ checked })}
    <div class="checkbox-outer">
      {#if checked}
        <div class="checkbox-inner"></div>
      {/if}
    </div>
    <span>No friction (μ = 0)</span>
  {/snippet}
</Checkbox.Root>
```

### 4. Button for Controls

We'll use Button for the Start/Pause and Reset controls:

Implementation example:
```svelte
<Button.Root 
  on:click={() => GameState.running ? GameState.pause() : GameState.start()}
  class="w-[160px] h-[48px] {GameState.running ? 'bg-red' : 'bg-primary'}"
>
  {GameState.running ? 'PAUSE' : 'START'}
</Button.Root>

<Button.Root 
  on:click={() => GameState.reset()}
  class="w-[120px] h-[48px] border-2 border-primary text-primary"
>
  RESET
</Button.Root>
```

## Styling Approach

We'll use a combination of:

1. **Direct classes**: Apply classes directly to components
2. **Data attributes**: Style components using CSS selectors for data attributes
3. **CSS variables**: Define colors and sizes in a central location

Our color scheme will be:
- Primary: #2D8CFF
- Red: #E53935
- Green: #43A047
- Blue: #1E88E5
- Gray: #9E9E9E
- Background: #F4F4F4
- Text: #333333

## Accessibility Features

Bits UI provides built-in accessibility features:
- Keyboard navigation
- Screen reader support
- WAI-ARIA compliance
- Focus states

We'll enhance these with:
- Clear, visible focus outlines
- ARIA labels for controls
- High-contrast colors following WCAG AA guidelines