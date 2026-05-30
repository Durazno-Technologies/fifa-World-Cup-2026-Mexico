# gemini.md - Guia de implementacion frontend

Este documento define como esta construida la interfaz de la Quiniela Mundial 2026.

## Stack

- Astro v6 + TypeScript.
- Estilos: Tailwind CSS v4 con tokens en `src/styles/global.css`.
- QR local estilizado: `qr-code-styling` v1.9.
- Compresion payload: `lz-string`.
- Deploy: Vercel (dominio: `fifa-world-cup-2026-mexico.vercel.app`).

## Estructura del proyecto

```text
src/
  pages/
    index.astro          # Punto de entrada, routing, logica JS principal
  components/
    MatchCard.astro      # Tarjeta de partido (selects de goles, badge resultado)
    PredictionForm.astro # Formulario con gating de nombre + grid de partidos
    ExportPanel.astro    # QR generado + botones de compartir/descargar
    ReadOnlyView.astro   # Vista readonly con scoring y puntos por card
    ErrorState.astro     # Pantalla de error amigable
  data/
    matches.ts           # 72 partidos de fase de grupos (hardcoded)
    results.ts           # Resultados reales (se llena manualmente)
  lib/
    schema.ts            # Tipos TypeScript y errores tipados
    codec.ts             # encode/decode con lz-string
    validators.ts        # Validacion de payload y deadline
  styles/
    global.css           # Tailwind config + tokens de color
public/
  logo.svg              # Isotipo Durazno cuadrado (150x150, transparente)
  favicon.svg
  favicon.ico
```

## Modos de la app

### 1. Modo crear quiniela (sin hash en URL)

Flujo:
1. Usuario escribe su apodo (obligatorio, max 10 chars).
2. Solo al tener apodo se desbloquean los 72 partidos.
3. Titulo cambia dinamicamente a "La Quiniela de XX".
4. Cada cambio de marcador se guarda en localStorage automaticamente.
5. Al completar todos los partidos se activa el boton "Crear QR".
6. Al generar: se crea URL con dominio de produccion, se muestra QR con spinner de carga.

### 2. Modo export (despues de generar QR)

- QR estilizado con logo Durazno centrado.
- Boton "Compartir QR" (Web Share API con imagen) en moviles.
- Boton "Descargar QR" como fallback universal.
- Vista NO se resetea al perder foco (bug corregido).

### 3. Modo readonly (URL con `#q=...`)

- Decodifica payload y muestra predicciones.
- Sistema de scoring: +3 marcador exacto, +1 resultado correcto, +0 fallo.
- Score sticky en top siempre visible.
- Cards se iluminan segun puntaje (+3 brilla esmeralda, +1 borde azul).
- Nombre del equipo favorito resaltado en color (verde local, azul visita).
- Limpia localStorage al entrar (unica condicion de limpieza).

## Diseño visual

- Header: "FIFA World Cup 2026" con emoticons de paises sede.
- Footer: "Powered by Durazno Technologies" con logo pequeño.
- Countdown con colores semaforo (verde/amarillo/rojo segun tiempo restante).
- Formato de hora: AM/PM con iconos (amanecer/sol/luna).
- Match cards: "Grupo A" completo (no abreviado), guion centrado entre selects.
- Nombre del usuario resaltado en color naranja (dz-orange) en todas las vistas.

## QR estilizado

```ts
{
  width: 400,
  height: 400,
  margin: 8,
  qrOptions: { errorCorrectionLevel: 'H' },
  imageOptions: { hideBackgroundDots: true, imageSize: 0.25, margin: 6 },
  image: '/logo.svg',
  dotsOptions: { type: 'rounded', color: '#201E47' },
  cornersSquareOptions: { type: 'extra-rounded', color: '#FF4B1F' },
  cornersDotOptions: { type: 'dot', color: '#FF4B1F' },
  backgroundOptions: { color: '#ffffff' }
}
```

## Tokens de color

- `--color-dz-orange: #FF4B1F` (CTA, QR corners, nombre resaltado)
- `--color-dz-green: #7DD934` (local gana, progreso)
- `--color-dz-dark: #201E47` (QR dots, visita gana, texto)
- `--color-dz-light: #E3E3E3` (inputs, fondos)

## Persistencia

- localStorage clave `quiniela_draft`: guarda nombre + todos los marcadores.
- Se guarda en cada cambio (onchange de selects, oninput de nombre).
- Se restaura al cargar la pagina en modo crear.
- Solo se borra al entrar en modo readonly (visualizar quiniela de otro).

## Red local para testing movil

Script dev usa `--host` para exponer en red local:
```json
"dev": "astro dev --host"
```

## Notas importantes

- La URL del QR SIEMPRE usa `https://fifa-world-cup-2026-mexico.vercel.app/` sin importar entorno.
- El hashchange NO resetea la vista export (evita bug de perdida al cambiar app).
- No hay boton de "Copiar URL" (eliminado por decision de producto).
- El boton de WhatsApp solo aparece si el dispositivo soporta Web Share API con archivos.
