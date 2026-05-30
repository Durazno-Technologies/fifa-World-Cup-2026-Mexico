export type Match = {
  id: number;
  group: string;
  local: string;
  visita: string;
  dateStr: string;
  stadium: string;
};

// 72 Partidos de la Fase de Grupos
export const matches: Match[] = [
  // Grupo A
  { id: 1, group: 'A', local: '🇲🇽 México', visita: '🇿🇦 Sudáfrica', dateStr: '11 de junio, 14:00', stadium: 'Estadio Azteca' },
  { id: 2, group: 'A', local: '🇰🇷 Corea del Sur', visita: '🇨🇿 Rep. Checa', dateStr: '12 de junio, 12:00', stadium: 'Estadio Akron' },
  { id: 3, group: 'A', local: '🇲🇽 México', visita: '🇰🇷 Corea del Sur', dateStr: '16 de junio, 19:00', stadium: 'Estadio BBVA' },
  { id: 4, group: 'A', local: '🇨🇿 Rep. Checa', visita: '🇿🇦 Sudáfrica', dateStr: '16 de junio, 16:00', stadium: 'Estadio Azteca' },
  { id: 5, group: 'A', local: '🇨🇿 Rep. Checa', visita: '🇲🇽 México', dateStr: '20 de junio, 15:00', stadium: 'Estadio Akron' },
  { id: 6, group: 'A', local: '🇿🇦 Sudáfrica', visita: '🇰🇷 Corea del Sur', dateStr: '20 de junio, 15:00', stadium: 'Estadio BBVA' },

  // Grupo B
  { id: 7, group: 'B', local: '🇨🇦 Canadá', visita: '🇧🇦 Bosnia y Herzegovina', dateStr: '12 de junio, 17:00', stadium: 'BC Place' },
  { id: 8, group: 'B', local: '🇶🇦 Catar', visita: '🇨🇭 Suiza', dateStr: '13 de junio, 13:00', stadium: 'Lumen Field' },
  { id: 9, group: 'B', local: '🇨🇦 Canadá', visita: '🇶🇦 Catar', dateStr: '17 de junio, 20:00', stadium: 'BMO Field' },
  { id: 10, group: 'B', local: '🇨🇭 Suiza', visita: '🇧🇦 Bosnia y Herzegovina', dateStr: '17 de junio, 17:00', stadium: 'BC Place' },
  { id: 11, group: 'B', local: '🇨🇭 Suiza', visita: '🇨🇦 Canadá', dateStr: '21 de junio, 14:00', stadium: 'Lumen Field' },
  { id: 12, group: 'B', local: '🇧🇦 Bosnia y Herzegovina', visita: '🇶🇦 Catar', dateStr: '21 de junio, 14:00', stadium: 'BMO Field' },

  // Grupo C
  { id: 13, group: 'C', local: '🇧🇷 Brasil', visita: '🇲🇦 Marruecos', dateStr: '13 de junio, 10:00', stadium: 'Levi\'s Stadium' },
  { id: 14, group: 'C', local: '🇭🇹 Haití', visita: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', dateStr: '13 de junio, 15:00', stadium: 'SoFi Stadium' },
  { id: 15, group: 'C', local: '🇧🇷 Brasil', visita: '🇭🇹 Haití', dateStr: '18 de junio, 18:00', stadium: 'Levi\'s Stadium' },
  { id: 16, group: 'C', local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', visita: '🇲🇦 Marruecos', dateStr: '18 de junio, 15:00', stadium: 'SoFi Stadium' },
  { id: 17, group: 'C', local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', visita: '🇧🇷 Brasil', dateStr: '22 de junio, 13:00', stadium: 'Lumen Field' },
  { id: 18, group: 'C', local: '🇲🇦 Marruecos', visita: '🇭🇹 Haití', dateStr: '22 de junio, 13:00', stadium: 'Levi\'s Stadium' },

  // Grupo D
  { id: 19, group: 'D', local: '🇺🇸 USA', visita: '🇵🇾 Paraguay', dateStr: '12 de junio, 14:00', stadium: 'SoFi Stadium' },
  { id: 20, group: 'D', local: '🇦🇺 Australia', visita: '🇹🇷 Turquía', dateStr: '14 de junio, 12:00', stadium: 'Levi\'s Stadium' },
  { id: 21, group: 'D', local: '🇺🇸 USA', visita: '🇦🇺 Australia', dateStr: '19 de junio, 19:00', stadium: 'Lumen Field' },
  { id: 22, group: 'D', local: '🇹🇷 Turquía', visita: '🇵🇾 Paraguay', dateStr: '19 de junio, 16:00', stadium: 'SoFi Stadium' },
  { id: 23, group: 'D', local: '🇹🇷 Turquía', visita: '🇺🇸 USA', dateStr: '23 de junio, 15:00', stadium: 'Levi\'s Stadium' },
  { id: 24, group: 'D', local: '🇵🇾 Paraguay', visita: '🇦🇺 Australia', dateStr: '23 de junio, 15:00', stadium: 'SoFi Stadium' },

  // Grupo E
  { id: 25, group: 'E', local: '🇩🇪 Alemania', visita: '🇨🇼 Curazao', dateStr: '14 de junio, 10:00', stadium: 'NRG Stadium' },
  { id: 26, group: 'E', local: '🇨🇮 Costa de Marfil', visita: '🇪🇨 Ecuador', dateStr: '14 de junio, 15:00', stadium: 'AT&T Stadium' },
  { id: 27, group: 'E', local: '🇩🇪 Alemania', visita: '🇨🇮 Costa de Marfil', dateStr: '19 de junio, 18:00', stadium: 'NRG Stadium' },
  { id: 28, group: 'E', local: '🇪🇨 Ecuador', visita: '🇨🇼 Curazao', dateStr: '19 de junio, 15:00', stadium: 'AT&T Stadium' },
  { id: 29, group: 'E', local: '🇪🇨 Ecuador', visita: '🇩🇪 Alemania', dateStr: '24 de junio, 13:00', stadium: 'Arrowhead Stadium' },
  { id: 30, group: 'E', local: '🇨🇼 Curazao', visita: '🇨🇮 Costa de Marfil', dateStr: '24 de junio, 13:00', stadium: 'NRG Stadium' },

  // Grupo F
  { id: 31, group: 'F', local: '🇳🇱 Países Bajos', visita: '🇯🇵 Japón', dateStr: '15 de junio, 12:00', stadium: 'Arrowhead Stadium' },
  { id: 32, group: 'F', local: '🇸🇪 Suecia', visita: '🇹🇳 Túnez', dateStr: '15 de junio, 17:00', stadium: 'AT&T Stadium' },
  { id: 33, group: 'F', local: '🇳🇱 Países Bajos', visita: '🇸🇪 Suecia', dateStr: '20 de junio, 20:00', stadium: 'NRG Stadium' },
  { id: 34, group: 'F', local: '🇹🇳 Túnez', visita: '🇯🇵 Japón', dateStr: '20 de junio, 17:00', stadium: 'Arrowhead Stadium' },
  { id: 35, group: 'F', local: '🇹🇳 Túnez', visita: '🇳🇱 Países Bajos', dateStr: '25 de junio, 14:00', stadium: 'AT&T Stadium' },
  { id: 36, group: 'F', local: '🇯🇵 Japón', visita: '🇸🇪 Suecia', dateStr: '25 de junio, 14:00', stadium: 'NRG Stadium' },

  // Grupo G
  { id: 37, group: 'G', local: '🇧🇪 Bélgica', visita: '🇪🇬 Egipto', dateStr: '15 de junio, 10:00', stadium: 'MetLife Stadium' },
  { id: 38, group: 'G', local: '🇮🇷 Irán', visita: '🇳🇿 Nueva Zelanda', dateStr: '16 de junio, 15:00', stadium: 'Gillette Stadium' },
  { id: 39, group: 'G', local: '🇧🇪 Bélgica', visita: '🇮🇷 Irán', dateStr: '21 de junio, 18:00', stadium: 'MetLife Stadium' },
  { id: 40, group: 'G', local: '🇳🇿 Nueva Zelanda', visita: '🇪🇬 Egipto', dateStr: '21 de junio, 15:00', stadium: 'Gillette Stadium' },
  { id: 41, group: 'G', local: '🇳🇿 Nueva Zelanda', visita: '🇧🇪 Bélgica', dateStr: '26 de junio, 13:00', stadium: 'Lincoln Financial Field' },
  { id: 42, group: 'G', local: '🇪🇬 Egipto', visita: '🇮🇷 Irán', dateStr: '26 de junio, 13:00', stadium: 'MetLife Stadium' },

  // Grupo H
  { id: 43, group: 'H', local: '🇪🇸 España', visita: '🇨🇻 Cabo Verde', dateStr: '16 de junio, 12:00', stadium: 'Lincoln Financial Field' },
  { id: 44, group: 'H', local: '🇸🇦 Arabia Saudita', visita: '🇺🇾 Uruguay', dateStr: '16 de junio, 17:00', stadium: 'Hard Rock Stadium' },
  { id: 45, group: 'H', local: '🇪🇸 España', visita: '🇸🇦 Arabia Saudita', dateStr: '22 de junio, 20:00', stadium: 'Mercedes-Benz Stadium' },
  { id: 46, group: 'H', local: '🇺🇾 Uruguay', visita: '🇨🇻 Cabo Verde', dateStr: '22 de junio, 17:00', stadium: 'Lincoln Financial Field' },
  { id: 47, group: 'H', local: '🇺🇾 Uruguay', visita: '🇪🇸 España', dateStr: '27 de junio, 14:00', stadium: 'Hard Rock Stadium' },
  { id: 48, group: 'H', local: '🇨🇻 Cabo Verde', visita: '🇸🇦 Arabia Saudita', dateStr: '27 de junio, 14:00', stadium: 'Mercedes-Benz Stadium' },

  // Grupo I
  { id: 49, group: 'I', local: '🇫🇷 Francia', visita: '🇸🇳 Senegal', dateStr: '17 de junio, 10:00', stadium: 'Mercedes-Benz Stadium' },
  { id: 50, group: 'I', local: '🇮🇶 Irak', visita: '🇳🇴 Noruega', dateStr: '17 de junio, 15:00', stadium: 'MetLife Stadium' },
  { id: 51, group: 'I', local: '🇫🇷 Francia', visita: '🇮🇶 Irak', dateStr: '23 de junio, 18:00', stadium: 'Gillette Stadium' },
  { id: 52, group: 'I', local: '🇳🇴 Noruega', visita: '🇸🇳 Senegal', dateStr: '23 de junio, 15:00', stadium: 'Mercedes-Benz Stadium' },
  { id: 53, group: 'I', local: '🇳🇴 Noruega', visita: '🇫🇷 Francia', dateStr: '27 de junio, 13:00', stadium: 'Lincoln Financial Field' },
  { id: 54, group: 'I', local: '🇸🇳 Senegal', visita: '🇮🇶 Irak', dateStr: '27 de junio, 13:00', stadium: 'MetLife Stadium' },

  // Grupo J
  { id: 55, group: 'J', local: '🇦🇷 Argentina', visita: '🇩🇿 Argelia', dateStr: '18 de junio, 12:00', stadium: 'Hard Rock Stadium' },
  { id: 56, group: 'J', local: '🇦🇹 Austria', visita: '🇯🇴 Jordania', dateStr: '18 de junio, 17:00', stadium: 'Gillette Stadium' },
  { id: 57, group: 'J', local: '🇦🇷 Argentina', visita: '🇦🇹 Austria', dateStr: '24 de junio, 20:00', stadium: 'Lincoln Financial Field' },
  { id: 58, group: 'J', local: '🇯🇴 Jordania', visita: '🇩🇿 Argelia', dateStr: '24 de junio, 17:00', stadium: 'Hard Rock Stadium' },
  { id: 59, group: 'J', local: '🇯🇴 Jordania', visita: '🇦🇷 Argentina', dateStr: '27 de junio, 15:00', stadium: 'Mercedes-Benz Stadium' },
  { id: 60, group: 'J', local: '🇩🇿 Argelia', visita: '🇦🇹 Austria', dateStr: '27 de junio, 15:00', stadium: 'Gillette Stadium' },

  // Grupo K
  { id: 61, group: 'K', local: '🇵🇹 Portugal', visita: '🇨🇩 RD del Congo', dateStr: '19 de junio, 10:00', stadium: 'Levi\'s Stadium' },
  { id: 62, group: 'K', local: '🇨🇴 Colombia', visita: '🇺🇿 Uzbekistán', dateStr: '19 de junio, 15:00', stadium: 'Lumen Field' },
  { id: 63, group: 'K', local: '🇵🇹 Portugal', visita: '🇨🇴 Colombia', dateStr: '25 de junio, 18:00', stadium: 'SoFi Stadium' },
  { id: 64, group: 'K', local: '🇺🇿 Uzbekistán', visita: '🇨🇩 RD del Congo', dateStr: '25 de junio, 15:00', stadium: 'Levi\'s Stadium' },
  { id: 65, group: 'K', local: '🇺🇿 Uzbekistán', visita: '🇵🇹 Portugal', dateStr: '27 de junio, 17:00', stadium: 'Lumen Field' },
  { id: 66, group: 'K', local: '🇨🇩 RD del Congo', visita: '🇨🇴 Colombia', dateStr: '27 de junio, 17:00', stadium: 'SoFi Stadium' },

  // Grupo L
  { id: 67, group: 'L', local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visita: '🇭🇷 Croacia', dateStr: '20 de junio, 12:00', stadium: 'AT&T Stadium' },
  { id: 68, group: 'L', local: '🇬🇭 Ghana', visita: '🇵🇦 Panamá', dateStr: '20 de junio, 17:00', stadium: 'Arrowhead Stadium' },
  { id: 69, group: 'L', local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', visita: '🇬🇭 Ghana', dateStr: '26 de junio, 20:00', stadium: 'NRG Stadium' },
  { id: 70, group: 'L', local: '🇵🇦 Panamá', visita: '🇭🇷 Croacia', dateStr: '26 de junio, 17:00', stadium: 'AT&T Stadium' },
  { id: 71, group: 'L', local: '🇵🇦 Panamá', visita: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', dateStr: '27 de junio, 19:00', stadium: 'Arrowhead Stadium' },
  { id: 72, group: 'L', local: '🇭🇷 Croacia', visita: '🇬🇭 Ghana', dateStr: '27 de junio, 19:00', stadium: 'NRG Stadium' },
];