export type MatchResult = {
  id: number;
  golesLocal: number;
  golesVisita: number;
  video: string; // URL del resumen oficial del partido en YouTube
};

// Resultados reales del Mundial 2026.
// Se llena manualmente conforme avanza el torneo.
export const results: MatchResult[] = [
  // Grupo A
  { id: 1, golesLocal: 2, golesVisita: 0, video: 'https://youtu.be/8K-mI94l7bY?si=32dJCScx2wQebapJ' }, // Mexico vs Sudáfrica
  { id: 2, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/HyEUecVQMf4?si=ZJicQPmHM83pFElh' }, // Corea del Sur vs Rep. Checa
  { id: 3, golesLocal: 2, golesVisita: 1, video: 'https://youtu.be/nGsQzCoDIGI?si=PMOUxxRBktRMmfvp' }, // Mexico vs Corea del Sur
  { id: 4, golesLocal: 0, golesVisita: 3, video: 'https://youtu.be/zLOgIyDimww?si=Ko-lhkxyqdru_V6y' }, // Rep. Checa vs Sudáfrica
  { id: 5, golesLocal: 1, golesVisita: 2, video: 'https://youtube.com/shorts/AxAcxZIWuoA?si=HHO3p59o8wvhdNAY' }, // Rep. Checa vs Mexico
  { id: 6, golesLocal: 0, golesVisita: 1, video: 'https://youtu.be/8QiRfzmCUz8?si=uP-VBUVrA7-gFqlO' }, // Sudáfrica vs Corea del Sur
  // Grupo B
  { id: 7, golesLocal: 1, golesVisita: 2, video: '' }, // Canadá vs Bosnia y Herzegovina
  { id: 8, golesLocal: 0, golesVisita: 1, video: '' }, // Catar vs Suiza
  { id: 9, golesLocal: 2, golesVisita: 0, video: '' }, // Canadá vs Catar
  { id: 10, golesLocal: 1, golesVisita: 3, video: '' }, // Suiza vs Bosnia y Herzegovina
  { id: 11, golesLocal: 0, golesVisita: 2, video: '' }, // Suiza vs Canadá
  { id: 12, golesLocal: 1, golesVisita: 1, video: '' }, // Bosnia y Herzegovina vs Catar
  // Grupo C
  { id: 13, golesLocal: 3, golesVisita: 0, video: '' }, // Brasil vs Marruecos
  { id: 14, golesLocal: 1, golesVisita: 1, video: '' }, // Haití vs Escocia
  { id: 15, golesLocal: 4, golesVisita: 0, video: '' }, // Brasil vs Haití
  { id: 16, golesLocal: 0, golesVisita: 2, video: '' }, // Escocia vs Marruecos
  { id: 17, golesLocal: 1, golesVisita: 3, video: '' }, // Escocia vs Brasil
  { id: 18, golesLocal: 2, golesVisita: 0, video: '' }, // Marruecos vs Haití
];
