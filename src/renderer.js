import { drawSprite, drawTile, COLORS } from './sprites.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 24;
    this.canvas.width = 20 * this.tileSize;
    this.canvas.height = 16 * this.tileSize + 40;
  }

  render(engine) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        drawTile(ctx, engine.getTile(x, y), x * ts, y * ts, ts);
      }
    }

    for (const item of engine.items) {
      const name = item.type === 'potion' ? 'potion' : item.type === 'gold' ? 'gold' : 'sword';
      drawSprite(ctx, name, item.x * ts + 4, item.y * ts + 4, ts - 8);
    }

    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      drawSprite(ctx, 'goblin', e.x * ts + 2, e.y * ts + 2, ts - 4, COLORS.goblin);
      const hpPct = e.hp / e.maxHp;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x * ts, e.y * ts - 4, ts * hpPct, 3);
    }

    if (engine.player) {
      const p = engine.player;
      drawSprite(ctx, 'player', p.x * ts + 2, p.y * ts + 2, ts - 4, COLORS.player);
    }

    this.renderUI(engine);
  }

  renderUI(engine) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 16 * ts, this.canvas.width, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`HP: ${engine.player ? engine.player.hp : 0}/${engine.player ? engine.player.maxHp : 10}`, 10, 16 * ts + 24);
    ctx.fillText(`Score: ${engine.score}`, 150, 16 * ts + 24);
    ctx.fillText(`Level: ${engine.level}`, 300, 16 * ts + 24);
    ctx.fillText(`Turn: ${engine.turn}`, 400, 16 * ts + 24);
    ctx.fillText(`Enemies: ${engine.enemies.filter(e => e.hp > 0).length}`, 10, 16 * ts + 44);

    if (engine.state === 'menu') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PIXEL DUNGEON', this.canvas.width / 2, this.canvas.height / 2 - 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }

    if (engine.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${engine.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
      ctx.textAlign = 'left';
    }
  }
}
