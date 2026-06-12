export type Match = {
  id: number;
  group: string;
  local: string;
  visita: string;
  dateStr: string;
  stadium: string;
  kickoff: number; // UNIX epoch seconds (Mexico City UTC-6)
};

// 72 Partidos de la Fase de Grupos
// Horarios en hora de Ciudad de México (UTC-6, sin horario de verano).
// Estadios con nombre oficial FIFA (español para México, inglés para USA/Canadá).
// Los ids son estables por emparejamiento (referenciados por predictions en DB);
// el orden del array es cronológico dentro de cada grupo.
// kickoff: timestamp UNIX en segundos, hora CDMX (UTC-6)
export const matches: Match[] = [
  // Grupo A
  { id: 1, group: 'A', local: '🇲🇽 México', visita: '🇿🇦 Sudáfrica', dateStr: '11 de junio, 13:00', stadium: 'Estadio Ciudad de México', kickoff: 1781204400 },
  { id: 2, group: 'A', local: '🇰🇷 Corea del Sur', visita: '🇨🇿 Rep. Checa', dateStr: '11 de junio, 20:00', stadium: 'Estadio Guadalajara', kickoff: 1781229600 },
  { id: 4, group: 'A', local: '🇨🇿 Rep. Checa', visita: '🇿🇦 Sudáfrica', dateStr: '18 de junio, 10:00', stadium: 'Atlanta Stadium', kickoff: 1781798400 },
  { id: 3, group: 'A', local: '🇲🇽 México', visita: '🇰🇷 Corea del Sur', dateStr: '18 de junio, 19:00', stadium: 'Estadio Guadalajara', kickoff: 1781830800 },
  { id: 5, group: 'A', local: '🇨🇿 Rep. Checa', visita: '🇲🇽 México', dateStr: '24 de junio, 19:00', stadium: 'Estadio Ciudad de México', kickoff: 1782349200 },
  { id: 6, group: 'A', local: '🇿🇦 Sudáfrica', visita: '🇰🇷 Corea del Sur', dateStr: '24 de junio, 19:00', stadium: 'Estadio Monterrey', kickoff: 1782349200 },

  // Grupo B
  { id: 7, group: 'B', local: '🇨🇦 Canadá', visita: '🇧🇦 Bosnia y Herzegovina', dateStr: '12 de junio, 13:00', stadium: 'Toronto Stadium', kickoff: 1781290800 },
  { id: 8, group: 'B', local: '🇶🇦 Catar', visita: '🇨🇭 Suiza', dateStr: '13 de junio, 13:00', stadium: 'San Francisco Bay Area Stadium', kickoff: 1781377200 },
  { id: 10, group: 'B', local: '🇨🇭 Suiza', visita: '🇧🇦 Bosnia y Herzegovina', dateStr: '18 de junio, 13:00', stadium: 'Los Angeles Stadium', kickoff: 1781809200 },
  { id: 9, group: 'B', local: '🇨🇦 Canadá', visita: '🇶🇦 Catar', dateStr: '18 de junio, 16:00', stadium: 'BC Place Vancouver', kickoff: 1781820000 },
  { id: 11, group: 'B', local: '🇨🇭 Suiza', visita: '🇨🇦 Canadá', dateStr: '24 de junio, 13:00', stadium: 'BC Place Vancouver', kickoff: 1782327600 },
  { id: 12, group: 'B', local: '🇧🇦 Bosnia y Herzegovina', visita: '🇶🇦 Catar', dateStr: '24 de junio, 13:00', stadium: 'Seattle Stadium', kickoff: 1782327600 },

  // Grupo C
  { id: 13, group: 'C', local: '🇧🇷 Brasil', visita: '🇲🇦 Marruecos', dateStr: '13 de junio, 16:00', stadium: 'New York New Jersey Stadium', kickoff: 1781388000 },
  { id: 14, group: 'C', local: '🇭🇹 Haití', visita: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', dateStr: '13 de junio, 19:00', stadium: 'Boston Stadium', kickoff: 1781398800 },
  { id: 16, group: 'C', local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', visita: '🇲🇦 Marruecos', dateStr: '19 de junio, 16:00', stadium: 'Boston Stadium', kickoff: 1781906400 },
  { id: 15, group: 'C', local: '🇧🇷 Brasil', visita: '🇭🇹 Haití', dateStr: '19 de junio, 18:30', stadium: 'Philadelphia Stadium', kickoff: 1781915400 },
  { id: 17, group: 'C', local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', visita: '🇧🇷 Brasil', dateStr: '24 de junio, 16:00', stadium: 'Miami Stadium', kickoff: 1782338400 },
  { id: 18, group: 'C', local: '🇲🇦 Marruecos', visita: '🇭🇹 Haití', dateStr: '24 de junio, 16:00', stadium: 'Atlanta Stadium', kickoff: 1782338400 },

  // Grupo D
  { id: 19, group: 'D', local: '🇺🇸 USA', visita: '🇵🇾 Paraguay', dateStr: '12 de junio, 19:00', stadium: 'Los Angeles Stadium', kickoff: 1781312400 },
  { id: 20, group: 'D', local: '🇦🇺 Australia', visita: '🇹🇷 Turquía', dateStr: '13 de junio, 22:00', stadium: 'BC Place Vancouver', kickoff: 1781409600 },
  { id: 21, group: 'D', local: '🇺🇸 USA', visita: '🇦🇺 Australia', dateStr: '19 de junio, 13:00', stadium: 'Seattle Stadium', kickoff: 1781895600 },
  { id: 22, group: 'D', local: '🇹🇷 Turquía', visita: '🇵🇾 Paraguay', dateStr: '19 de junio, 21:00', stadium: 'San Francisco Bay Area Stadium', kickoff: 1781924400 },
  { id: 23, group: 'D', local: '🇹🇷 Turquía', visita: '🇺🇸 USA', dateStr: '25 de junio, 20:00', stadium: 'Los Angeles Stadium', kickoff: 1782439200 },
  { id: 24, group: 'D', local: '🇵🇾 Paraguay', visita: '🇦🇺 Australia', dateStr: '25 de junio, 20:00', stadium: 'San Francisco Bay Area Stadium', kickoff: 1782439200 },

  // Grupo E
  { id: 25, group: 'E', local: '🇩🇪 Alemania', visita: '🇨🇼 Curazao', dateStr: '14 de junio, 11:00', stadium: 'Houston Stadium', kickoff: 1781456400 },
  { id: 26, group: 'E', local: '🇨🇮 Costa de Marfil', visita: '🇪🇨 Ecuador', dateStr: '14 de junio, 17:00', stadium: 'Philadelphia Stadium', kickoff: 1781478000 },
  { id: 27, group: 'E', local: '🇩🇪 Alemania', visita: '🇨🇮 Costa de Marfil', dateStr: '20 de junio, 14:00', stadium: 'Toronto Stadium', kickoff: 1781985600 },
  { id: 28, group: 'E', local: '🇪🇨 Ecuador', visita: '🇨🇼 Curazao', dateStr: '20 de junio, 18:00', stadium: 'Kansas City Stadium', kickoff: 1782000000 },
  { id: 29, group: 'E', local: '🇪🇨 Ecuador', visita: '🇩🇪 Alemania', dateStr: '25 de junio, 14:00', stadium: 'New York New Jersey Stadium', kickoff: 1782417600 },
  { id: 30, group: 'E', local: '🇨🇼 Curazao', visita: '🇨🇮 Costa de Marfil', dateStr: '25 de junio, 14:00', stadium: 'Philadelphia Stadium', kickoff: 1782417600 },

  // Grupo F
  { id: 31, group: 'F', local: '🇳🇱 Países Bajos', visita: '🇯🇵 Japón', dateStr: '14 de junio, 14:00', stadium: 'Dallas Stadium', kickoff: 1781467200 },
  { id: 32, group: 'F', local: '🇸🇪 Suecia', visita: '🇹🇳 Túnez', dateStr: '14 de junio, 20:00', stadium: 'Estadio Monterrey', kickoff: 1781488800 },
  { id: 33, group: 'F', local: '🇳🇱 Países Bajos', visita: '🇸🇪 Suecia', dateStr: '20 de junio, 11:00', stadium: 'Houston Stadium', kickoff: 1781974800 },
  { id: 34, group: 'F', local: '🇹🇳 Túnez', visita: '🇯🇵 Japón', dateStr: '20 de junio, 22:00', stadium: 'Estadio Monterrey', kickoff: 1782014400 },
  { id: 35, group: 'F', local: '🇹🇳 Túnez', visita: '🇳🇱 Países Bajos', dateStr: '25 de junio, 17:00', stadium: 'Kansas City Stadium', kickoff: 1782428400 },
  { id: 36, group: 'F', local: '🇯🇵 Japón', visita: '🇸🇪 Suecia', dateStr: '25 de junio, 17:00', stadium: 'Dallas Stadium', kickoff: 1782428400 },

  // Grupo G
  { id: 37, group: 'G', local: '🇧🇪 Bélgica', visita: '🇪🇬 Egipto', dateStr: '15 de junio, 13:00', stadium: 'Seattle Stadium', kickoff: 1781550000 },
  { id: 38, group: 'G', local: '🇮🇷 Irán', visita: '🇳🇿 Nueva Zelanda', dateStr: '15 de junio, 19:00', stadium: 'Los Angeles Stadium', kickoff: 1781571600 },
  { id: 39, group: 'G', local: '🇧🇪 Bélgica', visita: '🇮🇷 Irán', dateStr: '21 de junio, 13:00', stadium: 'Los Angeles Stadium', kickoff: 1782068400 },
  { id: 40, group: 'G', local: '🇳🇿 Nueva Zelanda', visita: '🇪🇬 Egipto', dateStr: '21 de junio, 19:00', stadium: 'BC Place Vancouver', kickoff: 1782090000 },
  { id: 41, group: 'G', local: '🇳🇿 Nueva Zelanda', visita: '🇧🇪 Bélgica', dateStr: '26 de junio, 21:00', stadium: 'BC Place Vancouver', kickoff: 1782529200 },
  { id: 42, group: 'G', local: '🇪🇬 Egipto', visita: '🇮🇷 Irán', dateStr: '26 de junio, 21:00', stadium: 'Seattle Stadium', kickoff: 1782529200 },

  // Grupo H
  { id: 43, group: 'H', local: '🇪🇸 España', visita: '🇨🇻 Cabo Verde', dateStr: '15 de junio, 10:00', stadium: 'Atlanta Stadium', kickoff: 1781539200 },
  { id: 44, group: 'H', local: '🇸🇦 Arabia Saudita', visita: '🇺🇾 Uruguay', dateStr: '15 de junio, 16:00', stadium: 'Miami Stadium', kickoff: 1781560800 },
  { id: 45, group: 'H', local: '🇪🇸 España', visita: '🇸🇦 Arabia Saudita', dateStr: '21 de junio, 10:00', stadium: 'Atlanta Stadium', kickoff: 1782057600 },
  { id: 46, group: 'H', local: '🇺🇾 Uruguay', visita: '🇨🇻 Cabo Verde', dateStr: '21 de junio, 16:00', stadium: 'Miami Stadium', kickoff: 1782079200 },
  { id: 47, group: 'H', local: '🇺🇾 Uruguay', visita: '🇪🇸 España', dateStr: '26 de junio, 18:00', stadium: 'Estadio Guadalajara', kickoff: 1782518400 },
  { id: 48, group: 'H', local: '🇨🇻 Cabo Verde', visita: '🇸🇦 Arabia Saudita', dateStr: '26 de junio, 18:00', stadium: 'Houston Stadium', kickoff: 1782518400 },

  // Grupo I
  { id: 49, group: 'I', local: '🇫🇷 Francia', visita: '🇸🇳 Senegal', dateStr: '16 de junio, 13:00', stadium: 'New York New Jersey Stadium', kickoff: 1781636400 },
  { id: 50, group: 'I', local: '🇮🇶 Irak', visita: '🇳🇴 Noruega', dateStr: '16 de junio, 16:00', stadium: 'Boston Stadium', kickoff: 1781647200 },
  { id: 51, group: 'I', local: '🇫🇷 Francia', visita: '🇮🇶 Irak', dateStr: '22 de junio, 15:00', stadium: 'Philadelphia Stadium', kickoff: 1782162000 },
  { id: 52, group: 'I', local: '🇳🇴 Noruega', visita: '🇸🇳 Senegal', dateStr: '22 de junio, 18:00', stadium: 'New York New Jersey Stadium', kickoff: 1782172800 },
  { id: 53, group: 'I', local: '🇳🇴 Noruega', visita: '🇫🇷 Francia', dateStr: '26 de junio, 13:00', stadium: 'Boston Stadium', kickoff: 1782500400 },
  { id: 54, group: 'I', local: '🇸🇳 Senegal', visita: '🇮🇶 Irak', dateStr: '26 de junio, 13:00', stadium: 'Toronto Stadium', kickoff: 1782500400 },

  // Grupo J
  { id: 55, group: 'J', local: '🇦🇷 Argentina', visita: '🇩🇿 Argelia', dateStr: '16 de junio, 19:00', stadium: 'Kansas City Stadium', kickoff: 1781658000 },
  { id: 56, group: 'J', local: '🇦🇹 Austria', visita: '🇯🇴 Jordania', dateStr: '16 de junio, 22:00', stadium: 'San Francisco Bay Area Stadium', kickoff: 1781668800 },
  { id: 57, group: 'J', local: '🇦🇷 Argentina', visita: '🇦🇹 Austria', dateStr: '22 de junio, 11:00', stadium: 'Dallas Stadium', kickoff: 1782147600 },
  { id: 58, group: 'J', local: '🇯🇴 Jordania', visita: '🇩🇿 Argelia', dateStr: '22 de junio, 21:00', stadium: 'San Francisco Bay Area Stadium', kickoff: 1782183600 },
  { id: 59, group: 'J', local: '🇯🇴 Jordania', visita: '🇦🇷 Argentina', dateStr: '27 de junio, 20:00', stadium: 'Dallas Stadium', kickoff: 1782612000 },
  { id: 60, group: 'J', local: '🇩🇿 Argelia', visita: '🇦🇹 Austria', dateStr: '27 de junio, 20:00', stadium: 'Kansas City Stadium', kickoff: 1782612000 },

  // Grupo K
  { id: 61, group: 'K', local: '🇵🇹 Portugal', visita: '🇨🇩 RD del Congo', dateStr: '17 de junio, 11:00', stadium: 'Houston Stadium', kickoff: 1781715600 },
  { id: 62, group: 'K', local: '🇺🇿 Uzbekistán', visita: '🇨🇴 Colombia', dateStr: '17 de junio, 20:00', stadium: 'Estadio Ciudad de México', kickoff: 1781748000 },
  { id: 65, group: 'K', local: '🇵🇹 Portugal', visita: '🇺🇿 Uzbekistán', dateStr: '23 de junio, 11:00', stadium: 'Houston Stadium', kickoff: 1782234000 },
  { id: 66, group: 'K', local: '🇨🇴 Colombia', visita: '🇨🇩 RD del Congo', dateStr: '23 de junio, 20:00', stadium: 'Estadio Guadalajara', kickoff: 1782266400 },
  { id: 63, group: 'K', local: '🇨🇴 Colombia', visita: '🇵🇹 Portugal', dateStr: '27 de junio, 17:30', stadium: 'Miami Stadium', kickoff: 1782603000 },
  { id: 64, group: 'K', local: '🇨🇩 RD del Congo', visita: '🇺🇿 Uzbekistán', dateStr: '27 de junio, 17:30', stadium: 'Atlanta Stadium', kickoff: 1782603000 },

  // Grupo L
  { id: 67, group: 'L', local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visita: '🇭🇷 Croacia', dateStr: '17 de junio, 14:00', stadium: 'Dallas Stadium', kickoff: 1781726400 },
  { id: 68, group: 'L', local: '🇬🇭 Ghana', visita: '🇵🇦 Panamá', dateStr: '17 de junio, 17:00', stadium: 'Toronto Stadium', kickoff: 1781737200 },
  { id: 69, group: 'L', local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visita: '🇬🇭 Ghana', dateStr: '23 de junio, 14:00', stadium: 'Boston Stadium', kickoff: 1782244800 },
  { id: 70, group: 'L', local: '🇵🇦 Panamá', visita: '🇭🇷 Croacia', dateStr: '23 de junio, 17:00', stadium: 'Toronto Stadium', kickoff: 1782255600 },
  { id: 71, group: 'L', local: '🇵🇦 Panamá', visita: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', dateStr: '27 de junio, 15:00', stadium: 'New York New Jersey Stadium', kickoff: 1782594000 },
  { id: 72, group: 'L', local: '🇭🇷 Croacia', visita: '🇬🇭 Ghana', dateStr: '27 de junio, 15:00', stadium: 'Philadelphia Stadium', kickoff: 1782594000 },
];