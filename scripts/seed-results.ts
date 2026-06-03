import postgres from 'postgres';

type SeedResult = {
  matchId: number;
  golesLocal: number;
  golesVisita: number;
  video: string;
};

const initialResults: SeedResult[] = [
  { matchId: 1, golesLocal: 2, golesVisita: 0, video: 'https://youtu.be/8K-mI94l7bY' },
  { matchId: 2, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/HyEUecVQMf4' },
  { matchId: 3, golesLocal: 2, golesVisita: 1, video: 'https://youtu.be/nGsQzCoDIGI' },
  { matchId: 4, golesLocal: 0, golesVisita: 3, video: 'https://youtu.be/zLOgIyDimww' },
  { matchId: 5, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=6BSeFs40QOI' },
  { matchId: 6, golesLocal: 0, golesVisita: 1, video: 'https://youtu.be/8QiRfzmCUz8' },
  { matchId: 7, golesLocal: 1, golesVisita: 2, video: 'https://www.youtube.com/watch?v=kYIf8I1dvdo' },
  { matchId: 8, golesLocal: 0, golesVisita: 1, video: 'https://www.youtube.com/watch?v=1F3vlnJXzKs' },
  { matchId: 9, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=yAAC_g0UgWc' },
  { matchId: 10, golesLocal: 1, golesVisita: 3, video: 'https://youtu.be/NtvUzy00DuU' },
  { matchId: 11, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=Mger-g-Swbo' },
  { matchId: 12, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/lAJVri8pFn8' },
  { matchId: 13, golesLocal: 3, golesVisita: 0, video: 'https://www.youtube.com/watch?v=vQgYID2pJu8' },
  { matchId: 14, golesLocal: 1, golesVisita: 1, video: 'https://youtu.be/zB7gIkkJyw8' },
  { matchId: 15, golesLocal: 4, golesVisita: 0, video: 'https://www.youtube.com/watch?v=yF5mHzhRBWE' },
  { matchId: 16, golesLocal: 0, golesVisita: 2, video: 'https://www.youtube.com/watch?v=oDyyilfmDUs' },
  { matchId: 17, golesLocal: 1, golesVisita: 3, video: 'https://youtu.be/NPjmZp2iAwQ' },
  { matchId: 18, golesLocal: 2, golesVisita: 0, video: 'https://www.youtube.com/watch?v=8AGeRWAHUF0' },
];

const connectionString = process.env.DATABASE_URL_QUINIELA;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL_QUINIELA environment variable is not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

try {
  for (const item of initialResults) {
    await sql`
      INSERT INTO results (match_id, goles_local, goles_visita, video)
      VALUES (${item.matchId}, ${item.golesLocal}, ${item.golesVisita}, ${item.video})
      ON CONFLICT (match_id) DO UPDATE
      SET goles_local = EXCLUDED.goles_local,
          goles_visita = EXCLUDED.goles_visita,
          video = EXCLUDED.video,
          updated_at = now()
    `;
  }

  const count = await sql`SELECT COUNT(*)::int AS count FROM results`;
  console.log(`OK: resultados insertados/actualizados. Total en DB: ${count[0].count}`);
} catch (error) {
  console.error('ERROR seeding results:', error);
  process.exit(1);
} finally {
  await sql.end();
}
