# Quiniela Mundial 2026

App web full-stack para crear quinielas de la fase de grupos del Mundial 2026, con leaderboard en vivo y soporte multi-usuario. Producción en `https://mundial.durazno.org`.

## Estado del proyecto

- Arquitectura v2 (Multi-usuario con login + DB Postgres) completada.
- Base de datos aprovisionada y usuarios/resultados insertados iniciales.
- Produccion estable en dominio oficial.

## Stack

- Frontend y Backend: Astro v6 + TypeScript (SSR mode).
- Estilos: Tailwind CSS v4.
- Base de datos: Postgres 17 (Aiven) gestionado con Drizzle ORM.
- Autenticación: Sesiones por token opaco + cookies `HttpOnly`, contraseñas hasheadas con `argon2id`.
- Deploy: Vercel Functions.

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar DB (requiere variable de entorno)
export DATABASE_URL_QUINIELA="postgres://user:pass@host/db"

# Correr entorno dev
npm run dev
```

## Operación durante el mundial

Los resultados de los partidos no viven en el código (a diferencia del catálogo de partidos). Para actualizar los resultados oficiales que alimentan el leaderboard:
1. Actualizar el script o conectarse a la DB para insertar/actualizar la tabla `results`.
2. Opcionalmente, usar `npx tsx scripts/seed-results.ts` para sincronizar marcadores y links de video.
3. El dashboard se actualiza automáticamente en cada request sin necesidad de redeploy.

## Estructura de Tablas

- `users`: Usuarios del sistema (provisionados por admin).
- `sessions`: Tokens de sesión activa.
- `predictions`: Predicciones de cada usuario por partido.
- `results`: Resultados reales del torneo.
