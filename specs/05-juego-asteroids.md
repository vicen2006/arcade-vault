# SPEC 05 — Juego Asteroids (ROCAS) en la plataforma

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-27
> **Objective:** Portar a TypeScript el Asteroids de `references/started-games/02-asteroids/` y montarlo como juego real de la entrada `rocas` dentro del reproductor, alimentando su HUD y su modal de fin de partida.

---

## Por qué existe esta spec

Hoy `/juegos/[id]/jugar` muestra un mock: `GamePlayer` suma puntos aleatorios con un `setInterval` y dibuja enemigos decorativos en CSS. Ya existe un Asteroids funcional en canvas puro. Esta spec convierte `rocas` en el primer juego jugable de verdad y define el patrón (motor TS + callbacks) que seguirán los siguientes juegos.

---

## Scope

**In:**

- Port 1:1 de `game.js` a TypeScript en `lib/games/asteroids/`: entidades `Ship`, `Bullet`, `Asteroid`, `Particle`, `PowerUp`; power-ups triple, escudo, lento, hiper y Bomba Nova; mismas constantes, física, puntos y niveles.
- Motor encapsulado: sin globals de módulo ni `document.getElementById`. Recibe el canvas y callbacks; expone `start`, `pause`, `resume`, `restart`, `destroy`.
- `destroy()` quita listeners de teclado/visibilidad y cancela el `requestAnimationFrame` (sin fugas al navegar o con Strict Mode).
- Componente cliente `components/games/asteroids-canvas.tsx` que monta el canvas y conecta el motor.
- `GamePlayer` para `game.id === "rocas"`: muestra el canvas en `.crt-screen` en vez de `.game-arena`; HUD React (puntuación, vidas, nivel) con valores reales del motor; modal FIN DEL JUEGO con la puntuación real.
- HUD del canvas: se quitan SCORE, NIVEL e iconos de vida (los muestra React). Se quedan TRIPLE / ESCUDO / LENTO / HIPER y `NOVA [B]`.
- Se quita el overlay GAME OVER del canvas y el reinicio con Espacio: manda el modal.
- Pausa: botón PAUSA/REANUDAR, tecla `P` y pausa automática con `visibilitychange` (pestaña oculta). El overlay EN PAUSA actual se reutiliza.
- Botón FIN termina la partida y abre el modal. JUGAR DE NUEVO llama `restart()`. SALIR desmonta (y `destroy()`).
- Canvas lógico 800x600 (`W`/`H`), escalado por CSS al ancho del `.crt-screen` con relación 4:3, sin desbordar.
- Aviso "REQUIERE TECLADO" en pantallas táctiles sin teclado (`(pointer: coarse)`), sin bloquear el canvas.
- Strings de UI y comentarios en español, como el original.

**Out of scope (para futuras specs):**

- Guardar puntuaciones en Supabase o `localStorage`. GUARDAR PUNTUACIÓN sigue siendo el mock actual.
- Controles táctiles.
- El "asteroide estrella fugaz" del README original (no existe en `game.js`).
- Cambios en jugabilidad, balance o gráficos del original.
- Los demás juegos del catálogo: siguen con el reproductor mock.
- Cambios en `lib/data.ts` (la entrada `rocas` se usa tal cual), en el detalle o en el Salón.
- Sonido.
- Tests (el proyecto no tiene test runner).

---

## Data model

Sin datos persistentes. Contrato del motor:

```ts
// lib/games/asteroids/engine.ts
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

export function createAsteroidsEngine(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsEngine;
```

Estado interno del motor (antes globals): `ship`, `bullets`, `asteroids`, `particles`, `powerUp`, `novaItem`, `score`, `lives`, `level`, `state: 'playing' | 'dead' | 'gameover'`, timers de power-ups, `hasNova`, `paused`. `onStats` solo se emite cuando cambia algún valor, no cada frame.

Archivos:

| Archivo                                 | Contenido                                                  |
| --------------------------------------- | ---------------------------------------------------------- |
| `lib/games/asteroids/constants.ts`      | `W`, `H`, `RADII`, `SPEEDS`, `POINTS`, duraciones, colores |
| `lib/games/asteroids/entities.ts`       | clases de entidades; `draw(ctx)` recibe el contexto        |
| `lib/games/asteroids/engine.ts`         | `createAsteroidsEngine`, input, loop, update, draw, HUD    |
| `components/games/asteroids-canvas.tsx` | `"use client"`, monta canvas, crea y destruye el motor     |
| `components/game-player.tsx` (modifica) | rama `rocas`: canvas real, HUD y modal con datos del motor |
| `app/globals.css` (modifica)            | estilos del canvas escalado 4:3 y aviso de teclado         |

---

## Implementation plan

Antes de escribir código, leer en `node_modules/next/dist/docs/` lo relativo a Client Components y `useEffect`/refs en React 19. Usar `/frontend-design` para los ajustes visuales (canvas en el CRT, aviso de teclado).

1. **Constantes y entidades.** Crear `constants.ts` y `entities.ts` portando de `game.js` con tipos; las entidades reciben `ctx` en `draw()` en vez de usar un global. Verificación: `npx tsc --noEmit` pasa.
2. **Motor.** Crear `engine.ts` con `createAsteroidsEngine`: input (`keys`/`justPressed`, `preventDefault` en teclas de juego solo mientras el motor está vivo), loop con `dt` limitado a 0.05, `update`/`draw`, HUD reducido, sin overlay GAME OVER, tecla `P`, `visibilitychange`, callbacks. Verificación: `npx tsc --noEmit` pasa.
3. **Componente canvas.** Crear `asteroids-canvas.tsx`: `useRef` del canvas, `useEffect` que crea el motor y llama `destroy()` en el cleanup; recibe callbacks y una ref/handle para `pause`/`resume`/`restart`. Verificación: montado en `/juegos/rocas/jugar` el juego se juega con teclado.
4. **Integración en `GamePlayer`.** Para `rocas`: sustituir `.game-arena` por el canvas, quitar el `setInterval` mock, alimentar HUD desde `onStats`, abrir modal desde `onGameOver` y desde FIN, conectar PAUSA/REANUDAR, `P` y JUGAR DE NUEVO al motor. El resto de juegos sigue igual. Verificación: `/juegos/caida/jugar` se comporta como antes.
5. **Estilos.** Canvas escalado 4:3 dentro de `.crt-screen` y aviso "REQUIERE TECLADO" con `(pointer: coarse)`. Verificación: a 375px, 768px y 1440px de ancho el canvas no desborda ni se deforma.
6. **Pulido.** `npm run lint` y `npm run build` sin errores; revisar consola y fugas (navegar ida y vuelta varias veces).

Cada paso deja la app arrancable con `npm run dev`.

---

## Acceptance criteria

- [x] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [x] Existen `lib/games/asteroids/constants.ts`, `entities.ts`, `engine.ts` y `components/games/asteroids-canvas.tsx`.
- [x] En `/juegos/rocas/jugar` la nave rota (`←` `→`), propulsa (`↑`), dispara una bala por pulsación (`Espacio`) y usa la Bomba Nova (`B`).
- [x] Destruir asteroides suma 20 / 50 / 100 según tamaño y el HUD React muestra la puntuación real.
- [x] Perder una vida baja el contador del HUD React; al vaciar el campo, el nivel del HUD sube.
- [x] Aparecen y funcionan los power-ups triple, escudo, lento e hiper y la Bomba Nova; sus timers y `NOVA [B]` se ven en el canvas.
- [x] El canvas no dibuja SCORE, NIVEL, iconos de vida ni el overlay GAME OVER.
- [x] Al perder la última vida se abre el modal FIN DEL JUEGO con la puntuación final real.
- [x] JUGAR DE NUEVO reinicia la partida (score 0, 3 vidas, nivel 1) y cierra el modal.
- [x] FIN abre el modal y detiene el juego.
- [x] PAUSA, la tecla `P` y ocultar la pestaña congelan el juego y muestran EN PAUSA; REANUDAR o `P` lo continúan sin salto de `dt`.
- [x] Con el modal abierto o en pausa, `Espacio` y las flechas no mueven la nave ni hacen scroll de forma inesperada; con el modal abierto se puede escribir en el input de iniciales.
- [x] Tras salir con SALIR y volver varias veces, no hay loops duplicados (velocidad normal) ni errores en consola.
- [x] A 375px, 768px y 1440px el canvas mantiene 4:3 y no provoca scroll horizontal.
- [x] En emulación táctil se ve el aviso "REQUIERE TECLADO".
- [x] Los demás juegos (p. ej. `/juegos/caida/jugar`) siguen con el reproductor mock sin cambios.
- [x] `references/started-games/02-asteroids/` queda sin modificar.

---

## Decisions

- **Sí:** reusar la entrada `rocas`. Ya describe el juego y tiene portada; no cambia URLs ni datos.
- **Sí:** port a TypeScript con motor encapsulado y callbacks. Permite limpiar al desmontar y alimentar el HUD React; será el patrón para los siguientes juegos.
- **No:** iframe con el juego estático en `public/`. Comunicación con el HUD y el modal torpe.
- **No:** port JS casi literal. Mantiene globals y fugas de listeners entre navegaciones.
- **Sí:** HUD de score/vidas/nivel solo en React; timers de power-ups y NOVA siguen en el canvas. Evita duplicar información.
- **Sí:** modal de React reemplaza al overlay GAME OVER y al reinicio con Espacio. Un solo flujo de fin de partida.
- **Sí:** GUARDAR PUNTUACIÓN sigue siendo mock. Persistir en Supabase necesita tablas, RLS y Auth: otra spec.
- **Sí:** pausa con botón, tecla `P` y `visibilitychange`. Evita morir con la pestaña en segundo plano.
- **Sí:** canvas lógico 800x600 escalado por CSS. La física depende de `W`/`H`; escalar solo la presentación no la altera.
- **No:** controles táctiles. Solo aviso en móvil; los controles van en otra spec.
- **No:** implementar la estrella fugaz ni cambiar balance. Port 1:1.
- **No:** editar el texto `long` de `rocas` (menciona OVNIs que no existen). Fuera de lo pedido.

---

## Risks

| Riesgo                                                                   | Mitigación                                                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Strict Mode monta dos veces el efecto y crea dos loops                   | `destroy()` cancela rAF y listeners; criterio de "sin loops duplicados".                                   |
| `preventDefault` global de teclas bloquea el input del modal o el scroll | Ignorar teclas cuando el foco está en un `input`/`textarea` y cuando el motor está pausado o en game over. |
| `onStats` cada frame provoca renders excesivos                           | Emitir solo cuando cambian score, vidas o nivel.                                                           |
| Salto grande de `dt` al reanudar                                         | Reiniciar `lastTime` al reanudar; `dt` ya limitado a 0.05.                                                 |
| Escalado CSS desenfoca el canvas o deforma la relación                   | `aspect-ratio: 4 / 3`, ancho 100% y `image-rendering` revisado en el paso 5.                               |
| APIs de React 19 / Next 16 distintas al conocimiento previo              | Leer `node_modules/next/dist/docs/` antes de escribir código.                                              |

---

## What is **not** in this spec

- Persistencia de puntuaciones (Supabase o local).
- Controles táctiles y sonido.
- Estrella fugaz, OVNIs y cambios de jugabilidad.
- Port de los demás juegos de `references/started-games/`.
- Tests automatizados.

Cada uno de esos puntos, si se hace, va en su propia spec.
