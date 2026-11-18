# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-11-18
> **Objective:** Portar a Next.js (App Router, TypeScript) las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) con datos mock, sin implementar ningún juego real.

---

## Por qué existe esta spec

El proyecto es un scaffold de `create-next-app`. Los estilos y fuentes ya se portaron en `app/globals.css` y `app/layout.tsx` (PR #2). Falta la capa de pantallas. Las plantillas de `references/templates/` son un SPA en React con Babel, hash-routing y `window.*`; no se pueden copiar tal cual a App Router.

---

## Scope

**In:**

- Cinco rutas reales en App Router con el contenido visual de las plantillas.
- Nav (con menú móvil) y footer compartidos desde `app/layout.tsx`.
- Datos mock tipados: `GAMES`, `CATS` y `seededScores`, portados de `data.jsx`.
- Sesión mock en `localStorage` (clave `av_user`) compartida vía contexto React.
- Reproductor con simulación del template: HUD, puntos que suben solos, pausa, FIN, modal "Fin del juego" y toast de guardado.
- Filtro por búsqueda y categoría en la biblioteca.
- 404 (`notFound()`) cuando el `id` de juego no existe.
- Diseño responsive tal como lo definen los estilos existentes.

**Out of scope (para futuras specs):**

- Cualquier juego real (lógica, canvas, input de teclado o táctil).
- Backend, base de datos, autenticación real, OAuth (los botones GOOGLE y GITHUB son decorativos).
- Persistencia de puntuaciones: guardar en el modal solo muestra el toast, no escribe nada.
- Mostrar puntuaciones reales del usuario en detalle o salón (siguen siendo `seededScores`).
- Validación de formularios de auth y mensajes de error.
- Tests (el proyecto no tiene test runner).
- Cambios en `app/globals.css` más allá de lo estrictamente necesario para que las plantillas rendericen igual.

---

## Data model

Archivo nuevo `lib/data.ts`, portado de `data.jsx`:

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;          // slug de la URL, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS existente, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // ya formateado, p. ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;        // "DD/MM/2026"
}

export const GAMES: Game[];                      // los 8 juegos del template
export const CATS: ["TODOS", ...GameCategory[]];
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Sesión mock, en `lib/session.tsx` (cliente):

```ts
export interface SessionUser { name: string }   // máx. 10 caracteres, mayúsculas

// localStorage["av_user"] = JSON de SessionUser; ausente = invitado
```

Convenciones:

- `seededScores` conserva el algoritmo del template (misma semilla, misma salida). Semillas: detalle `id.length * 17 + 3` con 10 filas; salón `id.length * 23 + 7` con 12 filas.
- Números con `toLocaleString("es-ES")`.
- La leyenda "CRÉDITOS · 03" del Nav es texto fijo.

---

## Implementation plan

Rutas finales:

| Ruta | Pantalla | Archivo |
| --- | --- | --- |
| `/` | Biblioteca | `app/page.tsx` |
| `/juegos/[id]` | Detalle | `app/juegos/[id]/page.tsx` |
| `/juegos/[id]/jugar` | Reproductor | `app/juegos/[id]/jugar/page.tsx` |
| `/auth` | Iniciar sesión / Crear cuenta | `app/auth/page.tsx` |
| `/salon` | Salón de la Fama | `app/salon/page.tsx` |

Antes de escribir código, leer en `node_modules/next/dist/docs/` las guías de routing dinámico, `notFound`, componentes cliente y `next/link` (Next.js 16: `params` es una `Promise`). Usar `/frontend-design` para el diseño, según `CLAUDE.md`, aunque aquí el diseño ya está definido por las plantillas.

1. **Datos.** Crear `lib/data.ts` con los tipos, `GAMES`, `CATS` y `seededScores`. Verificación: `npx tsc --noEmit` pasa.
2. **Sesión.** Crear `lib/session.tsx` (`"use client"`) con `SessionProvider` y el hook `useSession()` que expone `{ user, login, signOut }`. Lee `av_user` tras el montaje, con `try/catch`, para evitar errores de hidratación.
3. **Shell.** Crear `components/nav.tsx` (cliente, menú móvil, enlaces con `next/link`, estado activo por `usePathname`) y `components/footer.tsx`. Montar `SessionProvider`, `Nav`, `<main className="av-main">` y `Footer` en `app/layout.tsx`. Verificación: `/` muestra el Nav y el footer.
4. **Biblioteca.** Crear `components/game-card.tsx` (cliente, con tilt al mover el ratón) y `components/library.tsx` (cliente, búsqueda y chips). Reemplazar `app/page.tsx`. Verificación: filtrar por texto y categoría, y el estado vacío "NO HAY RESULTADOS".
5. **Detalle.** Crear `app/juegos/[id]/page.tsx` (servidor) con `notFound()` si el `id` no existe, y `generateStaticParams` sobre `GAMES`. Portar portada, etiquetas, stat strip, acciones y leaderboard.
6. **Auth.** Crear `app/auth/page.tsx` y `components/auth-form.tsx` (cliente): pestañas, campo de correo solo en "Crear cuenta", `login` mock con `name = (user || "PLAYER1").toUpperCase().slice(0, 10)`, botón de invitado y botones sociales decorativos. Tras entrar, `router.push("/")`.
7. **Salón.** Crear `app/salon/page.tsx` y `components/hall-of-fame.tsx` (cliente): pestañas por juego, podio, tabla animada y fila "TU MEJOR MARCA" solo si hay sesión.
8. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` (servidor) y `components/game-player.tsx` (cliente): HUD, CRT con arena falsa, pausa, FIN, modal de fin de juego (iniciales, guardar → toast, jugar de nuevo, volver) y SALIR al detalle. Nombre inicial `user.name` o `"INVITADO"`.
9. **Pulido.** Metadata por página, `npm run lint` y `npm run build` sin errores, y revisión manual a 1440 px y 390 px.

Cada paso deja la app arrancable con `npm run dev`.

---

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra el hero, el buscador, los chips `TODOS/ARCADE/PUZZLE/SHOOTER/VERSUS` y las 8 tarjetas.
- [ ] Escribir "caí" en el buscador deja solo la tarjeta CAÍDA; un texto sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] El chip `SHOOTER` muestra exactamente INVASORES y ROCAS.
- [ ] Clic en una tarjeta o en su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/bloque-buster` muestra título, 4 etiquetas, stat strip (Partidas, Mejor global, Dificultad) y 10 filas de puntuaciones con top 1, 2 y 3 resaltados.
- [ ] `/juegos/no-existe` devuelve la página 404 de Next.
- [ ] "▶ JUGAR AHORA" navega a `/juegos/<id>/jugar`; "VOLVER AL VAULT" navega a `/`.
- [ ] En el reproductor, la puntuación sube sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la retoma.
- [ ] FIN abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA_" y oculta el input; "JUGAR DE NUEVO" reinicia puntos, vidas y nivel.
- [ ] El input de iniciales fuerza mayúsculas y máximo 10 caracteres.
- [ ] SALIR vuelve a `/juegos/<id>`.
- [ ] `/auth` alterna entre "INICIAR SESIÓN" y "CREAR CUENTA"; el campo de correo solo aparece en la segunda.
- [ ] Enviar el formulario con usuario `px_kai` guarda `av_user = {"name":"PX_KAI"}`, redirige a `/` y el Nav muestra `PX_KAI ▾`.
- [ ] Con sesión iniciada, clic en el botón del usuario cierra la sesión y el Nav vuelve a "Iniciar Sesión".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin guardar `av_user`.
- [ ] Recargar con sesión iniciada mantiene el nombre en el Nav y no hay warnings de hidratación en consola.
- [ ] `/salon` muestra podio (02, 01, 03), tabla de 12 filas y una pestaña por cada juego; cambiar de pestaña cambia los datos.
- [ ] La fila "TU MEJOR MARCA EN <JUEGO>" aparece solo con sesión iniciada.
- [ ] A 390 px de ancho no hay scroll horizontal, el Nav muestra el botón `≡` y el panel móvil abre y cierra.
- [ ] El enlace activo del Nav se resalta: "Biblioteca" en `/`, `/juegos/*` y `/juegos/*/jugar`; "Salón de la Fama" en `/salon`.
- [ ] No hay errores de consola en ninguna de las 5 rutas.

---

## Decisions

- **Sí:** rutas reales (`/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs compartibles y encaja con App Router.
- **No:** SPA con hash-routing como en el template. Ignora el framework y rompe SSR.
- **No:** rutas con los nombres de las plantillas (`/detalle`, `/player`). Se prefiere `/juegos/...` por jerarquía REST-like.
- **Sí:** sesión mock en `localStorage` (`av_user`) con contexto React. Reproduce el comportamiento del template sin backend.
- **No:** auth real o validación de formularios. Pertenece a una spec de backend.
- **Sí:** datos mock tipados en `lib/data.ts` con `seededScores` determinista. Permite pantallas estables y sustituir por una API después.
- **No:** guardar `av_scores` en `localStorage`. Nada lo lee todavía; se difiere hasta que existan juegos y ranking real.
- **Sí:** reproductor con simulación del template. Cubre HUD, pausa y modal de fin de juego para validar el flujo visual.
- **Sí:** detalle y reproductor como Server Components, con `notFound()` y `generateStaticParams`. Solo lo interactivo lleva `"use client"`.
- **Sí:** el Nav y el footer viven en `app/layout.tsx`. Es el equivalente a `App` del template.
- **Sí:** componentes en `components/` y utilidades en `lib/`, con alias `@/*`.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Hidratación: leer `localStorage` en el primer render causa mismatch | `SessionProvider` empieza con `user = null` y lee `av_user` en `useEffect`. |
| `localStorage` bloqueado o JSON corrupto | Todo acceso va en `try/catch`; el fallback es invitado. |
| APIs de Next 16 distintas de lo conocido (`params` asíncrono, `PageProps`) | Leer `node_modules/next/dist/docs/` antes de cada ruta dinámica. |
| Los estilos del template dependen de `window.*` o `React` global | Los estilos ya están en `globals.css`; los componentes usan imports ES. Solo se portan comportamientos. |
| La simulación de puntos con `Math.random()` causa mismatch SSR | El reproductor empieza en `score = 0` y solo cambia en `useEffect`. |

---

## What is **not** in this spec

- Ningún juego jugable.
- Backend, API, base de datos o autenticación real.
- Persistencia o ranking real de puntuaciones.
- Tests automatizados.
- Internacionalización (la interfaz queda solo en español).
