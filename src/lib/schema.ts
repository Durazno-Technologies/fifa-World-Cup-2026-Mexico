export type Resultado = "L" | "E" | "V";

export type Pred = [
  idPartido: number,
  resultado: Resultado,
  golesLocal: number,
  golesVisita: number
];

export type QuinielaPayloadV1 = {
  v: 1;
  n: string;
  p: Pred[];
};

export const ERR_Q_MISSING = 'ERR_Q_MISSING';
export const ERR_Q_CORRUPT = 'ERR_Q_CORRUPT';
export const ERR_SCHEMA_UNSUPPORTED_VERSION = 'ERR_SCHEMA_UNSUPPORTED_VERSION';
export const ERR_SCHEMA_INVALID = 'ERR_SCHEMA_INVALID';
export const ERR_PRED_DUPLICATE_MATCH = 'ERR_PRED_DUPLICATE_MATCH';
export const ERR_PRED_UNKNOWN_MATCH = 'ERR_PRED_UNKNOWN_MATCH';
export const ERR_PRED_INCONSISTENT_SCORE = 'ERR_PRED_INCONSISTENT_SCORE';
