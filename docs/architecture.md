# Pixel Dungeon - Game Architecture

## Overview
A simple pixel-art dungeon crawler built with HTML5 Canvas.
Single-player, keyboard-controlled, with procedurally generated levels.

## Tech Stack
- HTML5 Canvas API (rendering)
- Vanilla JavaScript (no frameworks)
- Vite (build tool)

## Architecture

```
index.html          → Entry point
src/
  main.js           → Game initialization & loop
  engine.js         → Core game engine (update/render cycle)
  renderer.js       → Canvas rendering pipeline
  sprites.js        → Pixel art sprite definitions
  input.js          → Keyboard input handler
  level.js          → Level generation & management
  player.js         → Player entity & physics
```

## Data Flow
1. `main.js` initializes Engine, Renderer, Input
2. Game loop: Input → Engine.update() → Renderer.draw()
3. Engine manages game state, entities, collisions
4. Renderer reads state and draws to Canvas

## Entity System
- Player: position, health, score, inventory
- Enemies: position, health, AI behavior
- Items: type, position, effects
- Tiles: wall, floor, door, treasure
