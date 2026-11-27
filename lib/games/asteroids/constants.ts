// Canvas lógico
export const W = 800;
export const H = 600;

// Asteroides: tablas por tamaño 1, 2, 3 (índice 0 sin usar)
export const RADII = [0, 16, 30, 50]; // radio
export const SPEEDS = [0, 85, 55, 32]; // velocidad base
export const POINTS = [0, 100, 50, 20]; // puntos

// Nave
export const SHIP_ROT = 3.5; // rad/s
export const SHIP_THRUST = 260; // px/s²
export const SHIP_DRAG = 0.987;
export const SHIP_MAX_SPEED = 340; // px/s, ≈ velocidad terminal normal

// Bala
export const BULLET_SPEED = 520;

// Power-ups
export const POWERUP_CHANCE = 0.12; // probabilidad por asteroide destruido

export const TRIPLE_DURATION = 5; // segundos
export const TRIPLE_SPREAD = 0.22; // radianes entre balas
export const TRIPLE_COLOR = "#4cf";

export const SHIELD_DURATION = 5; // segundos
export const SHIELD_RADIUS = 22; // radio del círculo de energía
export const SHIELD_COLOR = "#6f6";

export const SLOW_DURATION = 6; // segundos
export const SLOW_FACTOR = 0.5; // multiplicador de velocidad de los asteroides
export const SLOW_COLOR = "#fc4";

export const HYPER_DURATION = 8; // segundos
export const HYPER_THRUST = 2.6; // multiplicador de aceleración
export const HYPER_MAX_SPEED = 620; // px/s, velocidad máxima con hiperpropulsión
export const HYPER_COLOR = "#f84";

export const NOVA_CHANCE = 0.03; // probabilidad rara por asteroide destruido (aparte del power-up del nivel)
export const NOVA_COLOR = "#f4f";
export const NOVA_FLASH = 0.5; // segundos de destello al detonar

export type PowerUpType = "triple" | "shield" | "slow" | "hyper" | "nova";

export const POWERUP_TYPES: PowerUpType[] = [
  "triple",
  "shield",
  "slow",
  "hyper",
];

export const POWERUP_STYLE: Record<
  PowerUpType,
  { color: string; label: string }
> = {
  triple: { color: TRIPLE_COLOR, label: "3" },
  shield: { color: SHIELD_COLOR, label: "E" },
  slow: { color: SLOW_COLOR, label: "S" },
  hyper: { color: HYPER_COLOR, label: "H" },
  nova: { color: NOVA_COLOR, label: "N" },
};
