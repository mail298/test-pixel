export class Player {
  constructor(engine) {
    this.engine = engine;
  }

  update(input) {
    if (input.consumePress('ArrowUp') || input.consumePress('KeyW')) {
      this.engine.movePlayer(0, -1);
    } else if (input.consumePress('ArrowDown') || input.consumePress('KeyS')) {
      this.engine.movePlayer(0, 1);
    } else if (input.consumePress('ArrowLeft') || input.consumePress('KeyA')) {
      this.engine.movePlayer(-1, 0);
    } else if (input.consumePress('ArrowRight') || input.consumePress('KeyD')) {
      this.engine.movePlayer(1, 0);
    }
  }
}
