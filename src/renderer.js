import { drawSprite, drawTile, drawCharacter, drawItem, COLORS } from './sprites.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 32;
    this.canvas.width = 20 * this.tileSize;
    this.canvas.height = 16 * this.tileSize + 48;
    this.frame = 0;
  }

  render(engine) {
    this.frame++;
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const tile = engine.getTile(x, y);
        drawTile(ctx, tile, x * ts, y * ts, ts);
        const isShadow = tile === 1 && (
          (y > 0 && engine.getTile(x, y - 1) === 0) ||
          (x > 0 && engine.getTile(x - 1, y) === 0)
        );
        if (isShadow) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x * ts, y * ts, ts, 4);
        }
      }
    }

    for (const item of engine.items) {
      const bob = Math.sin(this.frame * 0.05 + item.x + item.y) * 2;
      drawItem(ctx, item.type, item.x * ts + 4, item.y * ts + 2 + bob, ts);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.ellipse(item.x * ts + ts / 2, item.y * ts + ts + 4, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      const wobble = Math.sin(this.frame * 0.08 + e.x) * 1;
      drawCharacter(ctx, 'goblin', e.x * ts, e.y * ts + wobble, ts, COLORS.goblin);
      const hpPct = Math.max(0, e.hp / e.maxHp);
      const barW = ts - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(e.x * ts + 2, e.y * ts - 6, barW, 4);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(e.x * ts + 2, e.y * ts - 6, barW * hpPct, 4);
    }

    if (engine.player) {
      const p = engine.player;
      drawCharacter(ctx, 'player', p.x * ts, p.y * ts, ts, COLORS.player);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.ellipse(p.x * ts + ts / 2, p.y * ts + ts + 4, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.renderUI(engine);
  }

  renderUI(engine) {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const uiY = 16 * ts;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, uiY, this.canvas.width, 48);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, uiY, this.canvas.width, 2);

    ctx.font = '13px monospace';

    const hp = engine.player ? engine.player.hp : 0;
    const maxHp = engine.player ? engine.player.maxHp : 10;
    ctx.fillStyle = '#ef4444';
    ctx.fillText('HP', 14, uiY + 30);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, uiY + 17, 120, 18);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(42, uiY + 19, Math.max(0, (hp / maxHp) * 116), 14);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${hp}/${maxHp}`, 80, uiY + 31);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`SCORE ${engine.score}`, 180, uiY + 30);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`LEVEL ${engine.level}`, 300, uiY + 30);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`TURN ${engine.turn}`, 400, uiY + 30);
    ctx.fillStyle = '#86efac';
    ctx.fillText(`ENEMIES ${engine.enemies.filter(e => e.hp > 0).length}`, 490, uiY + 30);

    if (engine.state === 'menu') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(this.canvas.width / 2 - 140, this.canvas.height / 2 - 80, 280, 160);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(this.canvas.width / 2 - 138, this.canvas.height / 2 - 78, 276, 156);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.canvas.width / 2 - 136, this.canvas.height / 2 - 76, 272, 152);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚔ PIXEL DUNGEON', this.canvas.width / 2, this.canvas.height / 2 - 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      ctx.fillText('Arrow Keys / WASD to move', this.canvas.width / 2, this.canvas.height / 2 + 15);
      ctx.fillText('Walk into enemies to attack', this.canvas.width / 2, this.canvas.height / 2 + 38);
      ctx.fillText('Collect items for power-ups', this.canvas.width / 2, this.canvas.height / 2 + 61);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px monospace';
      const blink = Math.floor(this.frame / 20) % 2;
      if (blink) {
        ctx.fillText('PRESS SPACE TO START', this.canvas.width / 2, this.canvas.height / 2 + 100);
      }
      ctx.textAlign = 'left';
    }

    if (engine.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#991b1b';
      ctx.fillRect(this.canvas.width / 2 - 120, this.canvas.height / 2 - 70, 240, 140);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(this.canvas.width / 2 - 118, this.canvas.height / 2 - 68, 236, 136);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.canvas.width / 2 - 116, this.canvas.height / 2 - 66, 232, 132);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 18);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${engine.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.fillText(`Level reached: ${engine.level}`, this.canvas.width / 2, this.canvas.height / 2 + 50);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 15px monospace';
      const blink2 = Math.floor(this.frame / 20) % 2;
      if (blink2) {
        ctx.fillText('PRESS SPACE TO RESTART', this.canvas.width / 2, this.canvas.height / 2 + 85);
      }
      ctx.textAlign = 'left';
    }
  }
}
