# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Important: This project is created specifically for a 13-year-old (7th grade) son with severe ADHD who struggles with physics concepts.** He has difficulty remembering equations and terminology, but understands the underlying concepts when he can focus. This visual simulation aims to help him see and interact with physics principles directly, reducing reliance on memorizing formulas.

This repository contains specifications for a physics simulation interface called "Cart-1D" or "Wózek-1D" (in Polish). The project is an educational tool focused on visualizing 1-dimensional motion of a cart to make abstract physics concepts concrete and interactive.

The interface is designed with two main components:

1. Canvas/Scene (70% of width) - Shows the physical simulation
2. Control Panel (30% of width) - Contains sliders, buttons, and mode selectors

## Tech

Use Svelte, as described in @svelte.md

## Architecture

The core architecture follows a simple state-based pattern:

- `GameState` object contains all simulation parameters and current state
- UI components only read from and write to `GameState` (no direct calculations)
- `render(GameState)` function redraws the entire UI based on current state
- Observer pattern is used for updates: `GameState.subscribe(render)`

### Key Components

1. **GameState** - Core object containing:

   - Parameters: mass, force, friction, angle, duration
   - Simulation status: running, time, mode
   - Physics values: position, velocity, acceleration, forces, energy, power
   - Control methods: start(), pause(), reset(), subscribe()

2. **UI Visualization Modes**:
   - Forces - Shows force vectors (total, applied, friction)
   - Motion - Shows velocity arrow and x-t, v-t, a-t graphs
   - Energy - Shows energy bar charts (kinetic, potential, work)
   - Power - Shows power meter and P-t graph

## Implementation Notes

- The UI does NOT calculate physics - it only reads values from GameState
- All user interactions (sliders, buttons) should directly modify GameState
- Rendering happens at 60fps or when state changes
- Responsive design adjusts at small screen sizes (< 1024px)
- Accessibility requirements include proper focus states and ARIA labels

## Educational Focus

When implementing features, keep in mind:

- Prioritize visual clarity over technical completeness
- Use consistent, bright colors to maintain attention
- Keep text minimal and focused on the physics concepts
- Immediate visual feedback is crucial for maintaining engagement
- Allow interactive exploration to build intuitive understanding rather than rote memorization
- Make connections between different representations (forces→motion→energy) visually obvious
