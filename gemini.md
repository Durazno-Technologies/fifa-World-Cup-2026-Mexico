# gemini.md - Guia de implementacion frontend y backend

Este documento define como esta construida la arquitectura de la Quiniela Mundial 2026.

## Stack (v2 Multi-usuario)

- Astro v6 + TypeScript.
- Backend: Vercel functions (Astro en modo SSR `prerender = false`).
- Base de datos: Postgres 17 (Aiven) con Drizzle ORM.
- Auth: Autenticación por cookie de sesión (`HttpOnly`) con hash `argon2id`.
- Estilos: Tailwind CSS v4 con tokens en `src/styles/global.css`.
- Deploy: Vercel (dominio: `mundial.durazno.org`).

## Estructura del proyecto

```text
src/
  pages/
    index.astro          # Editor de quiniela propia (requiere login)
    login.astro          # Formulario de inicio de sesión
    dashboard.astro      # Leaderboard y ranking de todos los usuarios
    quiniela/
      [username].astro   # Vista readonly de la quiniela de otro usuario
    api/                 # Endpoints REST (auth, quiniela)
  components/
    MatchCard.astro      # Tarjeta de partido (selects de goles, badge resultado)
    PredictionForm.astro # Formulario de grid de partidos
  data/
    matches.ts           # 72 partidos de fase de grupos (hardcoded)
  lib/
    db/
      schema.ts          # Definición de tablas Drizzle (users, sessions, predictions, results)
    db.ts                # Cliente Postgres
    editor.ts            # Lógica cliente del editor (autosave, draft)
    scoring.ts           # Lógica de puntaje
    validators.ts        # Validacion de datos y deadline
  middleware.ts          # Protección de rutas por sesión
```

## Flujo de uso

### 1. Autenticación (`/login`)
- Los usuarios son provisionados por el administrador (no hay registro público).
- Acceso con username y contraseña (protegido por rate-limiting in-memory).

### 2. Editor de quiniela (`/`)
- Carga las predicciones guardadas en DB mediante SSR.
- Cada cambio de marcador genera un **autosave con debounce de 1.5s** hacia `PUT /api/quiniela`.
- Como resguardo contra errores de red, se mantiene un borrador en `localStorage` (`quiniela_draft_{username}`) que se sincroniza con el estado del servidor.
- El servidor valida estrictamente la fecha límite (deadline) antes de aceptar cambios.

### 3. Dashboard (`/dashboard`)
- Ranking global ordenado por puntaje.
- Renderizado 100% Server-Side (cero JS).

### 4. Vista Readonly (`/quiniela/[username]`)
- Muestra las predicciones de otro jugador.
- Score calculado contra los resultados reales almacenados en la tabla `results`.
- Componentes visuales como badges de estado y videos de YouTube.

## Diseño visual

- Header: "FIFA World Cup 2026" con emoticons de paises sede.
- Tokens de color:
  - `--color-dz-orange: #FF4B1F` (CTA, nombre resaltado)
  - `--color-dz-green: #7DD934` (local gana, progreso)
  - `--color-dz-dark: #201E47` (visita gana, texto principal)
  - `--color-dz-light: #E3E3E3` (inputs, fondos)

## Scripts de Administración

- `npx tsx scripts/seed-users.ts`: Crea usuarios en la DB.
- `npx tsx scripts/seed-results.ts`: Sincroniza resultados reales de los partidos (usado durante el torneo).

## Notas importantes

- La DB es la única fuente de verdad. El QR y la lógica de payload por URL fueron eliminados en v2.
- Las contraseñas están hasheadas con `argon2id`.
- La URL de la DB vive en la variable de entorno `DATABASE_URL_QUINIELA`.
