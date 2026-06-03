export type MatchResult = {
  id: number;
  golesLocal: number;
  golesVisita: number;
  video: string;
};

export type PredictionWithResult = {
  matchId: number;
  resultado: 'L' | 'E' | 'V';
  golesLocal: number;
  golesVisita: number;
};

/**
 * Calcula los puntos de una predicción individual contra un resultado real.
 * Devuelve -1 si el partido no tiene resultado (aún no se jugó).
 */
export function scorePrediction(
  pred: PredictionWithResult,
  realResult: MatchResult | undefined
): number {
  if (!realResult) return -1; // Partido sin jugar

  const { golesLocal, golesVisita } = pred;
  const { golesLocal: realGL, golesVisita: realGV } = realResult;

  // +3: marcador exacto
  if (golesLocal === realGL && golesVisita === realGV) {
    return 3;
  }

  // +1: resultado correcto (L/E/V)
  const realR = realGL > realGV ? 'L' : realGL < realGV ? 'V' : 'E';
  if (pred.resultado === realR) {
    return 1;
  }

  // +0: fallo
  return 0;
}

/**
 * Calcula el puntaje total de todas las predicciones de un usuario.
 * Partidos sin resultado no suman ni restan.
 */
export function scoreUserPredictions(
  predictions: PredictionWithResult[],
  results: MatchResult[]
): number {
  const resultsById = new Map(results.map(r => [r.id, r]));

  let total = 0;
  for (const pred of predictions) {
    const realResult = resultsById.get(pred.matchId);
    if (realResult) {
      total += scorePrediction(pred, realResult);
    }
  }

  return total;
}

/**
 * Calcula puntajes por partido individual (para mostrar en la vista readonly).
 */
export function scoreUserPredictionsDetailed(
  predictions: PredictionWithResult[],
  results: MatchResult[]
): Map<number, number> {
  const resultsById = new Map(results.map(r => [r.id, r]));
  const scores = new Map<number, number>();

  for (const pred of predictions) {
    const realResult = resultsById.get(pred.matchId);
    scores.set(pred.matchId, scorePrediction(pred, realResult));
  }

  return scores;
}