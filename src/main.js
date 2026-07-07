import { Engine } from './engine.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Player } from './player.js';

const canvas = document.getElementById('game');
const engine = new Engine();
const renderer = new Renderer(canvas);
const input = new Input();
const playerCtrl = new Player(engine);

function gameLoop() {
  if (engine.state === 'menu') {
    if (input.consumePress('Space')) {
      engine.start();
    }
  } else if (engine.state === 'gameover') {
    if (input.consumePress('Space')) {
      engine.start();
    }
  } else {
    playerCtrl.update(input);
  }
  input.clearPresses();
  renderer.render(engine);
  requestAnimationFrame(gameLoop);
}

gameLoop();
