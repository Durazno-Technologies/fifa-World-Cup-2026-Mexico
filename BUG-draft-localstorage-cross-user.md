# Bug: Draft en localStorage se comparte entre usuarios en el mismo navegador

> **Estado:** ✅ Corregido — validado, mergeado a master y desplegado en producción.
> **Severidad:** Alta — fuga de datos entre cuentas en el mismo navegador.
> **Alcance del fix:** 3 archivos production (`src/lib/editor.ts`, `src/pages/index.astro`, `src/pages/api/quiniela.ts`). 0 archivos nuevos.
> **Migración de datos:** No requiere. Drafts legados sin `userId` se descartan y limpian automáticamente al primer load del nuevo código.
> **Compatibilidad hacia atrás:** `DraftState` cambia (se agrega `userId`). Drafts existentes en localStorage sin ese campo se descartan. Esto es aceptable y de hecho **deseado** (es la corrección del bug).

---

## 1. Resumen ejecutivo

El mecanismo de recuperación de borradores (`localStorage['quiniela_draft']`) **no valida a qué usuario pertenece el draft guardado**. Cuando un usuario cierra sesión y otro inicia sesión en el mismo navegador, el segundo usuario puede ver las predicciones del primero si el draft del primero tiene un timestamp más reciente que el `serverUpdatedAt` del segundo.

Además, el botón de **logout** no limpia el localStorage, dejando drafts persistidos para cualquier usuario futuro que use ese navegador.

Como bonus (optimización de performance, no es bug), el endpoint `PUT /api/quiniela` ejecuta 72 queries secuenciales cuando podría ser 1 sola (bulk upsert).

---

## 2. Diagnóstico

### 2.1 Bug principal: Cross-user draft sharing

**Evidencia** — `src/lib/editor.ts:17-22`:
```typescript
type DraftState = {
  matches: Record<string, { l: string; v: string }>;
  timestamp: number;
};

const STORAGE_KEY = 'quiniela_draft';
```

**Evidencia** — `src/lib/editor.ts:141-148` (función `restoreDraftIfNewer`):
```typescript
function restoreDraftIfNewer(serverUpdatedAt: number) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw) as DraftState;
    if (!draft?.matches || typeof draft.timestamp !== 'number') return;
    if (draft.timestamp <= serverUpdatedAt) return; // único gate
```

**Problemas**:
1. La key es constante (`quiniela_draft`) → todos los usuarios del navegador comparten el mismo slot.
2. `DraftState` no tiene campo de identificación de usuario.
3. El único gate es timestamp vs `serverUpdatedAt`. Si el draft tiene timestamp > serverUpdatedAt del usuario actual, se restaura **sin importar de quién es**.

**Reproducción**:
1. Login como User A.
2. Editar varios partidos (el draft se escribe a localStorage en cada `change`).
3. Cortar la red o provocar que el `PUT /api/quiniela` falle (el draft persiste en localStorage).
4. Cerrar sesión de A.
5. Login como User B (sin predicciones en DB, o con `serverUpdatedAt` menor al timestamp del draft de A).
6. **Esperado:** User B ve sus propias predicciones (vacías o las que tenga en DB).
7. **Actual:** `restoreDraftIfNewer()` encuentra el draft de A, ve que es "más reciente", y sobreescribe los `<select>` del form de B con los datos de A.

### 2.2 Bug secundario: Logout no limpia localStorage

**Evidencia** — `src/lib/editor.ts:371-374`:
```typescript
nodes.btnLogout.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});
```

El handler hace logout server-side y redirect, pero **nunca llama `localStorage.removeItem()`**. Cualquier draft (de cualquier usuario que haya usado ese navegador) persiste indefinidamente.

### 2.3 Bug menor (DEV only): Botón DEV sobreescribe predicciones existentes

**Evidencia** — `src/lib/editor.ts:341-354`:
```typescript
nodes.btnDevFill.onclick = () => {
  document.querySelectorAll('.match-card').forEach((card) => {
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;
    localInput.value = String(Math.floor(Math.random() * 4));
    visitaInput.value = String(Math.floor(Math.random() * 4));
    updateCardBadge(card as HTMLElement);
  });
  // ...
};
```

Rellena TODOS los partidos con random, sin verificar si ya hay datos. Destruye trabajo de DEV. No es bug de producción, pero es molesto.

### 2.4 Línea huérfana: `localStorage.removeItem(STORAGE_KEY)` en `saveToServer`

**Evidencia** — `src/lib/editor.ts:319-322`:
```typescript
if (res.ok) {
  localStorage.removeItem(STORAGE_KEY);
  return;
}
```

Si solo se cambia la key a `quiniela_draft_${username}` sin actualizar esta línea, el draft nunca se borrará al guardar exitosamente. Cleanup queda inefectivo. El fix debe actualizar este punto.

### 2.5 Optimización (no es bug): Bulk upsert en `/api/quiniela`

**Evidencia** — `src/pages/api/quiniela.ts:67-87`:
```typescript
for (const pred of validation.predictions) {
  await db
    .insert(predictions)
    .values({ ... })
    .onConflictDoUpdate({ ... });
}
```

72 queries secuenciales → 1 sola query bulk. Mejora latency significativamente en DB remota (Aiven).

---

## 3. Plan de implementación

> **Convención:** Los snippets de "ANTES" muestran el código actual exacto (copiados del repo). Los snippets de "DESPUÉS" muestran el reemplazo textual. Cada cambio indica archivo y líneas.

### 3.1 Cambio 1: SSR state incluye `userId` y `username`

**Archivo:** `src/pages/index.astro` — líneas 30-39

**ANTES:**
```typescript
const ssrState = JSON.stringify({
  user: { displayName: user.display_name },
  serverUpdatedAt: latestServerUpdate,
  predictions: userPredictions.map((p) => ({
    matchId: p.match_id,
    resultado: p.resultado,
    golesLocal: p.goles_local,
    golesVisita: p.goles_visita,
  })),
}).replace(/</g, '\\u003c');
```

**DESPUÉS:**
```typescript
const ssrState = JSON.stringify({
  user: { displayName: user.display_name },
  userId: user.id,
  username: user.username,
  serverUpdatedAt: latestServerUpdate,
  predictions: userPredictions.map((p) => ({
    matchId: p.match_id,
    resultado: p.resultado,
    golesLocal: p.goles_local,
    golesVisita: p.goles_visita,
  })),
}).replace(/</g, '\\u003c');
```

**Por qué:** El frontend necesita saber el `userId` y `username` del usuario actual para construir la key de localStorage y validar que el draft pertenece al usuario correcto. `Astro.locals.user` ya tiene ambos campos (ver `src/middleware.ts:45-49`).

### 3.2 Cambio 2: Tipos y helper `getStorageKey`

**Archivo:** `src/lib/editor.ts` — líneas 11-22

**ANTES:**
```typescript
type SsrState = {
  user: { displayName: string };
  serverUpdatedAt: number;
  predictions: PredictionState[];
};

type DraftState = {
  matches: Record<string, { l: string; v: string }>;
  timestamp: number;
};

const STORAGE_KEY = 'quiniela_draft';
```

**DESPUÉS:**
```typescript
type SsrState = {
  user: { displayName: string };
  userId: number;
  username: string;
  serverUpdatedAt: number;
  predictions: PredictionState[];
};

type DraftState = {
  userId: number;
  matches: Record<string, { l: string; v: string }>;
  timestamp: number;
};

function getStorageKey(username: string): string {
  return `quiniela_draft_${username}`;
}
```

**Por qué:**
- `userId` en `DraftState` permite validar ownership al restaurar.
- `username` en `SsrState` permite construir la key única por usuario.
- `getStorageKey()` centraliza la lógica (un solo punto a editar si se renombra la key).
- Se usa `username` (no `userId`) en la key para que en DevTools sea legible: `quiniela_draft_juan` vs `quiniela_draft_7`.

### 3.3 Cambio 3: `parseSsrState()` extrae `userId` y `username`

**Archivo:** `src/lib/editor.ts` — líneas 24-45

**ANTES:**
```typescript
function parseSsrState(): SsrState {
  const ssrStateEl = document.getElementById('ssr-state') as HTMLScriptElement | null;
  if (!ssrStateEl?.textContent) {
    return { user: { displayName: 'Mi' }, serverUpdatedAt: 0, predictions: [] };
  }
  try {
    const parsed = JSON.parse(ssrStateEl.textContent);
    return {
      user: {
        displayName:
          typeof parsed?.user?.displayName === 'string' ? parsed.user.displayName : 'Mi',
      },
      serverUpdatedAt:
        typeof parsed?.serverUpdatedAt === 'number' ? parsed.serverUpdatedAt : 0,
      predictions: Array.isArray(parsed?.predictions) ? parsed.predictions : [],
    };
  } catch {
    return { user: { displayName: 'Mi' }, serverUpdatedAt: 0, predictions: [] };
  }
}
```

**DESPUÉS:**
```typescript
function parseSsrState(): SsrState {
  const ssrStateEl = document.getElementById('ssr-state') as HTMLScriptElement | null;
  if (!ssrStateEl?.textContent) {
    return {
      user: { displayName: 'Mi' },
      userId: 0,
      username: '',
      serverUpdatedAt: 0,
      predictions: [],
    };
  }
  try {
    const parsed = JSON.parse(ssrStateEl.textContent);
    return {
      user: {
        displayName:
          typeof parsed?.user?.displayName === 'string' ? parsed.user.displayName : 'Mi',
      },
      userId: typeof parsed?.userId === 'number' ? parsed.userId : 0,
      username: typeof parsed?.username === 'string' ? parsed.username : '',
      serverUpdatedAt:
        typeof parsed?.serverUpdatedAt === 'number' ? parsed.serverUpdatedAt : 0,
      predictions: Array.isArray(parsed?.predictions) ? parsed.predictions : [],
    };
  } catch {
    return {
      user: { displayName: 'Mi' },
      userId: 0,
      username: '',
      serverUpdatedAt: 0,
      predictions: [],
    };
  }
}
```

**Por qué:** Defensivo: si el SSR state no tiene `userId`/`username` (deploy parcial, cache viejo, etc.), devuelve valores seguros en vez de fallar. Con `username: ''`, las funciones de validación devuelven sin operar (early return en §3.4 y §3.5).

### 3.4 Cambio 4: `saveDraft()` recibe userId y username

**Archivo:** `src/lib/editor.ts` — líneas 124-139

**ANTES:**
```typescript
function saveDraft() {
  const draft: DraftState = { matches: {}, timestamp: Date.now() };
  document.querySelectorAll('.match-card').forEach((card) => {
    const matchId = (card as HTMLElement).dataset.matchId;
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!matchId || !localInput || !visitaInput) return;
    if (localInput.value === '' && visitaInput.value === '') return;
    draft.matches[matchId] = { l: localInput.value, v: visitaInput.value };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}
```

**DESPUÉS:**
```typescript
function saveDraft(userId: number, username: string) {
  if (!username) return; // No persistir sin username (key inválida).
  const draft: DraftState = { userId, matches: {}, timestamp: Date.now() };
  document.querySelectorAll('.match-card').forEach((card) => {
    const matchId = (card as HTMLElement).dataset.matchId;
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!matchId || !localInput || !visitaInput) return;
    if (localInput.value === '' && visitaInput.value === '') return;
    draft.matches[matchId] = { l: localInput.value, v: visitaInput.value };
  });
  localStorage.setItem(getStorageKey(username), JSON.stringify(draft));
}
```

**Por qué:** Persiste el `userId` dentro del draft (defensa en profundidad) y usa la key por usuario.

### 3.5 Cambio 5: `restoreDraftIfNewer()` valida `userId` (FIX PRINCIPAL)

**Archivo:** `src/lib/editor.ts` — líneas 141-168

**ANTES:**
```typescript
function restoreDraftIfNewer(serverUpdatedAt: number) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw) as DraftState;
    if (!draft?.matches || typeof draft.timestamp !== 'number') return;
    if (draft.timestamp <= serverUpdatedAt) return;
    document.querySelectorAll('.match-card').forEach((card) => {
      const id = (card as HTMLElement).dataset.matchId;
      if (!id) return;
      const saved = draft.matches[id];
      if (!saved) return;
      const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
      const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
      if (!localInput || !visitaInput) return;
      if (saved.l !== '') localInput.value = saved.l;
      if (saved.v !== '') visitaInput.value = saved.v;
      updateCardBadge(card as HTMLElement);
    });
  } catch {
    // Draft inválido; se ignora para no romper la UI.
  }
}
```

**DESPUÉS:**
```typescript
function restoreDraftIfNewer(userId: number, username: string, serverUpdatedAt: number) {
  if (!username) return;
  const storageKey = getStorageKey(username);
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw) as DraftState;
    if (!draft?.matches || typeof draft.timestamp !== 'number') return;

    // Validar ownership. Si el draft.userId no coincide con el usuario
    // actual, es un draft huérfano (otro usuario usó este navegador antes)
    // o un draft legado (pre-fix, sin userId). Descartar y limpiar.
    if (typeof draft.userId !== 'number' || draft.userId !== userId) {
      localStorage.removeItem(storageKey);
      return;
    }

    if (draft.timestamp <= serverUpdatedAt) return;

    document.querySelectorAll('.match-card').forEach((card) => {
      const id = (card as HTMLElement).dataset.matchId;
      if (!id) return;
      const saved = draft.matches[id];
      if (!saved) return;
      const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
      const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
      if (!localInput || !visitaInput) return;
      if (saved.l !== '') localInput.value = saved.l;
      if (saved.v !== '') visitaInput.value = saved.v;
      updateCardBadge(card as HTMLElement);
    });
  } catch {
    // Draft corrupto: se limpia para no romper la UI en loads futuros.
    localStorage.removeItem(storageKey);
  }
}
```

**Por qué:** El fix principal del bug. Cuatro gates en orden:
1. `username` válido (early return si vacío).
2. Draft parsea y tiene campos mínimos.
3. **Ownership válido: `draft.userId === userId`**. Si no, es draft huérfano o legado → se borra.
4. Timestamp más reciente que el servidor.

Si pasa los 4, se restaura. El `removeItem` dentro del catch también limpia drafts corruptos (defensa en profundidad).

### 3.6 Cambio 6: `saveToServer` y `triggerSave` con key nueva

**Archivo:** `src/lib/editor.ts` — líneas 304-338

**ANTES:**
```typescript
const saveToServer = async () => {
  if (isDeadlinePassed() || isSaving) return;
  const predicciones = collectPredictions();
  if (predicciones.length === 0) return;
  isSaving = true;
  try {
    const res = await fetch('/api/quiniela', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predicciones }),
    });
    if (res.ok) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (res.status === 401) {
      window.location.href = '/login';
    }
  } catch {
    // Error de red: se conserva el draft en localStorage para recuperación.
  } finally {
    isSaving = false;
  }
};

const triggerSave = () => {
  saveDraft();
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(saveToServer, 1500);
};
```

**DESPUÉS:**
```typescript
const saveToServer = async () => {
  if (isDeadlinePassed() || isSaving) return;
  const predicciones = collectPredictions();
  if (predicciones.length === 0) return;
  isSaving = true;
  try {
    const res = await fetch('/api/quiniela', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predicciones }),
    });
    if (res.ok) {
      // Limpiar el draft del usuario actual (no el de otros).
      localStorage.removeItem(getStorageKey(state.username));
      return;
    }
    if (res.status === 401) {
      window.location.href = '/login';
    }
  } catch {
    // Error de red: se conserva el draft en localStorage para recuperación.
  } finally {
    isSaving = false;
  }
};

const triggerSave = () => {
  saveDraft(state.userId, state.username);
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(saveToServer, 1500);
};
```

**Por qué:**
- `saveToServer` ahora usa `getStorageKey(state.username)` para limpiar solo el draft del usuario actual al guardar OK.
- `triggerSave` pasa `state.userId` y `state.username` a `saveDraft`.

Nota: `state` se construye arriba en `initEditor` (ver §3.9).

### 3.7 Cambio 7: `initEditor()` y handler de logout

**Archivo:** `src/lib/editor.ts` — líneas 263-288 y 371-374

**ANTES (líneas 263-288, dentro de initEditor):**
```typescript
nodes.form.classList.remove('hidden');
nodes.predictionTitle.textContent = `La Quiniela de ${state.user.displayName}`;

hydrateFromServer(state.predictions);
restoreDraftIfNewer(state.serverUpdatedAt);
updateProgress(nodes.progressContainer, nodes.progressBar);
```

**DESPUÉS:**
```typescript
nodes.form.classList.remove('hidden');
nodes.predictionTitle.textContent = `La Quiniela de ${state.user.displayName}`;

hydrateFromServer(state.predictions);
restoreDraftIfNewer(state.userId, state.username, state.serverUpdatedAt);
updateProgress(nodes.progressContainer, nodes.progressBar);
```

**ANTES (líneas 371-374, handler de logout):**
```typescript
nodes.btnLogout.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});
```

**DESPUÉS:**
```typescript
nodes.btnLogout.addEventListener('click', async () => {
  // 1. Limpiar el draft del usuario actual (no el de otros usuarios en este
  //    navegador, por si comparten la máquina).
  if (state.username) {
    localStorage.removeItem(getStorageKey(state.username));
  }
  // 2. Logout server-side.
  await fetch('/api/auth/logout', { method: 'POST' });
  // 3. Redirect.
  window.location.href = '/login';
});
```

**Por qué:**
- `restoreDraftIfNewer` recibe los args nuevos.
- El logout limpia el draft del usuario actual **antes** del fetch. Esto garantiza que si el fetch falla (red caída), el draft igualmente se borró del lado cliente — pero en realidad está bien porque el usuario decidió cerrar sesión. Si el server mantiene datos, se re-leerán al próximo login.
- **No** limpia drafts de OTROS usuarios en el mismo navegador (preserva su trabajo).

### 3.8 Cambio 8: Botón DEV solo rellena vacíos

**Archivo:** `src/lib/editor.ts` — líneas 341-354

**ANTES:**
```typescript
nodes.btnDevFill.classList.remove('hidden');
nodes.btnDevFill.onclick = () => {
  document.querySelectorAll('.match-card').forEach((card) => {
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;
    localInput.value = String(Math.floor(Math.random() * 4));
    visitaInput.value = String(Math.floor(Math.random() * 4));
    updateCardBadge(card as HTMLElement);
  });
  updateProgress(nodes.progressContainer!, nodes.progressBar!);
  triggerSave();
};
```

**DESPUÉS:**
```typescript
nodes.btnDevFill.classList.remove('hidden');
nodes.btnDevFill.onclick = () => {
  document.querySelectorAll('.match-card').forEach((card) => {
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;
    // Solo rellenar si ambos están vacíos (preservar trabajo existente).
    if (localInput.value !== '' || visitaInput.value !== '') return;
    localInput.value = String(Math.floor(Math.random() * 4));
    visitaInput.value = String(Math.floor(Math.random() * 4));
    updateCardBadge(card as HTMLElement);
  });
  updateProgress(nodes.progressContainer!, nodes.progressBar!);
  triggerSave();
};
```

**Por qué:** No destruir predicciones existentes de DEV al usar el botón random. Útil cuando DEV ya empezó a llenar y quiere completar lo que falta.

### 3.9 Cambio 9: Bulk upsert en `/api/quiniela`

**Archivo:** `src/pages/api/quiniela.ts` — líneas 67-87

**ANTES:**
```typescript
// Upsert: insertar o actualizar cada predicción
for (const pred of validation.predictions) {
  await db
    .insert(predictions)
    .values({
      user_id: userId,
      match_id: pred.matchId,
      resultado: pred.resultado,
      goles_local: pred.golesLocal,
      goles_visita: pred.golesVisita,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: [predictions.user_id, predictions.match_id],
      set: {
        resultado: pred.resultado,
        goles_local: pred.golesLocal,
        goles_visita: pred.golesVisita,
        updated_at: new Date(),
      },
    });
}
```

**DESPUÉS:**
```typescript
// Bulk upsert: una sola query para todas las predicciones.
// 72 queries secuenciales → 1 sola. Drizzle parametriza correctamente.
if (validation.predictions.length > 0) {
  const now = new Date();
  await db
    .insert(predictions)
    .values(
      validation.predictions.map((pred) => ({
        user_id: userId,
        match_id: pred.matchId,
        resultado: pred.resultado,
        goles_local: pred.golesLocal,
        goles_visita: pred.golesVisita,
        updated_at: now,
      }))
    )
    .onConflictDoUpdate({
      target: [predictions.user_id, predictions.match_id],
      set: {
        resultado: sql`excluded.resultado`,
        goles_local: sql`excluded.goles_local`,
        goles_visita: sql`excluded.goles_visita`,
        updated_at: sql`excluded.updated_at`,
      },
    });
}
```

**Importaciones adicionales** — agregar al inicio de `src/pages/api/quiniela.ts`:
```typescript
import { sql } from 'drizzle-orm';
```

**Por qué:**
- 72 queries → 1 query. Mejora dramática de latency en DB remota.
- Drizzle genera el SQL parametrizado correctamente (no hay SQL injection).
- `sql\`excluded.column\`` referencia la fila que se intentó insertar en el `ON CONFLICT DO UPDATE` (es sintaxis estándar de PostgreSQL).
- Si `validation.predictions.length === 0` (caso borde, ya filtrado antes), se salta la query entera.

---

## 4. Edge cases y consideraciones

### 4.1 Casos cubiertos por el fix

| Escenario | Antes del fix | Después del fix |
|---|---|---|
| User A edita → PUT falla → User B loguea (con serverUpdatedAt menor) | B ve los datos de A | Draft de A tiene `userId: A` ≠ `B`, se borra. B ve sus datos de DB |
| User A edita → PUT ok → mismo user recarga | Draft se borra en `saveToServer` | Igual. Ahora usa `getStorageKey(username)` |
| Mismo usuario, multi-tab | Funciona (último save gana) | Igual. Key por username = misma key en todas las tabs |
| User A cierra sesión, User B abre navegador | Draft de A persiste (no se limpia) | Logout limpia draft de A. B empieza limpio |
| Multi-navegador, mismo user | Funciona (cada navegador tiene su propio localStorage) | Igual |
| DEV con datos existentes → click "fill random" | Sobreescribe todo | Solo rellena vacíos |

### 4.2 Edge cases adicionales considerados

1. **Username cambia en el futuro**: si el admin renombra un usuario, su draft bajo la key antigua queda inaccesible (la nueva key es otra). **Mitigación:** no hay migración automática. **Aceptable** porque el seed actual no permite rename y los drafts son red de seguridad, no fuente de verdad.

2. **SSR state sin `userId`/`username`** (deploy parcial, cache): `parseSsrState` devuelve `userId: 0` y `username: ''`. Las funciones `saveDraft` y `restoreDraftIfNewer` hacen early return → no se rompe la UI, simplemente no hay draft.

3. **Race condition entre dos sesiones del mismo user en distintos navegadores**: cada navegador tiene su propio localStorage. El server (PUT) es la fuente de verdad. El último write gana. No es bug, es comportamiento esperado.

4. **Múltiples usuarios en misma máquina (raro pero posible)**: con la nueva key por username, los drafts no se mezclan. Cada uno tiene su slot.

5. **`localStorage` deshabilitado o lleno**: `localStorage.setItem` puede lanzar `QuotaExceededError`. **Consideración:** el código actual NO tiene try/catch alrededor de `setItem`. Esto no es parte del bug, pero es una mejora futura. **Aceptable** para este fix; documentar como mejora pendiente.

6. **El server sigue siendo la fuente de verdad**: el draft en localStorage es solo red de seguridad. Si el server tiene datos y el draft es más viejo, el server gana. Si el draft es más nuevo y del usuario correcto, se restaura (caso de "PUT falló por red").

7. **El `updated_at` en DB**: `latestServerUpdate` se calcula en SSR desde las predicciones del usuario. Si el usuario no tiene predicciones, `latestServerUpdate = 0` y cualquier draft con timestamp > 0 se restauraría. **Antes del fix:** restauraría el draft de OTRO usuario (bug). **Después del fix:** el gate de `userId` lo bloquea. ✅

---

## 5. Plan de validación (cómo el próximo agente verifica que funciona)

### 5.1 Build y typecheck

```bash
npm run build
```

Debe completar sin errores de TypeScript. Los cambios en `DraftState` (agregar `userId`) requieren que TODOS los sitios que construyen un `DraftState` lo hagan correctamente. Después del fix, el único sitio que lo construye es `saveDraft`, que ya recibe `userId`.

### 5.2 Verificación manual del bug original (CRÍTICO)

Repetir los pasos de §2.1:

1. Login como User A. Verificar en DevTools → Application → Local Storage que existe la key `quiniela_draft_a_username` (no `quiniela_draft`).
2. Editar varios partidos. Confirmar en DevTools que la key es `quiniela_draft_a_username` y el JSON contiene `"userId": <id_de_a>`.
3. Cortar red (DevTools → Network → Offline).
4. Editar un partido más → el PUT falla, el draft queda en localStorage.
5. Logout. Verificar en DevTools que la key `quiniela_draft_a_username` se borró.
6. Login como User B. Verificar que el form de B está vacío (o con datos de B en DB, no de A).
7. Verificar en DevTools que la key es `quiniela_draft_b_username`.
8. **Opcional** (verificar el path crítico del fix): después del logout de A y antes del login de B, restaurar manualmente el localStorage de A con un JSON con `userId: <id_de_a>`. Login como B. Verificar que B **NO** ve los datos de A (el draft se descarta por mismatch de userId). Confirmar en DevTools que la key de A ya no existe (se limpió).

### 5.3 Verificación del fix de logout

1. Login como cualquier user.
2. Editar un partido.
3. Verificar en DevTools que existe la key del usuario.
4. Logout.
5. Verificar en DevTools que la key YA NO EXISTE.

### 5.4 Verificación del botón DEV

1. Login como cualquier user.
2. Llenar manualmente 2-3 partidos con valores específicos (e.g., 1-0, 2-1).
3. Click en el botón DEV.
4. Verificar que los partidos pre-llenados **siguen** con sus valores (no se sobreescriben).
5. Los partidos vacíos ahora tienen valores random.

### 5.5 Verificación del bulk upsert

1. Login, editar TODOS los 72 partidos.
2. Esperar a que el PUT termine.
3. Recargar la página.
4. Verificar que todas las predicciones se restauran correctamente desde la DB.
5. **Opcional (métricas):** en la consola del server (Vercel logs), el PUT ahora debería resolverse en ~1 query, no 72. Medir tiempo antes/después si es posible.

### 5.6 Typecheck estricto

```bash
npx tsc --noEmit
```

Debe pasar sin errores. Puntos a verificar:
- `SsrState` requiere `userId: number` y `username: string` (no opcionales).
- `DraftState` requiere `userId: number`.
- `saveDraft`, `restoreDraftIfNewer` tienen firmas actualizadas y se llaman con los args correctos.
- `state` en `initEditor` se usa correctamente (debe estar en scope para `saveToServer` y `triggerSave`).

### 5.7 Checklist de regresión (no romper funcionalidad existente)

- [ ] Login sigue funcionando.
- [ ] Editor muestra predicciones existentes de la DB al cargar.
- [ ] Editar un partido dispara `saveDraft` (ver en DevTools que la key del usuario se actualiza) y `PUT` (ver en Network).
- [ ] `PUT` exitoso limpia la key del usuario actual.
- [ ] Recargar la página restaura las predicciones desde la DB.
- [ ] `PUT` fallido (offline) conserva el draft; al volver online y recargar, el draft se restaura.
- [ ] `isSaving` previene saves concurrentes (el comportamiento debe ser el mismo).
- [ ] Countdown y deadline siguen funcionando.
- [ ] Logout limpia el draft del usuario actual pero no afecta otras keys.
- [ ] El dashboard (`/dashboard`) y la vista readonly (`/quiniela/[username]`) no se ven afectados (no tocan localStorage).

---

## 6. Checklist de implementación (orden recomendado)

Aplicar los cambios en este orden. Cada paso es independiente de los demás en términos de tipos (TS se quejará al final si falta algo, pero no hay dependencias circulares).

1. **Cambio 2** — Tipos y helper `getStorageKey` en `src/lib/editor.ts`. (TS empezará a quejarse porque `STORAGE_KEY` ya no existe y los call-sites siguen usándolo.)
2. **Cambio 4** — `saveDraft()` con nueva firma.
3. **Cambio 5** — `restoreDraftIfNewer()` con validación de `userId`.
4. **Cambio 6** — `saveToServer` y `triggerSave` con key nueva.
5. **Cambio 7** — `initEditor` y logout handler.
6. **Cambio 8** — Botón DEV.
7. **Cambio 1** — SSR state con `userId` y `username` en `src/pages/index.astro`.
8. **Cambio 3** — `parseSsrState()` con extracción de los nuevos campos.
9. **Cambio 9** — Bulk upsert en `src/pages/api/quiniela.ts`. (Independiente; se puede hacer en cualquier momento.)
10. `npx tsc --noEmit` — verificar que compila.
11. `npm run build` — verificar build completo.
12. Tests manuales según §5.

---

## 7. Glosario y referencias

- **`DraftState`**: tipo TypeScript que define la forma del JSON guardado en localStorage.
- **`SsrState`**: tipo del JSON inyectado por el SSR en el `<script id="ssr-state">`.
- **`STORAGE_KEY` (legacy)**: constante string que se reemplaza por `getStorageKey(username)`.
- **`getStorageKey(username)`**: helper que genera `quiniela_draft_${username}`.
- **`hydrateFromServer`**: función que rellena los `<select>` con las predicciones de la DB.
- **`saveToServer`**: función async que hace PUT al endpoint.
- **`triggerSave`**: función orquestadora (saveDraft + debounce + saveToServer).
- **`excluded.column`**: en PostgreSQL `ON CONFLICT DO UPDATE`, referencia la fila que se intentó insertar. Drizzle lo expone como `sql\`excluded.column\``.

**Archivos tocados:**
- `src/lib/editor.ts` (cambios 2, 3, 4, 5, 6, 7, 8)
- `src/pages/index.astro` (cambio 1)
- `src/pages/api/quiniela.ts` (cambio 9)

**Archivos NO tocados** (a pesar de ser relevantes para el flujo):
- `src/middleware.ts` (auth ya provee `user.id` y `user.username` correctamente).
- `src/lib/db/schema.ts` (modelo de datos no cambia).
- `src/lib/validators.ts` (validación de predicciones no cambia).
- `src/pages/api/auth/logout.ts` (logout server-side no cambia).
