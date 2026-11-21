## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

```bash
npm run dev     # dev server (http://localhost:3000)
npm run build   # production build
npm start       # serve production build
npm run lint    # eslint (flat config, eslint.config.mjs)
```

## Variables de entorno

Copia `.env.template` a `.env.local` y rellena los valores (solo servidor, sin prefijo `NEXT_PUBLIC_`):

| Variable | Uso |
| --- | --- |
| `RESEND_API_KEY` | Clave de la cuenta de Resend para enviar el formulario de contacto |
| `CONTACT_TO_EMAIL` | Destinatario de los mensajes. Con `onboarding@resend.dev` debe ser el correo de la cuenta Resend |
| `CONTACT_FROM_EMAIL` | Remitente, p. ej. `Arcade Vault <onboarding@resend.dev>` |
