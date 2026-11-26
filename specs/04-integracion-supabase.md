# SPEC 04 — Integración de Supabase en Next.js

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-11-26
> **Objective:** Conectar la app Next.js con el proyecto Supabase ya enlazado por MCP (dependencias, variables de entorno, clientes de navegador y servidor y `proxy.ts` de refresco de sesión) sin crear ni modificar nada en la base de datos.

---

## Por qué existe esta spec

La versión anterior de esta spec también creaba tablas, RLS y leía puntuaciones. Se descartó: ahora solo se quiere dejar la app **integrada** con Supabase. Tablas, Auth, lectura y escritura de puntuaciones son specs futuras que se apoyarán en estos clientes.

---

## Scope

**In:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` (no versionado), con las claves vacías en `.env.template` y documentadas en `README.md`.
- Cliente de navegador en `lib/supabase/client.ts`.
- Cliente de servidor en `lib/supabase/server.ts`.
- `proxy.ts` en la raíz del proyecto que refresca la sesión de Supabase en cada petición, con helper en `lib/supabase/proxy.ts`.
- Verificación puntual de conexión con el proyecto real (ver Implementation plan, paso 5). La prueba no queda en el código.

**Out of scope (para futuras specs):**

- Cualquier cambio en la base de datos: migraciones, tablas, políticas RLS, funciones, triggers, datos de prueba. No se usan `apply_migration` ni `execute_sql`.
- Tipos generados (`database.types.ts`): sin tablas no aportan nada. Se generan cuando exista un esquema.
- Supabase Auth en la interfaz: login, registro, cierre de sesión y reemplazo de `lib/session.tsx` y `components/auth-form.tsx`. El mock de `localStorage` sigue intacto.
- Leer o guardar puntuaciones; el Salón y el detalle siguen con `seededScores`.
- Realtime, Edge Functions y Storage.
- Supabase local con CLI/Docker.
- Tests (el proyecto no tiene test runner).

---

## Data model

Esta feature no introduce datos ni tablas. Solo configuración y dos funciones de fábrica:

```ts
// lib/supabase/client.ts
export function createClient(): SupabaseClient;

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>;

// lib/supabase/proxy.ts
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse>;
```

Variables de entorno (públicas por diseño):

| Variable                               | Valor                                             |
| -------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto (`get_project_url` del MCP)      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clave publicable (`get_publishable_keys` del MCP) |

`SUPABASE_DB_PASSWORD` ya existe en `.env.template` y no se usa en el código de la app. La clave `service_role` **no** se añade al proyecto.

---

## Implementation plan

Antes de escribir código, leer en `node_modules/next/dist/docs/` las guías de `proxy`, `cookies()` asíncrono y variables de entorno, y la guía actual de `@supabase/ssr` para Next.js (`search_docs` del MCP, solo lectura).

1. **Dependencias.** `npm install @supabase/supabase-js @supabase/ssr`. Verificación: `npx tsc --noEmit` pasa.
2. **Variables de entorno.** Obtener URL y clave publicable con `get_project_url` y `get_publishable_keys`, escribirlas en `.env.local`, añadir las dos claves vacías a `.env.template` y documentarlas en `README.md`. Verificación: `git status` no muestra `.env.local`.
3. **Clientes.** Crear `lib/supabase/client.ts` (`createBrowserClient`) y `lib/supabase/server.ts` (`createServerClient` con `await cookies()`). Verificación: `npx tsc --noEmit` pasa.
4. **Proxy de sesión.** Crear `lib/supabase/proxy.ts` con `updateSession` y `proxy.ts` en la raíz con un `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` y archivos de imagen. Verificación: `npm run dev` arranca y `/`, `/salon` y `/juegos/<id>` cargan igual que antes.
5. **Prueba de conexión (temporal).** Con un script o ruta desechable, pedir `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings` con la cabecera `apikey` y comprobar respuesta 200; instanciar ambos clientes y llamar `auth.getSession()` sin error. Borrar la prueba al terminar. Verificación: la prueba responde 200 y no queda código de prueba en `git status`.
6. **Pulido.** `npm run lint` y `npm run build` sin errores.

Cada paso deja la app arrancable con `npm run dev`.

---

## Acceptance criteria

- [ ] `npm run build` y `npm run lint` terminan sin errores y `npx tsc --noEmit` pasa.
- [ ] Existen `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts` y `proxy.ts`.
- [ ] `.env.local` contiene las dos variables nuevas y `git status` no lo lista como archivo a versionar.
- [ ] `.env.template` lista `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vacías y `README.md` las documenta.
- [ ] La petición a `/auth/v1/settings` del proyecto con la clave publicable responde 200.
- [ ] Ambos clientes se instancian y `auth.getSession()` no lanza error.
- [ ] No se ejecutó ninguna migración ni SQL: `list_migrations` y `list_tables` del MCP quedan igual que antes de la spec.
- [ ] La clave `service_role` no aparece en el repo ni en `.next/static` (grep).
- [ ] No quedan archivos ni rutas de prueba de conexión en el repo.
- [ ] Home, Biblioteca, Salón, detalle, reproductor, `/auth` (mock) y `/acerca` siguen funcionando sin errores de consola.

---

## Decisions

- **Sí:** solo integración, cero cambios en la base de datos. Es lo que se pidió; el esquema va en otra spec.
- **Sí:** `@supabase/ssr` con clientes separados de navegador y servidor. Es el patrón actual para el App Router y servirá a la spec de Auth.
- **Sí:** `proxy.ts` de refresco de sesión. No toca la base de datos y evita rehacer el cableado cuando llegue Auth.
- **No:** tipos generados. Sin tablas el archivo queda vacío.
- **Sí:** verificar con la API real (`/auth/v1/settings`) además de `auth.getSession()`. Sin sesión, `getSession()` solo lee cookies y no llega a la red, así que por sí sola no prueba la conexión.
- **No:** dejar una ruta `/api/health` permanente. Añade código que no se pidió.
- **Sí:** claves públicas con prefijo `NEXT_PUBLIC_`. La protección real es RLS en specs futuras; la `service_role` nunca entra al proyecto.
- **No:** Supabase local con CLI. Más pasos de entorno sin beneficio hoy.
- **Sí:** reescribir la spec 04 en vez de crear una nueva. La versión anterior era un borrador sin implementar.

---

## Risks

| Riesgo                                                                         | Mitigación                                                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| El `proxy.ts` rompe rutas existentes o ralentiza la navegación                 | `matcher` que excluye estáticos; verificar a mano Home, Salón y detalle en el paso 4.               |
| API de `@supabase/ssr` o de `proxy` de Next 16 distinta al conocimiento previo | Leer `node_modules/next/dist/docs/` y `search_docs` del MCP antes de escribir código.               |
| Variables vacías o mal copiadas hacen fallar los clientes en runtime           | La prueba de conexión del paso 5 falla pronto; `.env.template` documenta los nombres exactos.       |
| Claves reales filtradas al repo                                                | `.env*` ya está en `.gitignore` (solo `.env.template` versionado); grep de claves en los criterios. |

---

## What is **not** in this spec

- Cambios en la base de datos de cualquier tipo.
- Supabase Auth en la interfaz ni reemplazo de la sesión mock.
- Lectura o escritura de puntuaciones.
- Tipos generados, Realtime, Edge Functions, Storage.
- Supabase local/Docker y tests automatizados.

Cada uno de esos puntos, si se hace, va en su propia spec.
