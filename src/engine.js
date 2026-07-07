export class Engine {
  constructor() {
    this.state = 'menu';
    this.score = 0;
    this.level = 1;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.tiles = [];
    this.width = 20;
    this.height = 16;
    this.turn = 0;
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.level = 1;
    this.loadLevel();
  }

  loadLevel() {
    this.tiles = [];
    this.enemies = [];
    this.items = [];
    this.generateDungeon();
    this.spawnPlayer();
    this.spawnEnemies();
    this.spawnItems();
  }

  generateDungeon() {
    const seed = this.level * 1000;
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.tiles[y][x] = 1;
        } else {
          const r = (seed + x * 7 + y * 13) % 100;
          this.tiles[y][x] = r < 15 ? 1 : 0;
        }
      }
    }
    for (let i = 0; i < 4; i++) {
      const rx = 2 + (seed + i * 31) % (this.width - 4);
      const ry = 2 + (seed + i * 37) % (this.height - 4);
      this.tiles[ry][rx] = 0;
    }
  }

  spawnPlayer() {
    this.player = { x: 1, y: 1, hp: 10, maxHp: 10, attack: 2, defense: 1 };
  }

  spawnEnemies() {
    const count = 3 + this.level;
    for (let i = 0; i < count; i++) {
      let ex, ey;
      do {
        ex = 2 + Math.floor(Math.random() * (this.width - 4));
        ey = 2 + Math.floor(Math.random() * (this.height - 4));
      } while (this.tiles[ey][ex] !== 0 || (ex === this.player.x && ey === this.player.y));
      this.enemies.push({
        x: ex, y: ey, hp: 3 + this.level, maxHp: 3 + this.level,
        attack: 1 + Math.floor(this.level / 2), type: 'goblin'
      });
    }
  }

  spawnItems() {
    const positions = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.tiles[y][x] === 0) positions.push({ x, y });
      }
    }
    const taken = new Set();
    taken.add(`${this.player.x},${this.player.y}`);
    const types = ['potion', 'gold', 'potion', 'gold', 'sword'];
    for (const type of types) {
      let pos;
      do {
        pos = positions[Math.floor(Math.random() * positions.length)];
      } while (taken.has(`${pos.x},${pos.y}`));
      taken.add(`${pos.x},${pos.y}`);
      this.items.push({ x: pos.x, y: pos.y, type });
    }
  }

  movePlayer(dx, dy) {
    if (this.state !== 'playing') return false;
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) return false;
    if (this.tiles[ny][nx] === 1) return false;
    for (const e of this.enemies) {
      if (e.x === nx && e.y === ny && e.hp > 0) {
        this.attackEnemy(e);
        return true;
      }
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].x === nx && this.items[i].y === ny) {
        this.collectItem(i);
      }
    }
    this.player.x = nx;
    this.player.y = ny;
    this.turn++;
    this.enemyTurn();
    return true;
  }

  attackEnemy(e) {
    const dmg = Math.max(1, this.player.attack + Math.floor(Math.random() * 3) - e.defense || 0);
    e.hp -= dmg;
    if (e.hp <= 0) {
      this.score += 10 * this.level;
      this.enemies = this.enemies.filter(en => en !== e);
    }
  }

  collectItem(index) {
    const item = this.items[index];
    if (item.type === 'potion') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
    } else if (item.type === 'gold') {
      this.score += 5;
    } else if (item.type === 'sword') {
      this.player.attack += 2;
    }
    this.items.splice(index, 1);
  }

  enemyTurn() {
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      let mx = 0, my = 0;
      if (adx > ady) {
        mx = dx > 0 ? 1 : -1;
      } else {
        my = dy > 0 ? 1 : -1;
      }
      const nx = e.x + mx;
      const ny = e.y + my;
      if (nx === this.player.x && ny === this.player.y) {
        const dmg = Math.max(1, e.attack + Math.floor(Math.random() * 2) - this.player.defense);
        this.player.hp -= dmg;
        if (this.player.hp <= 0) {
          this.state = 'gameover';
        }
      } else if (this.tiles[ny] && this.tiles[ny][nx] === 0) {
        const occupied = this.enemies.some(oe => oe !== e && oe.x === nx && oe.y === ny);
        if (!occupied) {
          e.x = nx;
          e.y = ny;
        }
      }
    }
    if (this.enemies.length === 0) {
      this.level++;
      this.loadLevel();
    }
  }

  getTile(x, y) {
    if (y < 0 || y >= this.tiles.length) return 1;
    if (x < 0 || x >= this.tiles[y].length) return 1;
    return this.tiles[y][x];
  }
}
