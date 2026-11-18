# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online platform to play games and compete for high scores. Currently a fresh `create-next-app` scaffold (`app/page.tsx` is still the default template); no game or scoring code exists yet.

The project follows Spec Driven Design (`/spec` and `/spec-impl` skills from `Klerith/fernando-skills`, installed with `npx skills@latest add Klerith/fernando-skills`). Write a spec before implementing features.

## Next.js version warning

Next.js 16.4.6 / React 19.3 — APIs and conventions differ from older training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (start at `index.md`; sections `01-app/`, `02-pages/`, `03-architecture/`). This project uses the App Router (`app/`). See `AGENTS.md`.

No test runner is configured.

## Skills
Usa siempre /frontend-design para diseñar interfaz de usuario.

## Setup notes

- Path alias `@/*` maps to the project root (not `src/`), e.g. `@/app/...`.
- Tailwind CSS v4 via `@import "tailwindcss"` in `app/globals.css`; theme tokens are defined with `@theme inline` there (no `tailwind.config`). Dark mode follows `prefers-color-scheme`.
- This directory is a subfolder of a larger course repo (`ClaudeCode-Curso`); the git root is the parent.
