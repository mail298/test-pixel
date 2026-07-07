# Pixel Dungeon

A simple pixel-art dungeon crawler built with HTML5 Canvas.

## How to Play

- Arrow keys / WASD to move
- Walk into enemies to attack
- Collect potions (❤️), gold (💰), and swords (⚔️)
- Clear all enemies to advance to the next level
- Survive as long as you can!

## Run

```bash
npx serve .
```

Open http://localhost:3000

## Project Structure

```
├── index.html          Entry point
├── package.json        Build config
├── src/
│   ├── main.js         Game initialization & loop
│   ├── engine.js       Core game engine
│   ├── renderer.js     Canvas rendering
│   ├── sprites.js      Pixel art sprite definitions
│   ├── input.js        Keyboard input handler
│   ├── player.js       Player controller
├── docs/
│   └── architecture.md Game architecture
├── server/
│   └── deploy.js       Deployment server
```

## Stack

- HTML5 Canvas API
- Vanilla JavaScript (ES Modules)
- No frameworks
