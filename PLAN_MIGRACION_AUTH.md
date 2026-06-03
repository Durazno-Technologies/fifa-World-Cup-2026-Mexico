# PLAN DE MIGRACIÓN — De "QR frontend-only" a "Multi-usuario con login + leaderboard"

> **Audiencia de este documento:** otro LLM de generación de código (y un dev senior que lo supervisa).
> **Objetivo:** que el ejecutor construya el backend, modifique el frontend y cree el esquema de DB
> siguiendo este contrato sin tener que re-decidir arquitectura. Las decisiones ya están tomadas y justificadas.

---

## 0. Resumen ejecutivo

Migramos la app actual (Astro frontend-only, sin backend, que comparte quinielas vía QR + lz-string en la URL)
a una app **multi-usuario** con:

1. **Login** con usuario y contraseña **provisionados por el admin** (sin registro público, sin reset de password).
2. **Editor**: cada usuario edita **su propia** quiniela hasta el deadline. Persistencia en **Postgres** (no más localStorage, no más QR).
3. **Dashboard / leaderboard**: tabla de puntos acumulados de todos los competidores, con link a cada quiniela.
4. **Vista readonly** de la quiniela de otro jugador (sin poder editarla).

**Se eliminan por completo:** QR, `lz-string`, `qr-code-styling`, `src/lib/codec.ts`, `src/components/ExportPanel.astro`,
toda la lógica de `localStorage` y el ruteo por hash `#q=<payload>`.

**Se conservan tal cual (o casi):** `src/data/matches.ts` (catálogo de partidos), `src/components/MatchCard.astro`,
el `<template>` de `src/components/ReadOnlyView.astro`, y las **reglas de validación** de `src/lib/validators.ts` / `src/lib/schema.ts`.

**Los resultados (`results.ts`) se migran a la DB.** Ya no viven en código — el admin los inserta/actualiza directamente en la tabla `results` y el dashboard se actualiza solo (sin redeploy).

---

## 1. Restricciones duras (no negociables)

| Restricción | Implicación |
|---|---|
| **Solo capas gratuitas** | Vercel Hobby + Aiven Postgres free. ~10 usuarios concurrentes máx. No se debe introducir nada de pago. |
| **Un solo stack, un solo origen** | Backend = endpoints de Astro desplegados como Vercel functions. Mismo dominio que el front → **sin CORS, sin API Gateway, sin IaC**. |
| **REST, no GraphQL ni websockets** | Endpoints REST clásicos. |
| **Vanilla TS + islas de Astro** | Prohibido React/Angular/Vue globales. Interactividad con TS plano; si algo lo amerita, una isla puntual o Alpine.js (~15 kB). El bundle JS debe quedarse mínimo. |
| **TypeScript end-to-end** | Reusar la lógica TS existente (`validators.ts`, `schema.ts`) en el servidor. No reescribir validación en otro lenguaje. |
| **No hay entorno de dev/test formal** | Ver §10 (Testing). Se recomienda fuertemente al menos previews de Vercel por rama. |
| **Producción** | `https://mundial.durazno.org` en Vercel, rama única `master` → deploy automático. |

---

## 2. Decisiones de stack (ya tomadas, con justificación)

### 2.1 Runtime de backend: **Endpoints de Astro (Vercel functions)**
- Se agrega el adapter `@astrojs/vercel`. Las páginas autenticadas y los endpoints `/api/*` se marcan `export const prerender = false` (server-rendered); el resto puede quedar estático en el CDN.
- **Por qué y no AWS Lambda:** auth + datos por usuario exige código de servidor sí o sí. Hacerlo dentro de Astro evita dos nubes, API Gateway, CORS, IAM e IaC. Un solo `git push` despliega front + back. Depuración local trivial con `astro dev` (mismo proceso, mismo terminal). A 10 usuarios las Vercel functions del tier Hobby son gratis de sobra.

### 2.2 Base de datos: **Aiven Postgres** (ya provisionada)
- La cadena de conexión vive en la env var **`DATABASE_URL_QUINIELA`** configurada en el dashboard de Vercel.
- Postgres encaja perfecto con el leaderboard (sumar puntos y ordenar entre usuarios = `JOIN` + `GROUP BY` + `ORDER BY`). No se usa NoSQL.

### 2.3 Driver: **`postgres` (postgres.js)**
- Aiven expone Postgres por **TCP con TLS** (no es un driver HTTP serverless tipo Neon).
- En funciones serverless, crear el cliente a nivel de módulo con **pool pequeño (`max: 1`)** para evitar tormentas de conexiones. A 10 usuarios no hay riesgo de agotar conexiones.
- **TLS obligatorio**: la `DATABASE_URL_QUINIELA` de Aiven trae `sslmode=require`. Respetarlo (`ssl: 'require'` o el CA de Aiven). Opcional: usar el endpoint de connection pooling (PgBouncer) de Aiven, pero a esta escala no hace falta.

### 2.4 ORM: **Drizzle ORM** (con `drizzle-kit` para migraciones)
**Justificación (el ejecutor debe respetarla):**
- **Sin binario de query-engine ni paso `generate` en runtime** → arranques en frío más pequeños en las Vercel functions (importa para que la app se sienta rápida en free tier).
- **Migraciones como SQL plano** generado por `drizzle-kit` → el dueño del proyecto quiere **ver y revisar el SQL**; Drizzle lo deja en archivos `.sql` legibles.
- **Tipos TS inferidos del esquema**, integra nativo con `postgres.js`.

### 2.5 Auth: **sesión por token opaco en DB + cookie httpOnly**
- Password con **argon2id** (`@node-rs/argon2` o `argon2`). Alternativa: `bcrypt`. **No** crypto a mano.
- Sesión: token aleatorio (`crypto.randomUUID()` o 32 bytes base64url) guardado en tabla `sessions`; se manda en cookie `session` **`HttpOnly` + `Secure` + `SameSite=Lax`**.
- Como el token es opaco y se valida contra la DB, **no se requiere secret de firma** (menos config, menos superficie).
- **Sin registro público, sin reset.** El admin inserta usuarios con un script de seed o manualmente en DB (§5.2).

---

## 3. Modelo de datos

### 3.1 Esquema Postgres (lo que el ejecutor debe crear vía migración Drizzle)

```sql
-- Usuarios (provisionados por el admin; sin signup)
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,        -- credencial de login (lowercase recomendado)
  password_hash TEXT NOT NULL,               -- argon2id
  display_name  TEXT NOT NULL,               -- "apodo" visible (≤ 15 chars); default = username
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sesiones (token opaco)
CREATE TABLE sessions (
  token       TEXT PRIMARY KEY,              -- aleatorio, opaco
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Predicciones: 1 fila por (usuario, partido). Ejemplo para 10 users × 72 partidos = 720 filas.
CREATE TABLE predictions (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id      INTEGER NOT NULL,            -- valida contra catálogo en matches.ts (1..72)
  resultado     CHAR(1) NOT NULL,            -- 'L' | 'E' | 'V'
  goles_local   SMALLINT NOT NULL CHECK (goles_local BETWEEN 0 AND 15),
  goles_visita  SMALLINT NOT NULL CHECK (goles_visita BETWEEN 0 AND 15),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, match_id),
  CHECK (resultado IN ('L','E','V'))
);

-- Resultados reales: el admin inserta/actualiza conforme avanza el torneo.
-- Sin redeploy: el dashboard y scoring leen de esta tabla en cada request.
CREATE TABLE results (
  id            SERIAL PRIMARY KEY,
  match_id      INTEGER NOT NULL UNIQUE,       -- 1..72, uno por partido
  goles_local   SMALLINT NOT NULL CHECK (goles_local BETWEEN 0 AND 15),
  goles_visita  SMALLINT NOT NULL CHECK (goles_visita BETWEEN 0 AND 15),
  video         TEXT NOT NULL DEFAULT '',       -- URL del resumen oficial en YouTube
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **`matches`** NO va a la DB. Sigue hardcodeado en `src/data/matches.ts` (catálogo estático de 72 partidos).
- **`results`** SÍ va a la DB. Tabla `results` (ver §3.1). El admin inserta/actualiza filas directamente; el dashboard y scoring leen de ahí sin redeploy.
- El scoring se calcula en TS comparando `predictions` (de la DB) contra `results` (también de la DB). Ver §7.

### 3.2 Mapeo del payload viejo → nuevo
El payload v1 (`{v, n, p:[[id,r,gl,gv]]}`) que viajaba en el QR se descompone así:
- `n` (apodo) → `users.display_name`.
- cada item `[id, r, gl, gv]` → una fila en `predictions`.
- `v` (versión de schema) → **se elimina** (ya no hay payload portable que versionar).

---

## 4. Arquitectura de rutas

### 4.1 Páginas (Astro, todas `prerender = false` salvo `/login`)
| Ruta | Acceso | Render | Descripción |
|---|---|---|---|
| `/login` | Público | Estático o SSR | Formulario de login. Si ya hay sesión, redirige a `/`. |
| `/` | Requiere sesión | SSR | **Editor** de la quiniela propia (antes del deadline). Pasado el deadline se vuelve readonly como `/quiniela/[username]`. Primera pantalla tras login. |
| `/dashboard` | Requiere sesión | SSR | **Leaderboard**: ranking de puntos de todos, con link a `/quiniela/[username]` de cada uno. Renderizado server-side → **cero JS**. |
| `/quiniela/[username]` | Requiere sesión | SSR | Vista **readonly** de la quiniela de `username`. Reusa el `<template>` de `ReadOnlyView`. |

> **Flujo de navegación:**
> - Usuario loguea → cae al **editor** (`/`) para llenar su quiniela. El dashboard es una página separada a la que se navega.
> - Antes del deadline: `/` permite editar, las demás rutas son readonly.
> - Después del deadline: `/` se vuelve readonly (el `PUT` lo rechaza server-side). Todos los `/quiniela/[username]` funcionan igual.
> - El dashboard solo incluye usuarios que hayan guardado **al menos una predicción**. Usuarios sin ninguna predicción no aparecen en el leaderboard. Usuarios con predicciones parciales (menos de 72) sí aparecen con los puntos que hayan acumulado.
>
> **Política de redirect:** cualquier ruta protegida sin sesión válida redirige silenciosamente a `/login` (sin mensaje de error ni código de estado). Lo mismo si la sesión expiró: redirect limpio, no ventana de error. El login es la única página pública y es el destino natural.

### 4.2 Endpoints REST (`/api/*`, `prerender = false`)
| Método + ruta | Cuerpo | Efecto |
|---|---|---|
| `POST /api/auth/login` | `{ username, password }` | Verifica argon2, crea sesión, set-cookie. Responde `{ ok: true }` o `401` con mensaje genérico. |
| `POST /api/auth/logout` | — | Borra la sesión en DB y limpia la cookie. |
| `PUT /api/quiniela` | `{ predicciones: [{ matchId: number, resultado: 'L'\|'E'\|'V', golesLocal: number, golesVisita: number }] }` | Guarda/actualiza las predicciones **del usuario de la sesión**. Validado y **bloqueado por deadline** server-side. Upsert sobre `(user_id, match_id)`. |

> **Notas:**
>
> 1. **Formato explícito** — ya no hay limitación de espacio (antes el payload viajaba comprimido en el QR). Todos los campos usan nombres autodescriptivos en camelCase. Se eliminan los atajos heredados (`p`, `r`, `gl`, `gv`, `id` como posicional).
>
> 2. **SSR para lecturas** — las lecturas (editor propio, dashboard, readonly de otro) las hace el **render SSR** consultando la DB directo con Drizzle. El único dato que el cliente envía de vuelta es el guardado (`PUT /api/quiniela`). Esto minimiza endpoints y superficie.
>
> 3. **Auditoría de endpoints** — los 3 endpoints son suficientes y seguros:
>    - Login/logout cubren auth.
>    - `PUT /api/quiniela` cubre la única escritura con validación server-side de ownership y deadline.
>    - No hacen falta endpoints de lectura (SSR), ni admin (el admin escribe directo en la DB), ni de registro (admin provisiona).

### 4.3 Middleware (`src/middleware.ts`)
- Lee la cookie `session`, busca el token en `sessions`, valida expiración.
- Si es válido: adjunta el usuario a `Astro.locals.user` (`{ id, username, display_name }`).
- Si no: redirect silencioso a `/login` (sin mensaje ni código de error). Deja pasar `/login` y assets públicos.

---

## 5. Auth — detalle de implementación

### 5.1 Flujo de login
1. `POST /api/auth/login` con `{ username, password }`.
2. Buscar user por `username` (lowercase). Si no existe → `401` con **mensaje genérico** ("Usuario o contraseña inválidos") — no revelar cuál falló.
3. `argon2.verify(password_hash, password)`. Si falla → mismo `401` genérico.
4. Generar token, insertar en `sessions` con `expires_at` (sugerido: fin del torneo o +30 días).
5. `Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...`.
6. Responder `{ ok: true }`; el front redirige a `/`.

### 5.2 Seed de usuarios (script para el admin)
- Crear `scripts/seed-users.ts` (corre con `node`/`tsx`) que recibe pares `username:password`, hashea con argon2 e inserta en `users`. El admin lo corre a mano una vez. Documentar el comando en el README.
- **Nunca** commitear contraseñas en claro ni hashes reales al repo.

### 5.3 Logout
- `POST /api/auth/logout`: `DELETE FROM sessions WHERE token = ...` + cookie con `Max-Age=0`.

---

## 6. Autorización (server-side, sin confiar en el cliente)

1. **Todas** las páginas/endpoints (excepto `/login`) requieren sesión válida.
2. `PUT /api/quiniela` escribe **solo** sobre `user_id = session.user.id`. Nunca aceptar un `user_id` del cliente.
3. Cada item validado con la lógica existente de `validators.ts` (matchId en catálogo, goles 0..15, coherencia `resultado` vs `golesLocal/golesVisita`, sin duplicados).
4. **Deadline server-side**: si `Date.now() > DEV_DEADLINE_ISO`, el `PUT` responde error tipado y **no escribe**. El bloqueo en la UI es solo cosmético; la verdad vive en el servidor.
5. `/quiniela/[username]` es readonly para cualquiera logueado — nunca expone endpoint de escritura para datos ajenos.


---

## 7. Scoring (centralizar en `src/lib/scoring.ts`)

Reglas (de `CLAUDE.md`, sin cambios):
- **+3**: marcador exacto (`golesLocal` y `golesVisita` coinciden con el real).
- **+1**: solo acierta resultado (`L`/`E`/`V` correcto, marcador distinto).
- **+0**: fallo.
- Partidos sin resultado en la tabla `results`: no suman ni restan.

- Implementar `scoreUserPredictions(preds, results): number` y reusarla en:
  - `/dashboard` (suma por usuario, ordena desc).
  - `/quiniela/[username]` y el sticky de puntos del readonly.
- Volumen trivial: 10 users × 72 filas. Cargar todo y computar en TS está bien; no hace falta optimizar en SQL.

---

## 8. Cambios concretos en el frontend

### 8.1 Eliminar
- `src/components/ExportPanel.astro`, `src/lib/codec.ts`.
- Dependencias `lz-string`, `@types/lz-string`, `qr-code-styling` de `package.json`.
- Toda la lógica de `localStorage` (`STORAGE_KEY`, `saveDraft`, `loadDraft`).
- Ruteo por hash `#q=` y la vista `export`.

### 8.2 Refactorizar (higiene crítica antes de añadir features)
- **Sacar el JS inline de `src/pages/index.astro`** (527 líneas) a módulos `.ts` en `src/lib/`:
  - `src/lib/editor.ts`: estado del editor, lectura de selects, autosave (debounced) → `PUT /api/quiniela`, update de badges, countdown del deadline.
  - El editor ya no genera QR; el botón "Generar QR" se reemplaza por **guardado automático** (o un botón "Guardar" explícito) que llama al `PUT`.
- Motivo: módulos chicos con una responsabilidad son mucho más fáciles de generar/depurar para un LLM que un script monolítico inline.

**Estrategia de guardado:**
- Cada vez que el usuario cambia el resultado de un partido, se dispara un **autosave con debounce de 1.5s** (no bloqueante para que la UI no se entorpezca) que envía vía `PUT /api/quiniela` **todas las predicciones acumuladas hasta ese momento** (no solo la cambiada). Así el servidor siempre recibe el estado completo y no hay riesgo de desincronización.
- Adicionalmente, se escribe en `localStorage` (clave `quiniela_draft`) el mismo payload como **draft de recuperación**. Si el usuario recarga antes de que el PUT se complete, al cargar la página se comparan las fechas: si el draft es más reciente que lo devuelto por el SSR, se ofrece restaurarlo.
- Tras un PUT exitoso, se limpia el draft de `localStorage`. El servidor es siempre la fuente de verdad; localStorage es solo una red de seguridad ante cierres inesperados del navegador.
- El PUT es **idempotente**: enviar el mismo estado completo múltiples veces es seguro (upsert sobre `(user_id, match_id)`).

### 8.3 Modificar
- `/` (editor): el SSR consulta las predicciones del usuario y las inyecta como estado inicial (data-attributes o un `<script type="application/json">`). El front hidrata los selects con eso.
- **Eliminar el "name gating"**: hoy se exige escribir el apodo antes de ver los partidos. Con login, el usuario ya está identificado (`display_name`), así que los partidos se muestran directo. (Esto cambia un requisito de `CLAUDE.md` — actualizar el contrato, §9.)
- `ReadOnlyView`: el `<template>` se conserva; cambia la fuente de datos: en vez de decodificar un payload de la URL, el SSR de `/quiniela/[username]` pasa las predicciones desde la DB.
- Botón "DEV: Aleatorio": opcional, conservar para testing rápido (llena los 72 y dispara el guardado).

### 8.4 Nuevas pantallas
- `/login`: form simple, mismo lenguaje visual (Tailwind v4, naranja/verde Durazno). Puede explorarse con Stitch como referencia visual.
- `/dashboard`: tabla/cards de ranking (posición, display_name como link a `/quiniela/[username]`, puntos). El nombre del usuario es el propio link — nada de columnas "ver" redundantes. Render SSR, cero JS. Sticky header opcional.

---

## 9. Variables de entorno y config

| Var | Dónde | Notas |
|---|---|---|
| `DATABASE_URL_QUINIELA` | Vercel (dashboard) | Cadena de conexión a Aiven con `sslmode=require`. Se inyecta en el entorno del deploy. No hay `.env` local — el dev la pone manualmente en el dashboard de Vercel y la pipeline la inyecta en build y runtime. |

- `astro.config.mjs`: añadir `import vercel from '@astrojs/vercel'` y `adapter: vercel()`, definir `output` acorde (estático por defecto + páginas `prerender=false`).
- Actualizar `CLAUDE.md`: el contrato de QR v1 queda **obsoleto**. Reescribirlo como contrato v2 (auth + DB): esquema de tablas, reglas de autorización, deadline server-side, nota de que `matches.ts` sigue en código y `results` vive en DB.

---

## 10. Testing y debugging — todo en prod

No hay base de datos de desarrollo ni staging. Todo se prueba directamente en el proyecto de Vercel actual, que apunta a la misma DB de Aiven. Como los usuarios aún usan la app vieja por QR (sin backend), no hay riesgo de corromper datos activos — la DB nueva está vacía hasta el corte.

1. **Previews de Vercel:** crear una rama y dejar que Vercel genere un **preview deployment** con la misma `DATABASE_URL_QUINIELA`. Probar login real ahí antes de mergear a `master`.
2. **Smoke test manual obligatorio:** login → editar → guardar → recargar (persiste) → ver en dashboard → abrir `/quiniela/<username>` readonly → intentar editar ajena (debe ser imposible) → intentar `PUT` tras deadline (debe rechazar).
3. Si todo funciona → borrar tablas vía SQL, hacer seed de usuarios, hacer deploy a `master` y listo.

---

## 11. Checklist de seguridad (revisar al final con `/security-review`)

- [ ] Cookies `HttpOnly` + `Secure` + `SameSite=Lax`.
- [ ] Passwords con argon2id (nunca en claro, nunca commiteadas).
- [ ] Mensajes de error de login genéricos (no revelar si falló user o pass).
- [ ] Ownership server-side en `PUT` (jamás aceptar `user_id` del cliente).
- [ ] Deadline validado en servidor en cada escritura.
- [ ] Validación de `match_id` y goles reusando `validators.ts`.
- [ ] TLS a Aiven (`sslmode=require`).
- [ ] `DATABASE_URL_QUINIELA` y código de DB **solo en archivos de servidor / endpoints** — verificar que ningún `<script>` de cliente importe `db.ts` (no debe filtrarse al bundle).
- [ ] Expiración de sesión + invalidación en logout.
- [ ] Establecer rate-limit de proteccion con 5 peticiones por minuto en `/api/auth/login`.

---

## 12. Orden de ejecución sugerido (fases)

1. **Infra:** adapter `@astrojs/vercel`; deps `drizzle-orm`, `drizzle-kit`, `postgres`, `@node-rs/argon2`; configurar `DATABASE_URL_QUINIELA` en dashboard de Vercel; `drizzle.config.ts`.
2. **Schema + migración** (`drizzle-kit generate` → revisar el SQL) + `scripts/seed-users.ts`.
3. **Capa DB:** `src/lib/db.ts` — cliente postgres.js con pool **`max:1`** (una conexión por instancia serverless; Vercel escala horizontalmente, cada función fría abre su propia conexión. Con ~10 usuarios y peticiones esporádicas no se agota el límite de Aiven free). `ssl: 'require'`. + `src/lib/db/schema.ts` (Drizzle).
4. **Auth:** `POST /api/auth/login`, `POST /api/auth/logout`, `src/middleware.ts`, página `/login`.
5. **Editor:** refactor del JS inline a `src/lib/editor.ts`; carga vía SSR; `PUT /api/quiniela`; eliminar QR/codec/localStorage/ExportPanel y deps; quitar name-gating.
6. **Scoring:** `src/lib/scoring.ts`.
7. **Dashboard** `/dashboard` (SSR ranking).
8. **Readonly** `/quiniela/[username]` (SSR reusando template).
9. **Deadline** server-side.
10. **Reescribir `CLAUDE.md` y `GEMINI.md`** al contrato v2 + **security review** + smoke test en preview de Vercel.

---

## Apéndice A — Qué modelo/herramienta usar en cada fase (costo-beneficio)

> Premisa del dueño: el código lo hace IA, no humanos. Su tiempo es el recurso caro. Regla general:
> **usar de pago (Opus / Claude Code) donde un bug = hueco de seguridad o pérdida de datos; usar gratis donde el peor caso es "se ve feo" o "hay que iterar un poco".**

| Fase / tipo de trabajo | Recomendación | Por qué |
|---|---|---|
| **Auth, sesión, middleware, ownership, deadline server-side** (fases 4, 6-deadline, 11) | **De pago — Opus 4.8 / Claude Code.** No arriesgar. | Un error aquí = cuentas comprometidas o editar quiniela ajena. Radio de impacto máximo. |
| **Esquema de DB + migraciones + capa Drizzle/conexión** (fases 1-3) | **De pago.** | Errores de schema/SSL/pool son caros de revertir en prod sin entorno de pruebas. |
| **Endpoint `PUT` con validación** (fase 5-save) | **De pago** (la validación toca integridad). | Es la única escritura; debe estar blindada. |
| **Refactor del JS inline a módulos** (fase 5) | **Gratis** (Cline con modelo free / Copilot free / OpenRouter free + opencode). | Mecánico, sin riesgo de seguridad; el peor caso es iterar. Revisión rápida con modelo de pago opcional. |
| **Maquetado UI: `/login`, `/dashboard`, ajustes Tailwind** (fases 4, 7) | **Gratis** + **Stitch/Banani** para referencia visual. | Es presentación; un humano detecta al instante si quedó mal. |
| **Vista readonly reusando template** (fase 8) | **Gratis**, con revisión de pago del cálculo de puntos. | El template ya existe; es cableado de datos. |
| **Scoring** (fase 6) | **De pago o gratis con revisión de pago.** | Lógica con aristas (exacto vs resultado vs sin jugar); barato de verificar pero molesto si sale mal. |
| **Security review final** (fase 10) | **De pago — Opus / `/security-review`.** | Es justamente el momento de no escatimar. |

**Advertencia honesta sobre orquestar varias herramientas gratis (opencode + OpenRouter free + Cline free + Copilot free):**
los modelos gratuitos son más débiles → más iteraciones, más debugging, más context-switching entre herramientas. En trabajo
mecánico (UI, refactor, docs) el ahorro es real. En auth/DB/seguridad, el tiempo perdido depurando salidas mediocres suele
costar **más** (en tu tiempo) que lo que ahorras en tokens. **No mezcles herramientas en las fases sensibles**: ahí, una sola
herramienta de pago capaz, de corrido, es lo más barato en términos reales.

---

## Apéndice B — Inventario de archivos

**Conservar:** `src/data/matches.ts`, `src/components/MatchCard.astro`,
`<template>` de `src/components/ReadOnlyView.astro`, reglas de `src/lib/validators.ts`, tipos de `src/lib/schema.ts`.

**Eliminar:** `src/data/results.ts`, `src/lib/codec.ts`, `src/components/ExportPanel.astro`, deps `lz-string` / `@types/lz-string` / `qr-code-styling`, lógica de `localStorage`, ruteo `#q=`.

**Crear:** `astro.config.mjs` (adapter), `drizzle.config.ts`, `src/lib/db.ts`, `src/lib/db/schema.ts`,
`src/lib/scoring.ts`, `src/lib/editor.ts`, `src/middleware.ts`, `src/pages/login.astro`,
`src/pages/dashboard.astro`, `src/pages/quiniela/[username].astro`, `src/pages/api/auth/login.ts`,
`src/pages/api/auth/logout.ts`, `src/pages/api/quiniela.ts`, `scripts/seed-users.ts`.

**Modificar:** `src/pages/index.astro` (editor: SSR + guardado + sin gating/QR/localStorage),
`src/components/PredictionForm.astro` (quitar QR/gating), `src/components/ReadOnlyView.astro` (fuente de datos = DB),
`package.json` (deps), `CLAUDE.md` (contrato v2).
