# CLAUDE.md - Contrato tecnico y reglas de datos

Este documento define el contrato tecnico que debe respetar cualquier implementacion para mantener compatibilidad de QR entre versiones.

## Principios de arquitectura

- App frontend-only (Astro + TypeScript + Tailwind v4).
- El QR contiene toda la informacion necesaria para lectura.
- Catalogo de 72 partidos de fase de grupos vive hardcodeado en `src/data/matches.ts`.
- Resultados reales se llenan manualmente en `src/data/results.ts` conforme avanza el torneo.
- La URL del QR siempre apunta al dominio oficial: `https://mundial.durazno.org/#q=<payload>`
- Sin backend, sin APIs externas, sin autenticacion.

## Esquema canonico v1

```json
{
  "v": 1,
  "n": "Hugo",
  "p": [[1,"L",2,1],[2,"E",0,0],[3,"V",1,2]]
}
```

### Campos

- `v` number: version de schema, obligatorio, debe ser `1`.
- `n` string: apodo del usuario, obligatorio, max 10 caracteres, `trim()` aplicado.
- `p` array: predicciones (debe contener exactamente los 72 partidos).
- item de `p`: `[id, r, gl, gv]`
  - `id` number entero positivo (1-72).
  - `r` enum `L|E|V`.
  - `gl` number entero 0..15.
  - `gv` number entero 0..15.

## Algoritmo de encode/decode (normativo)

### Encode

1. Validar payload logico.
2. Ordenar `p` por `id` ascendente (determinismo).
3. `json = JSON.stringify(payload)` sin campos extra.
4. `packed = compressToEncodedURIComponent(json)` (lz-string).
5. Construir URL final: `https://mundial.durazno.org/#q=${packed}`.

### Decode

1. Leer `q` del hash.
2. `json = decompressFromEncodedURIComponent(q)`.
3. Parse JSON y validar schema.
4. Verificar integridad semantica:
   - IDs unicos.
   - IDs existentes en catalogo.
   - coherencia `r` contra `gl/gv`.
5. Si falla, retornar error tipado y no romper la UI.

## Reglas de validacion estrictas

1. **Payload General**:
   - `v` debe ser `1`.
   - `n` no debe estar vacio, max **10 caracteres**.

2. **Predicciones (`p`)**:
   - Debe contener exactamente todos los IDs definidos en `matches.ts`.
   - No debe haber IDs duplicados o desconocidos.
   - Goles enteros entre `0` y `15`.
   - `resultado` debe coincidir con el marcador (L: gl>gv, E: gl==gv, V: gl<gv).

## Sistema de scoring (vista readonly)

Archivo: `src/data/results.ts` - se llena manualmente con resultados reales.

Reglas de puntuacion:
- **+3 puntos**: marcador exacto (gl y gv coinciden con resultado real).
- **+1 punto**: acertar solo el resultado general (L/E/V correcto, marcador diferente).
- **+0 puntos**: fallo total.
- Partidos sin jugar no suman ni restan.

Visual en la card:
- +3: card brilla con borde esmeralda, badge animado.
- +1: card con borde azul sutil.
- +0: badge gris neutro.
- Sin jugar: guion gris.

Score total: sticky en el top de la vista readonly, siempre visible.

## Persistencia (localStorage)

- Clave: `quiniela_draft`.
- Se guarda automaticamente cada cambio de marcador o nombre.
- Se restaura al volver a la app (previene perdida por recarga, cambio de app, etc).
- Solo se limpia cuando se entra en modo readonly (`#q=...` valido).
- NUNCA se limpia al generar el QR (el usuario necesita tiempo para compartir).

## Deadline

- Fecha limite configurable en `src/lib/validators.ts` (`DEV_DEADLINE_ISO`).
- Si la fecha ha pasado, se bloquea la creacion de nuevas quinielas.
- Countdown con colores: verde (>7 dias), amarillo (1-7 dias), rojo (<1 dia).
- Formato humano: "12d 5h 30m" en vez de horas crudas.

## URL del QR

El QR siempre codifica la URL de produccion `https://mundial.durazno.org/#q=...` sin importar el entorno donde se genere (localhost, preview, etc). Esto asegura que los QR funcionan al escanearlos desde cualquier dispositivo.

## Flujo de navegacion

- Sin hash o hash vacio → modo crear.
- `#q=<payload>` → modo readonly.
- Vista export: no se resetea al perder foco del navegador. El hashchange solo redirige si no estamos en vista export.

## Compartir

- En dispositivos con Web Share API + soporte de archivos (iOS/Android): boton "Compartir QR" que envia la imagen PNG directamente via la hoja nativa del sistema.
- Fallback: solo boton "Descargar QR".
- No se usa el deep link de WhatsApp con URL de texto (es feo y sospechoso para los usuarios).

## Gating del formulario

- El usuario debe escribir su apodo ANTES de poder ver/llenar los partidos.
- Los match cards estan ocultos hasta que haya nombre.
- Esto evita frustracion: llenar 72 partidos y no saber por que no se activa el boton.

## Assets

- Logo: `/public/logo.svg` (isotipo Durazno cuadrado 150x150, fondo transparente).
- Los archivos `Durazno_isotipo_*@1x.svg` fueron eliminados.

## Errores tipados

```ts
export const FALTA_QUINIELA = 'FALTA_QUINIELA';
export const QUINIELA_CORRUPTA_O_INVALIDA = 'QUINIELA_CORRUPTA_O_INVALIDA';
export const VERSION_DE_QUINIELA_NO_SOPORTADA = 'VERSION_DE_QUINIELA_NO_SOPORTADA';
export const DATOS_DE_QUINIELA_INVALIDOS = 'DATOS_DE_QUINIELA_INVALIDOS';
export const PARTIDO_DUPLICADO_EN_QUINIELA = 'PARTIDO_DUPLICADO_EN_QUINIELA';
export const PARTIDO_DESCONOCIDO_EN_QUINIELA = 'PARTIDO_DESCONOCIDO_EN_QUINIELA';
export const RESULTADO_Y_MARCADOR_INCOHERENTES = 'RESULTADO_Y_MARCADOR_INCOHERENTES';
```

## Politica de compatibilidad

- `v=1` es obligatorio.
- Si llega una version futura no soportada: mostrar mensaje claro, no intentar parse parcial.
- No reutilizar `v` con semantica distinta.

## Archivos clave

- `src/pages/index.astro`: punto de entrada, routing, logica principal.
- `src/components/PredictionForm.astro`: formulario con gating de nombre.
- `src/components/MatchCard.astro`: tarjeta de partido individual.
- `src/components/ExportPanel.astro`: vista de QR generado + botones compartir.
- `src/components/ReadOnlyView.astro`: vista readonly con scoring.
- `src/components/ErrorState.astro`: pantalla de error.
- `src/data/matches.ts`: 72 partidos de fase de grupos.
- `src/data/results.ts`: resultados reales (se llena manualmente durante el mundial).
- `src/lib/codec.ts`: encode/decode con lz-string.
- `src/lib/schema.ts`: tipos TypeScript y constantes de error.
- `src/lib/validators.ts`: validacion de payload y deadline.
