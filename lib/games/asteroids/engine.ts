import {
  H,
  HYPER_COLOR,
  HYPER_DURATION,
  NOVA_CHANCE,
  NOVA_COLOR,
  NOVA_FLASH,
  POINTS,
  POWERUP_CHANCE,
  POWERUP_TYPES,
  SHIELD_COLOR,
  SHIELD_DURATION,
  SHIELD_RADIUS,
  SLOW_COLOR,
  SLOW_DURATION,
  SLOW_FACTOR,
  TRIPLE_COLOR,
  TRIPLE_DURATION,
  W,
} from "./constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  dist,
  rand,
  randInt,
} from "./entities";

export interface AsteroidsStats {
  score: number;
  lives: number;
  level: number;
}

export interface AsteroidsCallbacks {
  onStats(stats: AsteroidsStats): void; // al cambiar score, vidas o nivel
  onGameOver(finalScore: number): void; // al perder la última vida
  onPauseChange(paused: boolean): void; // tecla P o visibilitychange
}

export interface AsteroidsEngine {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void; // equivale a initGame()
  destroy(): void;
}

type GameState = "playing" | "dead" | "gameover";

const GAME_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyB",
];

// Teclas que el usuario escribe en un campo de texto no son del juego
const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable);

export function createAsteroidsEngine(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  // ── Estado ──────────────────────────────────────────────────────────────────
  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let powerUp: PowerUp | null = null; // PowerUp en pantalla
  let powerUpSpawned = false; // ya apareció en este nivel
  let tripleShotTimer = 0; // segundos restantes de disparo triple
  let shieldTimer = 0; // segundos restantes de escudo
  let slowTimer = 0; // segundos restantes de cámara lenta
  let hyperTimer = 0; // segundos restantes de hiperpropulsión
  let novaItem: PowerUp | null = null; // ítem Bomba Nova en pantalla
  let novaSpawned = false; // ya apareció una Bomba Nova en este nivel
  let hasNova = false; // Bomba Nova guardada (máx. 1)
  let novaFlash = 0; // segundos restantes del destello
  let state: GameState = "playing";
  let deadTimer = 0;

  let paused = false;
  let destroyed = false;
  let started = false;
  let gameOverSent = false;
  let lastTime: number | null = null;
  let frameId = 0;
  let lastStats: AsteroidsStats | null = null;

  // ── Input ───────────────────────────────────────────────────────────────────
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};

  function pressed(code: string) {
    const val = justPressed[code];
    justPressed[code] = false;
    return !!val;
  }

  function clearKeys() {
    for (const code of Object.keys(keys)) keys[code] = false;
    for (const code of Object.keys(justPressed)) justPressed[code] = false;
  }

  // El motor solo captura teclas mientras se juega y no se escribe en un input
  const capturing = (target: EventTarget | null) =>
    !paused && state !== "gameover" && !isEditable(target);

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "KeyP") {
      if (!e.repeat && state !== "gameover" && !isEditable(e.target)) {
        setPaused(!paused, true);
      }
      return;
    }

    if (!capturing(e.target)) return;
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.code] = false;
    // Evita que Espacio active un botón enfocado al soltar la tecla
    if (GAME_KEYS.includes(e.code) && capturing(e.target)) e.preventDefault();
  }

  function onVisibilityChange() {
    if (document.hidden && !paused && state !== "gameover") {
      setPaused(true, true);
    }
  }

  function onBlur() {
    clearKeys();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // ── Lógica ──────────────────────────────────────────────────────────────────
  function emitStats(force = false) {
    if (
      !force &&
      lastStats &&
      lastStats.score === score &&
      lastStats.lives === lives &&
      lastStats.level === level
    ) {
      return;
    }
    lastStats = { score, lives, level };
    callbacks.onStats(lastStats);
  }

  function setPaused(value: boolean, notify: boolean) {
    if (destroyed || paused === value) return;
    paused = value;
    clearKeys();
    // Al reanudar no debe haber salto de dt
    lastTime = null;
    if (notify) callbacks.onPauseChange(paused);
  }

  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    score = 0;
    lives = 3;
    level = 1;
    powerUp = null;
    powerUpSpawned = false;
    tripleShotTimer = 0;
    shieldTimer = 0;
    slowTimer = 0;
    hyperTimer = 0;
    novaItem = null;
    novaSpawned = false;
    hasNova = false;
    novaFlash = 0;
    state = "playing";
    gameOverSent = false;
    spawnAsteroids(4);
    clearKeys();
    emitStats(true);
  }

  function nextLevel() {
    level++;
    powerUpSpawned = false;
    novaSpawned = false;
    bullets = [];
    particles = [];
    ship.reset();
    spawnAsteroids(3 + level);
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }

  // Destruye un asteroide (puntos + explosión) y devuelve sus fragmentos
  function destroyAsteroid(a: Asteroid) {
    a.dead = true;
    score += POINTS[a.size];
    explode(a.x, a.y, a.size * 5);
    return a.split();
  }

  // Bomba Nova: destruye todos los asteroides (sin fragmentos) y suma sus puntos
  function detonateNova() {
    for (const a of asteroids) {
      score += POINTS[a.size];
      explode(a.x, a.y, a.size * 5);
    }
    asteroids = [];
    hasNova = false;
    novaFlash = NOVA_FLASH;
  }

  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    tripleShotTimer = 0;
    shieldTimer = 0;
    slowTimer = 0;
    hyperTimer = 0;
    lives--;
    if (lives <= 0) {
      state = "gameover";
    } else {
      state = "dead";
      deadTimer = 2;
    }
  }

  function updateParticles(dt: number) {
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
  }

  function updateItems(dt: number) {
    if (powerUp) {
      powerUp.update(dt);
      if (powerUp.dead) powerUp = null;
    }
    if (novaItem) {
      novaItem.update(dt);
      if (novaItem.dead) novaItem = null;
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (state === "gameover") {
      updateParticles(dt);
      return;
    }

    if (state === "dead") {
      deadTimer -= dt;
      updateParticles(dt);
      asteroids.forEach((a) => a.update(dt));
      updateItems(dt);
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }

    // Disparar
    if (pressed("Space")) {
      bullets.push(...ship.tryShoot(tripleShotTimer > 0));
    }

    // Bomba Nova (se consume la tecla aunque no haya bomba)
    if (pressed("KeyB") && hasNova) detonateNova();

    if (tripleShotTimer > 0) tripleShotTimer -= dt;
    if (shieldTimer > 0) shieldTimer -= dt;
    if (slowTimer > 0) slowTimer -= dt;
    if (hyperTimer > 0) hyperTimer -= dt;
    if (novaFlash > 0) novaFlash -= dt;
    updateItems(dt);

    ship.update(
      dt,
      {
        left: !!keys["ArrowLeft"],
        right: !!keys["ArrowRight"],
        up: !!keys["ArrowUp"],
      },
      hyperTimer,
    );
    bullets.forEach((b) => b.update(dt));
    const asteroidDt = slowTimer > 0 ? dt * SLOW_FACTOR : dt;
    asteroids.forEach((a) => a.update(asteroidDt));
    particles.forEach((p) => p.update(dt));

    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          newAsteroids.push(...destroyAsteroid(a));

          // Garantiza al menos uno por nivel: si quedan <=2 asteroides, se fuerza
          const restantes =
            asteroids.filter((x) => !x.dead).length + newAsteroids.length;
          if (
            !powerUpSpawned &&
            (restantes <= 2 || Math.random() < POWERUP_CHANCE)
          ) {
            powerUp = new PowerUp(
              a.x,
              a.y,
              POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)],
            );
            powerUpSpawned = true;
          }

          // Ítem escaso: Bomba Nova, a lo sumo una por nivel y solo si no hay una guardada
          if (
            !novaSpawned &&
            !novaItem &&
            !hasNova &&
            Math.random() < NOVA_CHANCE
          ) {
            novaItem = new PowerUp(a.x, a.y, "nova");
            novaSpawned = true;
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);

    // Nave vs power-up
    if (powerUp && dist(ship, powerUp) < ship.radius + powerUp.radius) {
      if (powerUp.type === "shield") shieldTimer = SHIELD_DURATION;
      else if (powerUp.type === "slow") slowTimer = SLOW_DURATION;
      else if (powerUp.type === "hyper") hyperTimer = HYPER_DURATION;
      else tripleShotTimer = TRIPLE_DURATION;
      powerUp = null;
    }

    // Nave vs Bomba Nova
    if (novaItem && dist(ship, novaItem) < ship.radius + novaItem.radius) {
      hasNova = true;
      novaItem = null;
    }

    // Nave vs asteroide (el escudo absorbe un impacto y destruye el asteroide)
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        const reach =
          (shieldTimer > 0 ? SHIELD_RADIUS : ship.radius) + a.radius * 0.82;
        if (dist(ship, a) < reach) {
          if (shieldTimer > 0) {
            asteroids.push(...destroyAsteroid(a));
            asteroids = asteroids.filter((x) => !x.dead);
            shieldTimer = 0;
            ship.invincible = 1; // gracia: los fragmentos nacen sobre la nave
          } else {
            killShip();
          }
          break;
        }
      }
    }

    // Nivel completado
    if (asteroids.length === 0) nextLevel();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  // Score, nivel y vidas los muestra React; aquí solo timers y Nova
  function drawHUD(g: CanvasRenderingContext2D) {
    g.font = "15px monospace";
    g.textAlign = "left";

    let row = 0;
    const timers: [number, string, string][] = [
      [tripleShotTimer, TRIPLE_COLOR, "TRIPLE"],
      [shieldTimer, SHIELD_COLOR, "ESCUDO"],
      [slowTimer, SLOW_COLOR, "LENTO"],
      [hyperTimer, HYPER_COLOR, "HIPER"],
    ];
    for (const [timer, color, label] of timers) {
      if (timer <= 0) continue;
      g.fillStyle = color;
      g.fillText(`${label} ${Math.ceil(timer)}s`, 14, 26 + row * 20);
      row++;
    }

    if (hasNova) {
      g.fillStyle = NOVA_COLOR;
      g.textAlign = "right";
      g.fillText("NOVA [B]", W - 14, 26);
    }
  }

  function draw(g: CanvasRenderingContext2D) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);

    particles.forEach((p) => p.draw(g));
    asteroids.forEach((a) => a.draw(g));
    bullets.forEach((b) => b.draw(g));
    if (powerUp) powerUp.draw(g);
    if (novaItem) novaItem.draw(g);
    ship.draw(g, hyperTimer, shieldTimer);

    if (novaFlash > 0) {
      g.save();
      g.globalAlpha = (0.6 * novaFlash) / NOVA_FLASH;
      g.fillStyle = NOVA_COLOR;
      g.fillRect(0, 0, W, H);
      g.restore();
    }

    drawHUD(g);
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  function loop(ts: number) {
    if (destroyed) return;
    frameId = requestAnimationFrame(loop);
    if (paused) return;

    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    draw(ctx!);

    emitStats();
    if (state === "gameover" && !gameOverSent) {
      gameOverSent = true;
      callbacks.onGameOver(score);
    }
  }

  return {
    start() {
      if (started || destroyed) return;
      started = true;
      initGame();
      frameId = requestAnimationFrame(loop);
    },
    pause() {
      setPaused(true, false);
    },
    resume() {
      if (state === "gameover") return;
      setPaused(false, false);
    },
    restart() {
      if (destroyed) return;
      paused = false;
      lastTime = null;
      initGame();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
