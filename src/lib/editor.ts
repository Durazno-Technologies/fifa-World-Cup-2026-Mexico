import { matches } from '../data/matches';
import { getDeadlineTimeLeft, isDeadlinePassed } from './validators';

type PredictionState = {
  matchId: number;
  resultado: 'L' | 'E' | 'V';
  golesLocal: number;
  golesVisita: number;
};

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

function getEditorNodes() {
  return {
    form: document.getElementById('quiniela-form') as HTMLFormElement | null,
    progressContainer: document.getElementById('progress-container') as HTMLElement | null,
    progressBar: document.getElementById('progress-bar') as HTMLElement | null,
    btnDevFill: document.getElementById('btn-dev-fill') as HTMLButtonElement | null,
    countdownTimer: document.getElementById('countdown-timer') as HTMLElement | null,
    countdownContainer: document.getElementById('countdown-container') as HTMLElement | null,
    predictionTitle: document.getElementById('prediction-title') as HTMLElement | null,
    btnLogout: document.getElementById('btn-logout') as HTMLButtonElement | null,
  };
}

function updateCardBadge(card: HTMLElement) {
  const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
  const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
  const badge = card.querySelector('.result-badge') as HTMLElement | null;

  if (!localInput || !visitaInput || !badge) return;

  const gl = Number.parseInt(localInput.value, 10);
  const gv = Number.parseInt(visitaInput.value, 10);

  badge.classList.remove(
    'opacity-0',
    'bg-gray-100',
    'text-gray-400',
    'bg-dz-green',
    'text-white',
    'bg-dz-dark',
    'bg-yellow-400',
    'text-yellow-900'
  );

  if (Number.isNaN(gl) || Number.isNaN(gv)) {
    badge.classList.add('opacity-0');
    return;
  }

  if (gl > gv) {
    badge.textContent = 'Local';
    badge.classList.add('bg-dz-green', 'text-white');
    return;
  }

  if (gl < gv) {
    badge.textContent = 'Visita';
    badge.classList.add('bg-dz-dark', 'text-white');
    return;
  }

  badge.textContent = 'Empate';
  badge.classList.add('bg-yellow-400', 'text-yellow-900');
}

function collectPredictions(): PredictionState[] {
  const preds: PredictionState[] = [];

  document.querySelectorAll('.match-card').forEach((card) => {
    const matchId = Number.parseInt((card as HTMLElement).dataset.matchId || '', 10);
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;

    if (!localInput || !visitaInput || Number.isNaN(matchId)) return;

    const golesLocal = Number.parseInt(localInput.value, 10);
    const golesVisita = Number.parseInt(visitaInput.value, 10);

    if (Number.isNaN(golesLocal) || Number.isNaN(golesVisita)) return;

    const resultado = golesLocal > golesVisita ? 'L' : golesLocal < golesVisita ? 'V' : 'E';
    preds.push({ matchId, resultado, golesLocal, golesVisita });
  });

  return preds;
}

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

function hydrateFromServer(predictions: PredictionState[]) {
  const predByMatchId = new Map(predictions.map((p) => [p.matchId, p]));

  document.querySelectorAll('.match-card').forEach((card) => {
    const id = Number.parseInt((card as HTMLElement).dataset.matchId || '', 10);
    const saved = predByMatchId.get(id);
    if (!saved) return;

    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;

    localInput.value = String(saved.golesLocal);
    visitaInput.value = String(saved.golesVisita);
    updateCardBadge(card as HTMLElement);
  });
}

function updateProgress(progressContainer: HTMLElement, progressBar: HTMLElement) {
  let filledCount = 0;

  document.querySelectorAll('.match-card').forEach((card) => {
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;

    if (localInput.value !== '' && visitaInput.value !== '') {
      filledCount += 1;
    }
  });

  const percentage = (filledCount / matches.length) * 100;
  progressBar.style.width = `${percentage}%`;

  if (isDeadlinePassed()) {
    progressContainer.classList.add('hidden');
  } else {
    progressContainer.classList.remove('hidden');
  }
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hrs = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) return `${days}d ${hrs}h ${mins}m`;

  const secs = totalSecs % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateCountdownColor(container: HTMLElement, ms: number) {
  const days = Math.floor(ms / (1000 * 86400));

  container.className =
    'mt-4 inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-full text-sm shadow-sm transition-colors border';

  if (days >= 7) {
    container.classList.add(
      'bg-green-100',
      'dark:bg-green-900/40',
      'border-green-200',
      'dark:border-green-800',
      'text-green-700',
      'dark:text-green-400'
    );
    return;
  }

  if (days >= 1) {
    container.classList.add(
      'bg-yellow-100',
      'dark:bg-yellow-900/40',
      'border-yellow-200',
      'dark:border-yellow-800',
      'text-yellow-700',
      'dark:text-yellow-400'
    );
    return;
  }

  container.classList.add(
    'bg-red-100',
    'dark:bg-red-900/40',
    'border-red-200',
    'dark:border-red-800',
    'text-red-700',
    'dark:text-red-400'
  );
}

export function initEditor() {
  const state = parseSsrState();
  const nodes = getEditorNodes();

  if (
    !nodes.form ||
    !nodes.progressContainer ||
    !nodes.progressBar ||
    !nodes.countdownTimer ||
    !nodes.countdownContainer ||
    !nodes.predictionTitle ||
    !nodes.btnLogout
  ) {
    return;
  }

  let saveTimeout: number | null = null;
  let isSaving = false;

  nodes.form.classList.remove('hidden');
  nodes.predictionTitle.textContent = `La Quiniela de ${state.user.displayName}`;

  hydrateFromServer(state.predictions);
  restoreDraftIfNewer(state.userId, state.username, state.serverUpdatedAt);
  updateProgress(nodes.progressContainer, nodes.progressBar);

  const countdownTick = () => {
    if (isDeadlinePassed()) {
      nodes.countdownTimer!.textContent = 'Cerrada';
      return;
    }

    const left = getDeadlineTimeLeft();
    nodes.countdownTimer!.textContent = formatCountdown(left);
    updateCountdownColor(nodes.countdownContainer!, left);
  };

  countdownTick();
  window.setInterval(countdownTick, 1000);

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

  if (nodes.btnDevFill) {
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
  }

  document.querySelectorAll('.match-card').forEach((card) => {
    const localInput = card.querySelector('.score-input-local') as HTMLSelectElement | null;
    const visitaInput = card.querySelector('.score-input-visita') as HTMLSelectElement | null;
    if (!localInput || !visitaInput) return;

    const handleChange = () => {
      updateCardBadge(card as HTMLElement);
      updateProgress(nodes.progressContainer!, nodes.progressBar!);
      triggerSave();
    };

    localInput.onchange = handleChange;
    visitaInput.onchange = handleChange;
  });

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
}
