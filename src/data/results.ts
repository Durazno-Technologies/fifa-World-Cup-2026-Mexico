export type MatchResult = {
  id: number;
  golesLocal: number;
  golesVisita: number;
};

// Resultados reales del Mundial 2026.
// Se llena manualmente conforme avanza el torneo.
// Solo incluir partidos ya finalizados.
export const results: MatchResult[] = [
  // --- DUMMY para testing (borrar antes de producción) ---
  { id: 1, golesLocal: 2, golesVisita: 0 },  // México 2-0 Sudáfrica
  { id: 2, golesLocal: 1, golesVisita: 1 },  // Corea del Sur 1-1 Irlanda
  { id: 3, golesLocal: 3, golesVisita: 1 },  // México 3-1 Corea del Sur
];
