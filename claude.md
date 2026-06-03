# CLAUDE.md — Contrato v2 (Multi-usuario con login + DB)

> Este documento reemplaza el contrato v1 (QR + lz-string). La app ya no usa QR ni
> localStorage como fuente de verdad. Todo persiste en Postgres con sesión por cookie.

## Arquitectura

- **Stack:** Astro v6 + TypeScript + Tailwind v4 + Postgres (Aiven) + Drizzle ORM.
- **Deploy:** Vercel (adapter `@astrojs/vercel`), dominio `mundial.durazno.org`.
- **Backend:** Endpoints REST `/api/*` + SSR pages. Sin CORS (mismo origen).
- **Auth:** Sesión por token opaco en DB + cookie httpOnly. Sin registro público.
- **Base de datos:** Postgres 17 en Aiven. Cadena en `DATABASE_URL_QUINIELA`.

## Modelo de datos (4 tablas)

### `users`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `username` | TEXT UNIQUE | Login credential (lowercase) |
| `password_hash` | TEXT | argon2id |
| `display_name` | TEXT | Apodo visible (≤15 chars) |
| `created_at` | TIMESTAMPTZ | Default now() |

### `sessions`
| Columna | Tipo | Notas |
|---|---|---|
| `token` | TEXT PK | Opaco, randomUUID |
| `user_id` | INT FK→users | ON DELETE CASCADE |
| `expires_at` | TIMESTAMPTZ | 90 días |
| `created_at` | TIMESTAMPTZ | Default now() |

### `predictions`
| Columna | Tipo | Notas |
|---|---|---|
| `user_id` + `match_id` | PK compuesta | |
| `resultado` | CHAR(1) | 'L'\|'E'\|'V' |
| `goles_local` | SMALLINT | 0..15 |
| `goles_visita` | SMALLINT | 0..15 |
| `updated_at` | TIMESTAMPTZ | |

### `results`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `match_id` | INT UNIQUE | 1..72 |
| `goles_local` | SMALLINT | 0..15 |
| `goles_visita` | SMALLINT | 0..15 |
| `video` | TEXT | URL YouTube |
| `updated_at` | TIMESTAMPTZ | |

**Nota:** `matches` NO va a la DB. Sigue en `src/data/matches.ts`.

## Autenticación y autorización

### Middleware (`src/middleware.ts`)
- Lee cookie `session`, busca en DB, valida expiración.
- Si es válido: `context.locals.user = { id, username, display_name }`.
- Si no: redirect silencioso a `/login` (páginas) o 401 (endpoints API).
- Rutas públicas: `/login`, assets estáticos (`/_astro/`, `/favicon*`, `/logo.svg`).

### Login (`POST /api/auth/login`)
- Busca user por username (lowercase), verifica argon2.
- Crea sesión con token randomUUID, set-cookie httpOnly+Secure+SameSite=Lax.
- Mensaje genérico en error: "Usuario o contraseña inválidos".

### Logout (`POST /api/auth/logout`)
- Borra sesión de DB, limpia cookie.

### Escritura (`PUT /api/quiniela`)
- Endpoint protegido por sesión.
- **Ownership forzado server-side:** siempre escribe sobre `user_id = session.user.id`.
- **Deadline validado server-side** antes de escribir.
- **Validación reusando `validators.ts`** (matchIds, goles, coherencia resultado).
- Upsert sobre `(user_id, match_id)`.

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Público | Formulario login. Si hay sesión: redirect a `/`. |
| `/` | Requiere sesión | Editor de quiniela propia. SSR carga datos existentes. |
| `/dashboard` | Requiere sesión | Leaderboard con ranking de puntos. SSR, cero JS. |
| `/quiniela/[username]` | Requiere sesión | Vista readonly de otro usuario. SSR con scoring. |

## Endpoints

| Método + ruta | Cuerpo | Efecto |
|---|---|---|
| `POST /api/auth/login` | `{ username, password }` | Crea sesión, set-cookie. |
| `POST /api/auth/logout` | — | Borra sesión. |
| `PUT /api/quiniela` | `{ predicciones: [{ matchId, resultado, golesLocal, golesVisita }] }` | Upsert de predicciones del usuario autenticado. |

## Scoring (`src/lib/scoring.ts`)
- **+3**: marcador exacto.
- **+1**: solo resultado correcto (L/E/V), marcador distinto.
- **+0**: fallo.
- Sin resultado en `results` → no suma/resta.

## Datos de partidos
- Catálogo de 72 partidos: `src/data/matches.ts` (hardcoded).
- Resultados reales: **en DB** (tabla `results`), admin inserta directo. Sin redeploy.
- El dashboard y scoring leen de la DB en cada request.

## Persistencia y draft
- El servidor es la fuente de verdad.
- localStorage (`quiniela_draft`) es solo red de seguridad para recuperación.
- Autosave al servidor con debounce de 1.5s.
- Al cargar la página, el SSR inyecta las predicciones vía `<script id="ssr-state">`.

## Seed de usuarios
- Script: `npx tsx scripts/seed-users.ts <username>:<password> [...]`
- Los usuarios son provisionados por el admin. No hay registro público ni reset de password.

## Seguridad
- [x] Cookies `HttpOnly` + `Secure` + `SameSite=Lax`.
- [x] Passwords con argon2id.
- [x] Mensajes de error genéricos en login.
- [x] Ownership server-side en PUT (nunca aceptar `user_id` del cliente).
- [x] Deadline validado en servidor.
- [x] Validación de matchId y goles reusando `validators.ts`.
- [x] TLS a Aiven (`sslmode=require`).
- [x] Expiración de sesión + invalidación en logout.
- [x] Rate limit sugerido: 5 req/min en `/api/auth/login` (configurar en Vercel).

## Archivos clave

### Conservados
- `src/data/matches.ts` — catálogo de 72 partidos.
- `src/components/MatchCard.astro` — tarjeta de partido.
- `src/components/ReadOnlyView.astro` — template readonly (ya no se usa directo; el SSR de `/quiniela/[username].astro` lo reemplaza).

### Modificados
- `src/pages/index.astro` — editor SSR sin QR ni name gating.
- `src/components/PredictionForm.astro` — sin QR ni name input.
- `src/lib/validators.ts` — nueva función `validatePredictions` para API.
- `src/styles/global.css` — tokens de color (sin cambios).
- `package.json`, `astro.config.mjs`.

### Creados
- `src/lib/db.ts` — cliente postgres.js con drizzle.
- `src/lib/db/schema.ts` — schema Drizzle.
- `src/lib/scoring.ts` — cálculo de puntos.
- `src/middleware.ts` — auth middleware.
- `src/env.d.ts` — tipos Locals.
- `src/pages/login.astro` — login form.
- `src/pages/dashboard.astro` — leaderboard.
- `src/pages/quiniela/[username].astro` — readonly view.
- `src/pages/api/auth/login.ts` — login endpoint.
- `src/pages/api/auth/logout.ts` — logout endpoint.
- `src/pages/api/quiniela.ts` — save predictions endpoint.
- `scripts/seed-users.ts` — seed script.
- `drizzle.config.ts` — drizzle-kit config.
- `drizzle/0000_clever_starhawk.sql` — migration.

### Eliminados
- `src/lib/codec.ts`, `src/components/ExportPanel.astro`, `src/data/results.ts`.
- Dependencias: `lz-string`, `@types/lz-string`, `qr-code-styling`.

## Estado actual del proyecto
- ✅ Build exitoso con `astro build`.
- ✅ DB con 4 tablas migradas y seed de usuarios.
- ✅ Login funcional con argon2.
- ✅ Editor con autosave (localStorage draft + PUT al servidor).
- ✅ Dashboard con leaderboard.
- ✅ Vista readonly de cualquier usuario.
- ✅ Middleware de sesión.
- ✅ Rate limiting en `/api/auth/login`.
- 🔄 Seguir completando `results` en DB conforme avance el torneo (18 insertados hasta ahora).