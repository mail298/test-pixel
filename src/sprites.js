export const COLORS = {
  player: ['#3b82f6', '#1d4ed8', '#93c5fd'],
  wall: ['#4a4a4a', '#2d2d2d', '#666666'],
  floor: ['#2a2a2a', '#333333', '#3a3a3a'],
  goblin: ['#22c55e', '#16a34a', '#86efac'],
  potion: ['#ef4444', '#dc2626', '#fca5a5'],
  gold: ['#f59e0b', '#d97706', '#fcd34d'],
  sword: ['#a78bfa', '#8b5cf6', '#c4b5fd'],
  door: ['#92400e', '#78350f', '#b45309'],
  heart: ['#ef4444', '#dc2626'],
  ui: ['#ffffff', '#94a3b8', '#1e293b'],
};

const P = {};

P.player = [
  '·111·',
  '·1·1·',
  '·111·',
  '··1··',
  '·121·',
  '1··12',
];

P.goblin = [
  '·111·',
  '·1·1·',
  '·333·',
  '··1··',
  '·3·3·',
  '3···3',
];

P.wall = ['111', '121', '111'];
P.floor = ['·0·', '000', '·0·'];
P.potion = ['·1·', '121', '·1·'];
P.gold = ['·2·', '222', '·2·'];
P.sword = ['·1·', '·1·', '·1·', '·1·', '·2·', '·2·'];
P.heart = ['·1·', '111', '111', '·1·'];

export function drawSprite(ctx, name, x, y, size = 16, palette) {
  const sprite = P[name];
  if (!sprite) return;
  const pal = palette || COLORS[name] || ['#fff', '#888', '#444'];
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const ci = parseInt(sprite[row][col]);
      if (ci > 0 && ci <= pal.length) {
        ctx.fillStyle = pal[ci - 1];
        ctx.fillRect(x + col * size, y + row * size, size, size);
      }
    }
  }
}

export function drawTile(ctx, tile, x, y, size) {
  if (tile === 1) {
    drawSprite(ctx, 'wall', x, y, size, COLORS.wall);
  } else {
    drawSprite(ctx, 'floor', x, y, size, COLORS.floor);
  }
}
