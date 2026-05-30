export type MatchResult = {
  id: number;
  golesLocal: number;
  golesVisita: number;
};

// Resultados reales del Mundial 2026.
// Se llena manualmente conforme avanza el torneo.
// Solo incluir partidos ya finalizados.
export const results: MatchResult[] = [
  // Grupo A
  { id: 1, golesLocal: 2, golesVisita: 0 }, // Mexico vs Sudáfrica
  { id: 2, golesLocal: 1, golesVisita: 1 }, // Corea del Sur vs Rep. Checa
  { id: 3, golesLocal: 2, golesVisita: 1 }, // Mexico vs Corea del Sur
  { id: 4, golesLocal: 0, golesVisita: 3 }, // Rep. Checa vs Sudáfrica
  { id: 5, golesLocal: 1, golesVisita: 2 }, // Rep. Checa vs Mexico
  { id: 6, golesLocal: 0, golesVisita: 1 }, // Sudáfrica vs Corea del Sur
  // Grupo B
  { id: 7, golesLocal: 1, golesVisita: 2 }, // Canadá vs Bosnia y Herzegovina
  { id: 8, golesLocal: 0, golesVisita: 1 }, // Catar vs Suiza
  { id: 9, golesLocal: 2, golesVisita: 0 }, // Canadá vs Catar
  { id: 10, golesLocal: 1, golesVisita: 3 }, // Suiza vs Bosnia y Herzegovina
  { id: 11, golesLocal: 0, golesVisita: 2 }, // Suiza vs Canadá
  { id: 12, golesLocal: 1, golesVisita: 1 }, // Bosnia y Herzegovina vs Catar
  // Grupo C
  { id: 13, golesLocal: 3, golesVisita: 0 }, // Brasil vs Marruecos
  { id: 14, golesLocal: 1, golesVisita: 1 }, // Haití vs Escocia
  { id: 15, golesLocal: 4, golesVisita: 0 }, // Brasil vs Haití
  { id: 16, golesLocal: 0, golesVisita: 2 }, // Escocia vs Marruecos
  { id: 17, golesLocal: 1, golesVisita: 3 }, // Escocia vs Brasil
  { id: 18, golesLocal: 2, golesVisita: 0 }, // Marruecos vs Haití
];
