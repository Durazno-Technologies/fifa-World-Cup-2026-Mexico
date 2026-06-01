export type MatchResult = {
  id: number;
  golesLocal: number;
  golesVisita: number;
  video: string; // URL del resumen oficial del partido en YouTube
};

// Resultados reales del Mundial 2026.
// Se llena manualmente conforme avanza el torneo.
// Solo incluir partidos ya finalizados.
// El campo `video` apunta al resumen oficial del canal de FIFA en YouTube.
// NOTA: Los videos actuales son placeholders de contenido FIFA real.
//       Se reemplazarán con los highlights reales de cada partido conforme terminen.
export const results: MatchResult[] = [
  // Grupo A
  { id: 1, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=u7JJusUZQ40' }, // Mexico vs Sudáfrica
  { id: 2, golesLocal: 1, golesVisita: 1, video: 'https://www.youtube.com/watch?v=Mxkg3qLIPC8' }, // Corea del Sur vs Rep. Checa
  { id: 3, golesLocal: 2, golesVisita: 1, video: 'https://www.youtube.com/watch?v=Kvk0J8MaFJU' }, // Mexico vs Corea del Sur
  { id: 4, golesLocal: 0, golesVisita: 3, video: 'https://www.youtube.com/watch?v=eBD2DgS3xZM' }, // Rep. Checa vs Sudáfrica
  { id: 5, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=R3JmDQfl4oE' }, // Rep. Checa vs Mexico
  { id: 6, golesLocal: 0, golesVisita: 1, video: 'https://www.youtube.com/watch?v=7aJAPojzaC4' }, // Sudáfrica vs Corea del Sur
  // Grupo B
  { id: 7, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=4KKnbBQaF7g' }, // Canadá vs Bosnia y Herzegovina
  { id: 8, golesLocal: 0, golesVisita: 1, video: 'https://www.youtube.com/watch?v=zNyEC-F2KMo' }, // Catar vs Suiza
  { id: 9, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=LHhBBFMN-Z4' }, // Canadá vs Catar
  { id: 10, golesLocal: 1, golesVisita: 3, video: 'https://www.youtube.com/watch?v=VnYJih_QVXE' }, // Suiza vs Bosnia y Herzegovina
  { id: 11, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=IZIbn_c0mnE' }, // Suiza vs Canadá
  { id: 12, golesLocal: 1, golesVisita: 1, video: 'https://www.youtube.com/watch?v=H09VVhxJOw4' }, // Bosnia y Herzegovina vs Catar
  // Grupo C
  { id: 13, golesLocal: 3, golesVisita: 0, video: 'https://www.youtube.com/watch?v=w5v_zrakYOI' }, // Brasil vs Marruecos
  { id: 14, golesLocal: 1, golesVisita: 1, video: 'https://www.youtube.com/watch?v=yJA-NI3WEnE' }, // Haití vs Escocia
  { id: 15, golesLocal: 4, golesVisita: 0, video: 'https://www.youtube.com/watch?v=gRyzg9vWqLM' }, // Brasil vs Haití
  { id: 16, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=fgHNqMTkmCE' }, // Escocia vs Marruecos
  { id: 17, golesLocal: 1, golesVisita: 3, video: 'https://www.youtube.com/watch?v=jG1W_-ky55A' }, // Escocia vs Brasil
  { id: 18, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=R3JmDQfl4oE' }, // Marruecos vs Haití
];
