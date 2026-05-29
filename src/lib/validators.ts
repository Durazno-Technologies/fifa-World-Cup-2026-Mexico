import { matches } from '../data/matches';
import { ERR_PRED_DUPLICATE_MATCH, ERR_PRED_INCONSISTENT_SCORE, ERR_PRED_UNKNOWN_MATCH, type Pred, type QuinielaPayloadV1 } from './schema';

export function isDeadlinePassed(): boolean {
  // 10 de junio de 2026 a las 23:59:59 (hora local del dispositivo)
  const deadline = new Date(2026, 5, 10, 23, 59, 59).getTime();
  return Date.now() > deadline;
}

export function validatePayload(payload: QuinielaPayloadV1): { valid: true } | { valid: false; error: string } {
  if (!payload || payload.v !== 1) {
    return { valid: false, error: 'Versión inválida o payload corrupto' };
  }
  
  if (typeof payload.n !== 'string' || payload.n.trim() === '' || payload.n.length > 40) {
    return { valid: false, error: 'Nombre inválido (debe tener entre 1 y 40 caracteres)' };
  }

  const seenIds = new Set<number>();
  const matchIds = new Set(matches.map(m => m.id));

  for (const pred of payload.p) {
    const [id, r, gl, gv] = pred;
    
    if (!matchIds.has(id)) {
      return { valid: false, error: ERR_PRED_UNKNOWN_MATCH };
    }
    
    if (seenIds.has(id)) {
      return { valid: false, error: ERR_PRED_DUPLICATE_MATCH };
    }
    seenIds.add(id);

    if (typeof gl !== 'number' || typeof gv !== 'number' || gl < 0 || gl > 99 || gv < 0 || gv > 99) {
      return { valid: false, error: 'Marcador inválido (debe ser entre 0 y 99)' };
    }

    if (r === 'L' && gl <= gv) return { valid: false, error: ERR_PRED_INCONSISTENT_SCORE };
    if (r === 'E' && gl !== gv) return { valid: false, error: ERR_PRED_INCONSISTENT_SCORE };
    if (r === 'V' && gl >= gv) return { valid: false, error: ERR_PRED_INCONSISTENT_SCORE };
  }

  return { valid: true };
}
