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
  { id: 1, golesLocal: 2, golesVisita: 0, video: 'https://youtu.be/8K-mI94l7bY' }, // Mexico vs Sudáfrica
  { id: 2, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/HyEUecVQMf4' }, // Corea del Sur vs Rep. Checa
  { id: 3, golesLocal: 2, golesVisita: 1, video: 'https://youtu.be/nGsQzCoDIGI' }, // Mexico vs Corea del Sur
  { id: 4, golesLocal: 0, golesVisita: 3, video: 'https://youtu.be/zLOgIyDimww' }, // Rep. Checa vs Sudáfrica
  { id: 5, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=6BSeFs40QOI' }, // Rep. Checa vs Mexico
  { id: 6, golesLocal: 0, golesVisita: 1, video: 'https://youtu.be/8QiRfzmCUz8' }, // Sudáfrica vs Corea del Sur
  // Grupo B
  { id: 7, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=kYIf8I1dvdo' }, // Canadá vs Bosnia y Herzegovina
  { id: 8, golesLocal: 0, golesVisita: 1, video: 'https://www.youtube.com/watch?v=1F3vlnJXzKs' }, // Catar vs Suiza
  { id: 9, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=yAAC_g0UgWc' }, // Canadá vs Catar
  { id: 10, golesLocal: 1, golesVisita: 3, video: 'https://youtu.be/NtvUzy00DuU' }, // Suiza vs Bosnia y Herzegovina
  { id: 11, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=Mger-g-Swbo' }, // Suiza vs Canadá
  { id: 12, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/lAJVri8pFn8' }, // Bosnia y Herzegovina vs Catar
  // Grupo C
  { id: 13, golesLocal: 3, golesVisita: 0, video: 'https://www.youtube.com/watch?v=vQgYID2pJu8' }, // Brasil vs Marruecos
  { id: 14, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/zB7gIkkJyw8' }, // Haití vs Escocia
  { id: 15, golesLocal: 4, golesVisita: 0, video: 'https://www.youtube.com/watch?v=yF5mHzhRBWE' }, // Brasil vs Haití
  { id: 16, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=oDyyilfmDUs' }, // Escocia vs Marruecos
  { id: 17, golesLocal: 1, golesVisita: 3, video: 'https://youtu.be/NPjmZp2iAwQ' }, // Escocia vs Brasil
  { id: 18, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=8AGeRWAHUF0' }, // Marruecos vs Haití
];
