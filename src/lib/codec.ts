import LZString from 'lz-string';
import { QUINIELA_CORRUPTA_O_INVALIDA, DATOS_DE_QUINIELA_INVALIDOS, VERSION_DE_QUINIELA_NO_SOPORTADA, type QuinielaPayloadV1 } from './schema';
import { validatePayload } from './validators';

export function encodePayload(payload: QuinielaPayloadV1): string {
  // Asegurar orden determinista de predicciones por id ascendente
  const sortedP = [...payload.p].sort((a, b) => a[0] - b[0]);
  const cleanPayload: QuinielaPayloadV1 = {
    v: 1,
    n: payload.n.trim(),
    p: sortedP as QuinielaPayloadV1['p']
  };
  
  const jsonStr = JSON.stringify(cleanPayload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

export function decodePayload(q: string): { payload?: QuinielaPayloadV1; error?: string } {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(q);
    if (!jsonStr) {
      return { error: QUINIELA_CORRUPTA_O_INVALIDA };
    }
    
    const payload = JSON.parse(jsonStr) as any;
    
    if (payload.v !== 1) {
      return { error: VERSION_DE_QUINIELA_NO_SOPORTADA };
    }
    
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return { error: validation.error || DATOS_DE_QUINIELA_INVALIDOS };
    }
    
    return { payload };
  } catch (err) {
    return { error: QUINIELA_CORRUPTA_O_INVALIDA };
  }
}
