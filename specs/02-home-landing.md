# SPEC 02 — Home (landing) de Arcade Vault

> **Status:** implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-20
> **Objective:** Añadir la landing page Home en `/` portada de `references/templates/home-about/` (sin el About), moviendo la Biblioteca a `/biblioteca` y sumando "Inicio" al Nav.

---

## Por qué existe esta spec

La SPEC 01 dejó la Biblioteca en `/`. El diseño final prevé una landing de marketing como puerta de entrada y la Biblioteca como pantalla aparte. Las referencias `home (1).jsx`, `nav (1).jsx` y `styles (1).css` mezclan Home y About; esta spec porta solo el Home. El About va en otra spec.

---

## Scope

**In:**

- Nueva página Home en `/` con 6 secciones: hero con siluetas flotantes, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO", "PRECIOS" (con FAQ) y CTA final.
- Mover la Biblioteca de `/` a `/biblioteca` (contenido sin cambios).
- Enlace "Inicio" nuevo en el Nav (escritorio y panel móvil), con estado activo propio.
- Actualizar los enlaces que apuntan a la Biblioteca con `href="/"` para que usen `/biblioteca`.
- Portar a `app/globals.css` solo las reglas del Home de `styles (1).css`: `/* ===== HOME PAGE ===== */` (líneas 930–1070), `/* ===== ACTIVITY ===== */` (1621–1671) y `/* ===== PRICING ===== */` (1672 en adelante), más `@keyframes` y clases auxiliares que usen (`float`, `.reveal`, `.reveal.in`).
- Animación de aparición al hacer scroll (`.reveal` → `.in`) con `IntersectionObserver`.
- Datos mock estáticos para "Actividad en vivo" y "Top jugadores".
- Las 6 primeras entradas de `GAMES` como mini-tarjetas que enlazan a `/juegos/<id>`.

**Out of scope (para futuras specs):**

- Página About y el enlace "Acerca de" en el Nav (spec propia). Incluye todas las reglas bajo `/* ===== ABOUT PAGE ===== */` (1071–1150).
- Datos reales o en vivo: la actividad y el top son listas fijas; no se actualizan ni leen puntuaciones del usuario.
- Cambios en la Biblioteca, el detalle, el reproductor, auth o el salón, salvo actualizar sus enlaces a `/biblioteca`.
- Reglas de `styles (1).css` ajenas al Home (gamepad, variantes de tema, etc.) y los archivos `download*` de la carpeta de referencias.
- Formulario de contacto, newsletter o cualquier captura de datos.
- Tests (el proyecto no tiene test runner).

---

## Data model

Esta feature no introduce estructuras de datos persistentes. Reutiliza `GAMES` de `lib/data.ts` (SPEC 01).

Datos mock estáticos nuevos, definidos en `lib/home-data.ts`:

```ts
export interface ActivityRow {
  player: string;
  game: string;
  score: number;
  ago: string;                       // "hace 2 min"
  color: "cyan" | "magenta" | "yellow" | "green";
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export const ACTIVITY: ActivityRow[];   // 7 filas del template
export const TOP_TODAY: TopPlayer[];    // 5 filas del template
```

Convenciones:

- Textos, cifras y nombres idénticos al template.
- Números con `toLocaleString("es-ES")`.
- Textos de las secciones "¿Por qué?", stats, precios y FAQ viven en el componente, como en el template.

---

## Implementation plan

Rutas tras esta spec:

| Ruta | Pantalla | Archivo |
| --- | --- | --- |
| `/` | Home | `app/page.tsx` |
| `/biblioteca` | Biblioteca | `app/biblioteca/page.tsx` |

Antes de escribir código, leer en `node_modules/next/dist/docs/` las guías de `Link`, componentes cliente y metadata. Usar `/frontend-design` según `CLAUDE.md`, aunque el diseño ya está definido por las plantillas.

1. **Mover la Biblioteca.** Crear `app/biblioteca/page.tsx` con el contenido y la metadata actuales de `app/page.tsx`. Dejar `app/page.tsx` temporalmente con un placeholder. Actualizar los `href="/"` que llevan a la Biblioteca: `components/game-player.tsx`, `components/hall-of-fame.tsx`, `app/juegos/[id]/page.tsx`. Verificación: `/biblioteca` funciona igual que antes.
2. **Nav.** En `components/nav.tsx`: añadir "Inicio" (`/`) antes de "Biblioteca" en escritorio y móvil; "Biblioteca" apunta a `/biblioteca` y está activa en `/biblioteca` y `/juegos/*`; "Inicio" activo solo con `pathname === "/"`; el logo sigue apuntando a `/`. Verificación: los enlaces activos se resaltan bien en cada ruta.
3. **Estilos.** Copiar a `app/globals.css` las reglas del Home, Actividad y Precios de `styles (1).css`, con sus `@media`, y `.reveal`. No copiar nada del About. Verificación: `npm run build` pasa y las demás pantallas no cambian.
4. **Datos.** Crear `lib/home-data.ts` con `ACTIVITY` y `TOP_TODAY`. Verificación: `npx tsc --noEmit` pasa.
5. **Piezas del Home.** Crear `components/home/floating-silhouettes.tsx` (8 SVG) y `components/home/feature-icon.tsx` (GAMEPAD, FREE, TROPHY, ROCKET), ambos de servidor. Crear `components/home/reveal.tsx` (cliente): wrapper que aplica `.reveal` y añade `.in` con `IntersectionObserver`, con fallback a visible si el API no existe.
6. **Hero y "¿Por qué?".** Reemplazar `app/page.tsx` por el Home (servidor) con hero (CTAs a `/biblioteca` y `/auth`) y la sección 01 con las 4 `feature-card`. Verificación: se ve el hero y las 4 tarjetas.
7. **Juegos, stats y actividad.** Añadir sección 02 (6 mini-tarjetas con `next/link` a `/juegos/<id>` y botón a `/biblioteca`), stats y sección 03 (ticker y top con enlace "VER SALÓN →" a `/salon`).
8. **Precios y CTA final.** Añadir sección 04 (plan, lista, FAQ, botón a `/auth`) y la sección final (botón "INSERTAR MONEDA →" a `/biblioteca`).
9. **Pulido.** Metadata de la página (`title`, `description`), `npm run lint` y `npm run build` sin errores, y revisión manual a 1440 px y 390 px.

Cada paso deja la app arrancable con `npm run dev`.

---

## Acceptance criteria

- [X] `npm run build` y `npm run lint` terminan sin errores.
- [X] `/` muestra el hero con el título "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y 8 siluetas decorativas.
- [X] `/` muestra las secciones numeradas `// 01`, `// 02`, `// 03` y `// 04` más el CTA final "¿LISTO PARA JUGAR?".
- [X] La sección 01 tiene 4 tarjetas: JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS y SIEMPRE CRECIENDO.
- [X] La sección 02 muestra exactamente 6 mini-tarjetas, las 6 primeras de `GAMES`; clic en una navega a `/juegos/<id>`.
- [X] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5, con top 1, 2 y 3 resaltados.
- [X] "▶ EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [X] "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`; "VER SALÓN →" navega a `/salon`.
- [X] `/biblioteca` muestra el hero, buscador, chips y las 8 tarjetas igual que antes en `/`.
- [x] "VOLVER AL VAULT" (detalle y reproductor) y el enlace de la página del salón que llevaba a la Biblioteca navegan a `/biblioteca`.
- [x] El Nav muestra "Inicio", "Biblioteca" y "Salón de la Fama", y no muestra "Acerca de".
- [x] "Inicio" está resaltado solo en `/`; "Biblioteca" en `/biblioteca` y `/juegos/*`; "Salón de la Fama" en `/salon`.
- [x] Las secciones con `.reveal` pasan a `.in` al entrar en el viewport.
- [X] A 390 px de ancho no hay scroll horizontal y las grids se apilan (features 1 col, mini-rail 2 col, actividad 1 col, precios 1 col).
- [X] `app/globals.css` no contiene reglas de `/* ===== ABOUT PAGE ===== */`.
- [X] No hay errores de consola ni warnings de hidratación en `/`.
- [X] Las rutas `/juegos/<id>`, `/juegos/<id>/jugar`, `/auth` y `/salon` siguen funcionando.

---

## Decisions

- **Sí:** Home en `/` y Biblioteca en `/biblioteca`. Replica la estructura del template (Inicio y Biblioteca separados) y deja la landing como puerta de entrada.
- **No:** Home en `/home` con la Biblioteca en `/`. El logo y la raíz seguirían llevando a la Biblioteca, no a la landing.
- **No:** eliminar la Biblioteca. Perdería buscador y filtros de la SPEC 01.
- **Sí:** solo "Inicio" nuevo en el Nav. "Acerca de" entra con la spec del About para no dejar un enlace roto.
- **No:** enlace "Acerca de" deshabilitado. Añade ruido visual sin función.
- **Sí:** estilos del Home en `app/globals.css`. Mantiene la convención de un solo archivo de estilos del proyecto.
- **No:** `app/home.css` separado. Rompe esa convención.
- **Sí:** las 6 secciones del template, incluidos Precios y FAQ. Es la fidelidad pedida a la referencia.
- **Sí:** datos mock estáticos en `lib/home-data.ts`. No hay backend; se sustituyen cuando existan puntuaciones reales.
- **Sí:** Home como Server Component; solo `reveal.tsx` lleva `"use client"`. Todo lo demás es contenido estático.
- **Sí:** `IntersectionObserver` para `.reveal`, como el template. Evita añadir una librería de animación.
- **No:** copiar los archivos `download*` de la carpeta de referencias. No son parte del Home.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` oculta el contenido si el JS no corre o el observer falla | `reveal.tsx` marca `.in` de inmediato si no existe `IntersectionObserver`. |
| Copiar CSS arrastra reglas del About y de otras zonas del archivo de referencia | Copiar solo por rangos de sección y validar con grep que no hay selectores de `ABOUT PAGE`. |
| Selectores del Home chocan con los existentes en `globals.css` (`.btn.xl`, `.pulse`, `.blink` ya existen) | Comparar antes de pegar y no duplicar reglas ya presentes. |
| Enlaces `href="/"` olvidados que siguen llevando a la Home en vez de la Biblioteca | Buscar `href="/"` con grep y revisar cada caso (el logo debe seguir en `/`). |
| Mismatch de hidratación por `toLocaleString` | Formato fijo `"es-ES"` en datos estáticos; no hay valores aleatorios ni dependientes de la fecha. |

---

## What is **not** in this spec

- La página About ni el enlace "Acerca de".
- Actividad, ranking o estadísticas reales.
- Cambios de funcionalidad en Biblioteca, detalle, reproductor, auth o salón.
- Backend, autenticación real o pagos (el plan "$0" es texto estático).
- Tests automatizados.
