# Quiniela Mundial 2026

App web frontend-only para crear quinielas de fase de grupos, generar imagen QR y leer quinielas desde URL. Ya esta en produccion en `https://mundial.durazno.org`.

## Estado del proyecto

- Produccion estable en dominio oficial.
- Sin backend, sin login, sin base de datos.
- Compatibilidad de QR cerrada bajo schema `v=1`.
- Export disponible solo como descarga de imagen QR (`.png`).
- Modo DEV aleatorio llena los 72 partidos para acelerar testing manual.

## Estado de datos deportivos (audit web)

- Se hizo doble-check contra paginas publicas de grupos de 2026 (Wikipedia + referencias FIFA en esas paginas).
- Grupo A ya corregido a `Rep. Checa`.
- Se corrigieron desalineaciones de equipos por grupo en B, D, I, K y L.
- Pendiente: verificacion fina de horarios y estadios partido a partido contra snapshot canonico antes de considerar el fixture cerrado.

## Stack

- Astro v6 + TypeScript.
- Tailwind CSS v4.
- `qr-code-styling` para render y descarga del QR.
- `lz-string` para compresion del payload en hash.
- Deploy en Vercel.

## Desarrollo rapido

```bash
npm install
npm run dev
npm run build
npm run preview
```

`dev` usa `--host` para pruebas en movil por red local.

## Modelo de datos y flujo

```text
Sin hash                -> modo crear
#q=<payload_comprimido> -> modo readonly
```

Estado persistente:
1. URL hash: quiniela completa del usuario.
2. `localStorage` (`quiniela_draft`): borrador en modo crear.
3. `src/data/results.ts`: resultados reales para scoring readonly.

## Scoring readonly

- +3: marcador exacto.
- +1: acierta L/E/V pero no marcador.
- +0: fallo.
- Sin resultado real cargado: no suma ni resta.

## Operacion durante el mundial

- Cargar resultados reales en `src/data/results.ts`.
- Ejecutar build y deploy.
- Los QR historicos siguen validos porque el payload viaja en la URL.

## Notas clave para mantenimiento

- No romper `src/lib/codec.ts` ni `src/lib/validators.ts` sin revisar compatibilidad de `v=1`.
- `src/data/matches.ts` debe conservar 72 IDs unicos y estables.
- La URL codificada en QR siempre debe apuntar a `https://mundial.durazno.org/#q=...`.
- Solo limpiar `quiniela_draft` al entrar a modo readonly valido.

## Backlog sugerido (post-produccion)

- Agregar tests unitarios para `decodePayload`/`validatePayload` con casos corruptos reales.
- Panel admin local (solo dev) para editar `results.ts` con validaciones antes de commit.
- Telemetria opcional sin datos personales (eventos UI basicos) para detectar friccion.
