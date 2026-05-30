import { matches } from '../data/matches';
import { 
  PARTIDO_DUPLICADO_EN_QUINIELA, 
  RESULTADO_Y_MARCADOR_INCOHERENTES, 
  PARTIDO_DESCONOCIDO_EN_QUINIELA, 
  type QuinielaPayloadV1 
} from './schema';

export const DEV_DEADLINE_ISO = '2026-05-30T22:00:00-06:00';

export function isDeadlinePassed(): boolean {
  const deadline = new Date(DEV_DEADLINE_ISO).getTime();
  return Date.now() > deadline;
}

export function getDeadlineTimeLeft(): number {
  const deadline = new Date(DEV_DEADLINE_ISO).getTime();
  return Math.max(0, deadline - Date.now());
}

export function validatePayload(payload: QuinielaPayloadV1): { valid: true } | { valid: false; error: string } {
  if (!payload || payload.v !== 1) {
    return { valid: false, error: 'Versión inválida o payload corrupto' };
  }
  
  if (typeof payload.n !== 'string' || payload.n.trim() === '' || payload.n.length > 10) {
    return { valid: false, error: 'Nombre inválido (debe tener entre 1 y 10 caracteres)' };
  }

  const seenIds = new Set<number>();
  const matchIds = new Set(matches.map(m => m.id));

  for (const pred of payload.p) {
    const [id, r, gl, gv] = pred;
    
    if (!matchIds.has(id)) {
      return { valid: false, error: PARTIDO_DESCONOCIDO_EN_QUINIELA };
    }
    
    if (seenIds.has(id)) {
      return { valid: false, error: PARTIDO_DUPLICADO_EN_QUINIELA };
    }
    seenIds.add(id);

    if (typeof gl !== 'number' || typeof gv !== 'number' || gl < 0 || gl > 15 || gv < 0 || gv > 15) {
      return { valid: false, error: 'Marcador inválido (debe ser entre 0 y 15)' };
    }

    if (r === 'L' && gl <= gv) return { valid: false, error: RESULTADO_Y_MARCADOR_INCOHERENTES };
    if (r === 'E' && gl !== gv) return { valid: false, error: RESULTADO_Y_MARCADOR_INCOHERENTES };
    if (r === 'V' && gl >= gv) return { valid: false, error: RESULTADO_Y_MARCADOR_INCOHERENTES };
  }

  return { valid: true };
}
