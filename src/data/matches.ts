export type Match = {
  id: number;
  group: string;
  local: string;
  visita: string;
  dateStr: string;
  stadium: string;
};

// Generamos los 72 partidos de fase de grupos basados en los 12 grupos de 4 equipos del Mundial 2026
const groups: Record<string, string[]> = {
  A: ["México", "Sudáfrica", "Corea del Sur", "Irlanda"],
  B: ["Canadá", "Italia", "Catar", "Suiza"],
  C: ["Brasil", "Marruecos", "Haití", "Escocia"],
  D: ["USA", "Paraguay", "Australia", "Eslovaquia"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Países Bajos", "Japón", "Suecia", "Túnez"],
  G: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Bolivia", "Noruega"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Inglaterra", "Malí", "Colombia", "Uzbekistán"],
  L: ["Portugal", "Nigeria", "Honduras", "Fiyi"]
};

let idCounter = 1;
export const matches: Match[] = [];

Object.entries(groups).forEach(([groupName, teams]) => {
  const [t1, t2, t3, t4] = teams;
  // Jornada 1
  matches.push({ id: idCounter++, group: groupName, local: t1, visita: t2, dateStr: 'Jornada 1', stadium: 'Por definir' });
  matches.push({ id: idCounter++, group: groupName, local: t3, visita: t4, dateStr: 'Jornada 1', stadium: 'Por definir' });
  // Jornada 2
  matches.push({ id: idCounter++, group: groupName, local: t1, visita: t3, dateStr: 'Jornada 2', stadium: 'Por definir' });
  matches.push({ id: idCounter++, group: groupName, local: t4, visita: t2, dateStr: 'Jornada 2', stadium: 'Por definir' });
  // Jornada 3
  matches.push({ id: idCounter++, group: groupName, local: t4, visita: t1, dateStr: 'Jornada 3', stadium: 'Por definir' });
  matches.push({ id: idCounter++, group: groupName, local: t2, visita: t3, dateStr: 'Jornada 3', stadium: 'Por definir' });
});

// Regla de negocio solicitada
const mexSaMatch = matches.find(m => m.local === 'México' && m.visita === 'Sudáfrica');
if (mexSaMatch) {
  mexSaMatch.dateStr = '11 de junio de 2026';
  mexSaMatch.stadium = 'Estadio Azteca';
}
