export const COLORS = {
  player: { skin: '#f5d6b8', armor: '#3b82f6', armorDark: '#1d4ed8', armorLight: '#93c5fd', hair: '#92400e', eye: '#1e293b', sword: '#94a3b8', swordDark: '#64748b', boots: '#78350f', cape: '#ef4444' },
  goblin: { skin: '#86efac', skinDark: '#22c55e', eye: '#dc2626', cloth: '#6b21a8', clothDark: '#4c1d95', boots: '#451a03' },
  wall: { dark: '#374151', mid: '#4b5563', light: '#6b7280', accent: '#1f2937', moss: '#166534' },
  floor: { dark: '#1e293b', mid: '#334155', light: '#475569' },
  potion: { body: '#ef4444', highlight: '#fca5a5', dark: '#b91c1c', liquid: '#dc2626' },
  gold: { coin: '#f59e0b', highlight: '#fde68a', dark: '#b45309' },
  sword: { blade: '#cbd5e1', bladeLight: '#f8fafc', hilt: '#8b5cf6', grip: '#4c1d95', dark: '#64748b' },
  door: { frame: '#78350f', panel: '#92400e', knob: '#f59e0b', dark: '#451a03' },
  heart: { fill: '#ef4444', dark: '#b91c1c', light: '#fca5a5' },
};

const P = {};

P.player = [
  '··2222··',
  '·244442·',
  '·246642·',
  '·244442·',
  '··2·2···',
  '·333333··',
  '311·1·113',
  '31··1··13',
  '·3··1··3·',
  '··4··4···',
  '·9·44·9··',
  '99·44·99·',
];

P.goblin = [
  '··22····',
  '·2442···',
  '·2552···',
  '·2442···',
  '··3·3···',
  '·666666··',
  '66···66·',
  '6·····6·',
  '·6···6··',
  '··7·7···',
  '·77·77··',
  '77··77··',
];

P.wall_brick = [
  '12121212',
  '21212121',
  '12121212',
  '21212121',
  '12121212',
  '21212121',
  '12121212',
  '21212121',
];

P.floor_tile = [
  '·111111·',
  '1·1111·1',
  '11····11',
  '1······1',
  '1······1',
  '11····11',
  '1·1111·1',
  '·111111·',
];

P.potion = [
  '···11···',
  '··144···',
  '·13331··',
  '1333331·',
  '1333331·',
  '·13331··',
  '··1·1···',
  '···1····',
];

P.gold = [
  '··222···',
  '·22222··',
  '2222222·',
  '22222222',
  '·222222·',
  '··2222··',
  '···22···',
  '········',
];

P.sword = [
  '·····1··',
  '····11··',
  '····1···',
  '···11···',
  '··11····',
  '·1·1····',
  '··11····',
  '··33····',
  '··33····',
  '··33····',
  '···3····',
  '···3····',
];

P.heart = [
  '·1··1·',
  '111111',
  '111111',
  '·1111·',
  '··111·',
  '···1··',
];

P.door_closed = [
  '11111111',
  '1······1',
  '1·222·1',
  '1·222·1',
  '1·222·1',
  '1·222·1',
  '1·222·1',
  '1·····1',
  '1·····1',
  '1··4··1',
  '1·····1',
  '11111111',
];

export function drawSprite(ctx, name, x, y, pixelSize = 3, palette) {
  const sprite = P[name];
  if (!sprite) return;
  const pal = palette || COLORS[name] || {};
  const palArr = Object.values(pal);
  if (palArr.length === 0) return;

  const colorMap = {};
  const keys = Object.keys(pal);
  for (let i = 0; i < keys.length; i++) {
    colorMap[String(i + 1)] = pal[keys[i]];
  }

  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const ch = sprite[row][col];
      if (ch !== '·' && ch !== '.') {
        const color = colorMap[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }
}

export function drawTile(ctx, tile, x, y, size) {
  if (tile === 1) {
    drawSprite(ctx, 'wall_brick', x, y, Math.floor(size / 8), COLORS.wall);
  } else {
    drawSprite(ctx, 'floor_tile', x, y, Math.floor(size / 8), COLORS.floor);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, y, size, size);
  }
}

export function drawCharacter(ctx, type, x, y, size, palette) {
  const pSize = Math.floor(size / 12);
  const offsetY = size > 24 ? -2 : 0;
  drawSprite(ctx, type, x + 2, y + offsetY, pSize, palette);
}

export function drawItem(ctx, type, x, y, size) {
  const names = { potion: 'potion', gold: 'gold', sword: 'sword' };
  drawSprite(ctx, names[type] || 'gold', x, y, Math.floor(size / 8));
}
