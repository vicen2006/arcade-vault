# SPEC 03 — About y formulario de contacto con Resend

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-21
> **Objective:** Añadir la página About en `/acerca`, portada de `references/templates/home-about/about (1).jsx`, con un formulario de contacto que envía el mensaje por correo con Resend mediante una Server Action.

---

## Por qué existe esta spec

La SPEC 02 portó el Home y dejó fuera el About, su enlace "Acerca de" en el Nav y el formulario de contacto. El template simula el envío (solo muestra la terminal de éxito). Esta spec porta el About tal cual y hace real el envío: el mensaje llega por correo al equipo vía Resend.

---

## Scope

**In:**

- Nueva página About en `/acerca` con: hero "ACERCA DE ARCADE VAULT" (misión + 3 highlights con icono), divisor de píxeles y sección de contacto (intro con 3 tips + formulario).
- Enlace "Acerca de" en el Nav (escritorio y panel móvil), después de "Salón de la Fama", con estado activo en `/acerca`.
- Formulario de contacto idéntico al template: campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE; shake si faltan campos; terminal de éxito con "ENVIAR OTRO MENSAJE".
- Envío real por correo con Resend desde una Server Action (`"use server"`).
- Validación en servidor (campos obligatorios, correo válido, longitudes máximas).
- Honeypot anti-spam: campo oculto; si llega relleno se descarta en silencio y se responde como éxito.
- Estado de error mínimo si Resend falla (ver Decisions).
- Portar a `app/globals.css` solo las reglas bajo `/* ===== ABOUT PAGE ===== */` de `styles (1).css` (líneas 1071–1146), más `@keyframes pxblink` y `shake`, `.btn.press:active` y `.divider` si no existen.
- Metadata de la página (`title`, `description`).
- Variables de entorno en `.env.local` (no versionado): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

**Out of scope (para futuras specs):**

- Dominio propio verificado en Resend (se usa `onboarding@resend.dev`).
- Reply-To al correo del visitante.
- Correo de confirmación al visitante.
- Rate limiting, CAPTCHA o guardar los mensajes en base de datos.
- Plantillas de correo con React Email (el cuerpo es texto plano).
- Cambios en Home, Biblioteca, detalle, reproductor, auth o salón.
- Tests (el proyecto no tiene test runner).

---

## Data model

No introduce datos persistentes. Estructuras nuevas, en `lib/contact.ts`:

```ts
export interface ContactInput {
  name: string;    // 1–60 caracteres tras trim
  email: string;   // formato válido, máx. 120
  msg: string;     // 1–2000 caracteres tras trim
}

export type ContactResult =
  | { ok: true; name: string }          // name ya recortado, para "GRACIAS, <NOMBRE>"
  | { ok: false; error: "invalid" | "send_failed" };

export const CONTACT_LIMITS = { name: 60, email: 120, msg: 2000 } as const;
export function validateContact(input: ContactInput): boolean;
```

Variables de entorno (solo servidor, sin prefijo `NEXT_PUBLIC_`):

| Variable | Valor | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | clave de la cuenta Resend | autenticar el SDK |
| `CONTACT_TO_EMAIL` | `vicenteramirezgaray10@gmail.com` | destinatario |
| `CONTACT_FROM_EMAIL` | `Arcade Vault <onboarding@resend.dev>` | remitente |

Correo enviado: `subject` = `[Arcade Vault] Mensaje de <NOMBRE>`, cuerpo en texto plano con nombre, correo y mensaje.

Convenciones:

- Textos idénticos al template (incluido "ACERCA DE", tips y mensajes de la terminal).
- La Server Action vive en `app/acerca/actions.ts`; la validación en `lib/contact.ts` para reutilizarla en cliente (shake) y servidor.

---

## Implementation plan

Rutas tras esta spec:

| Ruta | Pantalla | Archivo |
| --- | --- | --- |
| `/acerca` | About + Contacto | `app/acerca/page.tsx` |

Antes de escribir código, leer en `node_modules/next/dist/docs/` las guías de Server Actions / formularios, componentes cliente y metadata, y la documentación actual del SDK `resend` (Node). Usar `/frontend-design` según `CLAUDE.md`, aunque el diseño ya está definido por el template.

1. **Dependencia y entorno.** `npm install resend`. Crear `.env.local` con las 3 variables (confirmar que `.env*` está en `.gitignore`, lo está) y documentarlas en `README.md`. Verificación: `npx tsc --noEmit` pasa.
2. **Estilos.** Copiar a `app/globals.css` las reglas del About (1071–1146) y los keyframes y auxiliares faltantes; comparar antes para no duplicar (`.reveal`, `.btn.xl`, `.field`, `blink` ya existen). Verificación: `npm run build` pasa y las demás pantallas no cambian.
3. **Lógica de contacto.** Crear `lib/contact.ts` con tipos, límites y `validateContact`. Verificación: `npx tsc --noEmit` pasa.
4. **Server Action.** Crear `app/acerca/actions.ts` con `sendContact(formData)`: lee `name`, `email`, `msg` y el honeypot `website`; si `website` viene relleno devuelve `{ ok: true }` sin enviar; valida; envía con `resend.emails.send`; devuelve `ContactResult`. Captura excepciones y errores de Resend sin filtrar detalles al cliente. Verificación: sin `RESEND_API_KEY` devuelve `send_failed`, no lanza.
5. **Piezas del About.** Crear `components/about/highlight-icon.tsx` (HEART, BROWSER, PLANT; servidor) y `components/about/contact-form.tsx` (cliente): estado `sent`, shake, estado de envío (`pending`, botón deshabilitado), mensaje de error, terminal de éxito, "ENVIAR OTRO MENSAJE" y campo honeypot oculto (`name="website"`, `tabIndex={-1}`, `autoComplete="off"`, fuera de pantalla). Reutilizar `components/home/reveal.tsx` para `.reveal`.
6. **Página.** Crear `app/acerca/page.tsx` (servidor) con hero, divisor y sección de contacto, y su metadata. Verificación: `/acerca` se ve igual que el template.
7. **Nav.** En `components/nav.tsx` añadir "Acerca de" (`/acerca`) tras "Salón de la Fama", en escritorio y móvil, activo con `pathname === "/acerca"`. Verificación: resaltado correcto en cada ruta.
8. **Pulido.** `npm run lint` y `npm run build` sin errores; envío real de prueba con una clave válida; revisión manual a 1440 px y 390 px.

Cada paso deja la app arrancable con `npm run dev`.

---

## Acceptance criteria

- [X] `npm run build` y `npm run lint` terminan sin errores.
- [X] `/acerca` muestra el título "ACERCA DE ARCADE VAULT", el texto de misión y 3 highlights (corazón magenta, navegador cyan, planta verde).
- [X] `/acerca` muestra el divisor con 24 píxeles parpadeantes y la sección "CONTÁCTANOS" con los 3 tips.
- [X] El Nav muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de" en escritorio y móvil; "Acerca de" resaltado solo en `/acerca`.
- [X] Enviar el formulario con algún campo vacío no llama al servidor y aplica el shake.
- [X] Un envío válido entrega un correo a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de <NOMBRE>` y nombre, correo y mensaje en el cuerpo.
- [X] Tras el envío válido se muestra la terminal con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>."
- [X] "ENVIAR OTRO MENSAJE" limpia el formulario y lo vuelve a mostrar.
- [X] Durante el envío el botón queda deshabilitado (sin doble envío).
- [X] La Server Action rechaza (`invalid`) correo mal formado, campos vacíos o textos que superan `CONTACT_LIMITS`, aunque se salte la validación del cliente.
- [X] Con el honeypot relleno no se envía ningún correo y la UI muestra el éxito.
- [X] Con `RESEND_API_KEY` ausente o inválida se muestra un mensaje de error, el formulario conserva lo escrito y no hay excepción sin capturar.
- [X] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el HTML (búsqueda en `.next/static`).
- [X] `.env.local` no está versionado (`git status` limpio de `.env*`).
- [X] A 390 px no hay scroll horizontal; `highlight-row` y `contact-grid` se apilan en 1 columna.
- [x] No hay errores de consola ni warnings de hidratación en `/acerca`.
- [x] Home, Biblioteca, detalle, reproductor, `/auth` y `/salon` siguen funcionando.

---

## Decisions

- **Sí:** ruta `/acerca`. Coherente con las URLs en español del proyecto (`/biblioteca`, `/salon`).
- **Sí:** Server Action para el envío. La API key queda en el servidor sin endpoint público extra.
- **No:** Route Handler `/api/contacto`. Añade superficie sin necesidad hoy.
- **Sí:** Resend con `onboarding@resend.dev` como remitente. No hay dominio propio; es suficiente para desarrollo y el curso.
- **Sí:** destinatario y remitente en variables de entorno. No se hardcodean correos en el repo.
- **No:** dominio verificado. Se difiere hasta que exista un dominio de producción.
- **Sí:** validación en servidor además del shake del cliente. El cliente no es de confianza.
- **Sí:** honeypot como anti-spam básico. Cero fricción para el usuario.
- **No:** Reply-To, rate limiting, CAPTCHA ni correo de confirmación. No pedidos para esta iteración.
- **Sí:** mensaje de error mínimo si el envío falla. Mostrar la terminal de éxito ante un fallo mentiría al usuario; no estaba en la lista de opciones elegida, se añade como caso degradado obligatorio. Texto propuesto: "ERROR AL ENVIAR. INTÉNTALO DE NUEVO."
- **Sí:** correo en texto plano. Evita añadir React Email por un único mensaje interno.
- **Sí:** "Acerca de" entra al Nav ahora; la SPEC 02 lo había diferido para no dejar un enlace roto.
- **Sí:** reutilizar `components/home/reveal.tsx`. Misma animación `.reveal` que el Home.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev` Resend solo entrega al correo de la cuenta Resend; si `CONTACT_TO_EMAIL` no coincide, el envío falla | Registrar la cuenta Resend con ese correo, o verificar un dominio (spec futura). Probar el envío real en el paso 8. |
| Fuga de `RESEND_API_KEY` al cliente | Solo en servidor, sin `NEXT_PUBLIC_`; verificar con grep en `.next/static`. |
| Spam o abuso del formulario sin rate limit | Honeypot + validación + límites de longitud; rate limiting queda como spec futura. |
| Inyección de cabeceras vía `name` en el asunto | Quitar saltos de línea de `name` antes de usarlo en `subject`. |
| Copiar CSS duplica reglas existentes (`.field`, `.btn.xl`, `blink`) | Comparar contra `globals.css` antes de pegar. |
| Mismatch de hidratación en el formulario | Sin valores aleatorios ni dependientes de fecha; el honeypot es estático. |
| Cambios de API del SDK `resend` frente al conocimiento previo | Leer la documentación actual y los tipos instalados antes de escribir la Server Action. |

---

## What is **not** in this spec

- Dominio propio verificado en Resend.
- Reply-To, correo de confirmación, rate limiting o CAPTCHA.
- Persistencia de los mensajes.
- Plantillas HTML de correo.
- Cambios en otras pantallas más allá del enlace del Nav.
- Tests automatizados.
