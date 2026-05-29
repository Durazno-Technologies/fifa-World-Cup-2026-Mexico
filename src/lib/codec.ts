import LZString from 'lz-string';
import { ERR_Q_CORRUPT, ERR_SCHEMA_INVALID, ERR_SCHEMA_UNSUPPORTED_VERSION, type QuinielaPayloadV1 } from './schema';
import { validatePayload } from './validators';

export function encodePayload(payload: QuinielaPayloadV1): string {
  // Asegurar orden determinista de predicciones por id ascendente
  const sortedP = [...payload.p].sort((a, b) => a[0] - b[0]);
  const cleanPayload: QuinielaPayloadV1 = {
    v: 1,
    n: payload.n.trim(),
    p: sortedP
  };
  
  const jsonStr = JSON.stringify(cleanPayload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

export function decodePayload(q: string): { payload?: QuinielaPayloadV1; error?: string } {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(q);
    if (!jsonStr) {
      return { error: ERR_Q_CORRUPT };
    }
    
    const payload = JSON.parse(jsonStr) as any;
    
    if (payload.v !== 1) {
      return { error: ERR_SCHEMA_UNSUPPORTED_VERSION };
    }
    
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return { error: validation.error || ERR_SCHEMA_INVALID };
    }
    
    return { payload };
  } catch (err) {
    return { error: ERR_Q_CORRUPT };
  }
}
