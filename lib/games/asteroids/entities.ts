import {
  BULLET_SPEED,
  H,
  HYPER_COLOR,
  HYPER_MAX_SPEED,
  HYPER_THRUST,
  POWERUP_STYLE,
  RADII,
  SHIELD_COLOR,
  SHIELD_RADIUS,
  SHIP_DRAG,
  SHIP_MAX_SPEED,
  SHIP_ROT,
  SHIP_THRUST,
  SPEEDS,
  TRIPLE_SPREAD,
  W,
  type PowerUpType,
} from "./constants";

// ── Utils ─────────────────────────────────────────────────────────────────────
export const wrap = (v: number, max: number) => ((v % max) + max) % max;

export const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);

export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

// Teclas mantenidas que lee la nave
export interface ShipInput {
  left: boolean;
  right: boolean;
  up: boolean;
}

// ── Bullet ────────────────────────────────────────────────────────────────────
export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = 1.1;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
export class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][] = [];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
export class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  vx: number;
  vy: number;
  radius = 10;
  ttl = 8;
  dead = false;

  constructor(x: number, y: number, type: PowerUpType) {
    this.x = x;
    this.y = y;
    this.type = type;
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * 30;
    this.vy = Math.sin(angle) * 30;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Parpadeo cuando está por expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    const color = POWERUP_STYLE[this.type].color;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(POWERUP_STYLE[this.type].label, this.x, this.y + 1);
    ctx.textBaseline = "alphabetic";
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
export class Ship {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 0;
  shootCooldown = 0;
  dead = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, input: ShipInput, hyperTimer: number) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const hyper = hyperTimer > 0;

    if (input.left) this.angle -= SHIP_ROT * dt;
    if (input.right) this.angle += SHIP_ROT * dt;

    this.thrusting = input.up;
    if (this.thrusting) {
      const thrust = SHIP_THRUST * (hyper ? HYPER_THRUST : 1);
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= SHIP_DRAG;
    this.vy *= SHIP_DRAG;

    const speed = Math.hypot(this.vx, this.vy);
    if (hyper) {
      if (speed > HYPER_MAX_SPEED) {
        this.vx *= HYPER_MAX_SPEED / speed;
        this.vy *= HYPER_MAX_SPEED / speed;
      }
    } else if (speed > SHIP_MAX_SPEED) {
      // Al acabar la hiperpropulsión, frena de forma suave hasta el tope normal
      this.vx *= 0.97;
      this.vy *= 0.97;
    }

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(triple = false): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;

    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;

    if (triple) {
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(
        (d) => new Bullet(ox, oy, this.angle + d),
      );
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(
    ctx: CanvasRenderingContext2D,
    hyperTimer: number,
    shieldTimer: number,
  ) {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      // Hiperpropulsión: llama larga, parpadea durante el último segundo
      const hyper = hyperTimer > 0;
      const blink = hyperTimer < 1 && Math.floor(hyperTimer * 8) % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - (hyper ? rand(14, 26) : rand(6, 14)), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle =
        hyper && !blink ? HYPER_COLOR : "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();

    // Escudo: parpadea durante el último segundo
    if (
      shieldTimer > 0 &&
      (shieldTimer > 1 || Math.floor(shieldTimer * 8) % 2 === 1)
    ) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 120);
      ctx.strokeStyle = SHIELD_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, SHIELD_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}
