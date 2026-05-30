# Quiniela Mundial 2026

App web para crear y compartir quinielas de la fase de grupos del Mundial 2026 mediante QR. Sin backend, sin login, sin base de datos.

## Objetivo

- Llenar pronosticos de los 72 partidos de primera fase.
- Generar un QR con tu quiniela codificada.
- Compartir la imagen del QR por WhatsApp u otras apps.
- Cualquier persona escanea el QR y ve tus pronosticos + puntaje en tiempo real.

## Stack

- **Astro v6** + TypeScript
- **Tailwind CSS v4**
- **qr-code-styling** para QR estilizado con logo
- **lz-string** para compresion de payload en URL
- **Vercel** para deploy (dominio: `mundial.durazno.org`)

## Desarrollo

```bash
npm install
npm run dev        # Abre en http://localhost:4321 + red local
npm run build      # Build estatico
npm run preview    # Preview del build
```

El script `dev` usa `--host` para exponer en red local y probar en dispositivos moviles.

## Arquitectura

```
URL sin hash → Modo crear quiniela
URL con #q=<payload> → Modo readonly (ver quiniela de alguien)
```

Todo el estado vive en:
1. **URL hash**: payload comprimido con lz-string (la quiniela completa).
2. **localStorage**: borrador mientras llenas la quiniela (se restaura si cierras la app).
3. **`src/data/results.ts`**: resultados reales del mundial (se actualiza manualmente).

## Scoring

- **+3 puntos**: acertar marcador exacto.
- **+1 punto**: acertar resultado (L/E/V) pero no el marcador.
- **+0 puntos**: fallo total.

Los puntos se calculan automaticamente al ver una quiniela si hay resultados cargados en `results.ts`.

## Deploy y actualizacion de resultados

Durante el mundial, se actualiza `src/data/results.ts` con los marcadores reales y se hace deploy. Los QR existentes siguen funcionando sin cambios ya que la data del usuario esta en la URL.

## Dominio

El QR siempre codifica `https://mundial.durazno.org/#q=...` sin importar donde se genere.
