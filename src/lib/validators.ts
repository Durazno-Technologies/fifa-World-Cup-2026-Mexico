import { matches } from '../data/matches';

export const DEV_DEADLINE_ISO = '2026-06-11T13:00:00-06:00';

export function isDeadlinePassed(): boolean {
  const deadline = new Date(DEV_DEADLINE_ISO).getTime();
  return Date.now() > deadline;
}

export function getDeadlineTimeLeft(): number {
  const deadline = new Date(DEV_DEADLINE_ISO).getTime();
  return Math.max(0, deadline - Date.now());
}

export type PredictionInput = {
  matchId: number;
  resultado: 'L' | 'E' | 'V';
  golesLocal: number;
  golesVisita: number;
};

export function validatePredictions(
  predictions: PredictionInput[]
): { valid: true; predictions: PredictionInput[] } | { valid: false; error: string } {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return { valid: false, error: 'No hay predicciones' };
  }

  const matchIds = new Set(matches.map(m => m.id));
  const seenIds = new Set<number>();

  for (const pred of predictions) {
    const { matchId, resultado, golesLocal, golesVisita } = pred;

    if (typeof matchId !== 'number' || !matchIds.has(matchId)) {
      return { valid: false, error: `Partido desconocido: ${matchId}` };
    }

    if (seenIds.has(matchId)) {
      return { valid: false, error: `Partido duplicado: ${matchId}` };
    }
    seenIds.add(matchId);

    if (typeof golesLocal !== 'number' || typeof golesVisita !== 'number' ||
        golesLocal < 0 || golesLocal > 15 || golesVisita < 0 || golesVisita > 15) {
      return { valid: false, error: `Marcador inválido en partido ${matchId} (debe ser entre 0 y 15)` };
    }

    if (!['L', 'E', 'V'].includes(resultado)) {
      return { valid: false, error: `Resultado inválido en partido ${matchId}` };
    }

    if (resultado === 'L' && golesLocal <= golesVisita) {
      return { valid: false, error: `Resultado y marcador incoherentes en partido ${matchId}` };
    }
    if (resultado === 'E' && golesLocal !== golesVisita) {
      return { valid: false, error: `Resultado y marcador incoherentes en partido ${matchId}` };
    }
    if (resultado === 'V' && golesLocal >= golesVisita) {
      return { valid: false, error: `Resultado y marcador incoherentes en partido ${matchId}` };
    }
  }

  return { valid: true, predictions };
}

// Mantener compatibilidad con el validador old-style para archivos que lo usen
export const PARTIDO_DUPLICADO_EN_QUINIELA = 'PARTIDO_DUPLICADO_EN_QUINIELA';
export const PARTIDO_DESCONOCIDO_EN_QUINIELA = 'PARTIDO_DESCONOCIDO_EN_QUINIELA';
export const RESULTADO_Y_MARCADOR_INCOHERENTES = 'RESULTADO_Y_MARCADOR_INCOHERENTES';