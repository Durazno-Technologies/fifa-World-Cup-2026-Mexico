import { matches, type Match } from '../data/matches';

/**
 * Variable para modo debug/test. Si se asigna un timestamp (segundos),
 * `getMexicoCityNow` devuelve esa fecha en vez de la real.
 * Solo disponible en SSR, nunca en cliente.
 */
let _testNowSec: number | null = null;

export function setTestNowSec(sec: number | null): void {
  _testNowSec = sec;
}

/**
 * Obtiene la hora actual en CDMX (UTC-6, sin horario de verano)
 * usando el servidor SSR, NO el reloj del cliente.
 * 
 * Mexico City timezone: UTC-6 year-round (no DST in Mexico since 2022).
 */
function getMexicoCityNow(): Date {
  if (_testNowSec !== null) {
    return new Date(_testNowSec * 1000);
  }
  const now = new Date();
  // Get UTC time
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  // Mexico City is UTC-6
  const cdmxMs = utcMs - (6 * 60 * 60 * 1000);
  return new Date(cdmxMs);
}

/**
 * Convierte un timestamp UNIX (segundos, CDMX) a objeto Date.
 */
function kickoffToDate(kickoff: number): Date {
  return new Date(kickoff * 1000);
}

export type NextMatchInfo = {
  /** The match(es) that are playing next. May be 1 or 2 if simultaneous kickoff. */
  nextMatches: Match[];
  /** Whether there are any remaining matches */
  hasNext: boolean;
  /** Human-readable label like "Siguiente: 11 de junio, 13:00" */
  label: string;
};

/**
 * Given a predictions map (matchId -> user prediction), finds the next match(es)
 * and returns the prediction details for rendering.
 */
export type PredictionSummary = {
  matchId: number;
  local: string;
  visita: string;
  golesLocal: number;
  golesVisita: number;
  kickoff: number;
};

/**
 * Finds the next upcoming match(es) based on Mexico City server time.
 * Returns all matches that share the same earliest future kickoff time.
 * If all matches have started, returns empty.
 */
export function getNextMatches(): NextMatchInfo {
  const now = getMexicoCityNow();
  const nowSec = Math.floor(now.getTime() / 1000);

  // Filter matches that haven't started yet (kickoff > now)
  const upcoming = matches.filter(m => m.kickoff > nowSec);

  if (upcoming.length === 0) {
    return { nextMatches: [], hasNext: false, label: '' };
  }

  // Find the earliest kickoff time among upcoming matches
  const earliestKickoff = Math.min(...upcoming.map(m => m.kickoff));

  // Get all matches at that kickoff (handles simultaneous matches)
  const nextMatches = upcoming.filter(m => m.kickoff === earliestKickoff);

  // Build a human-readable label from the first match's dateStr
  const first = nextMatches[0];
  // Extract just the date and time part from dateStr
  const dayTime = first.dateStr; // e.g. "11 de junio, 13:00"
  const groupLabel = nextMatches.length === 1
    ? `Grupo ${first.group}`
    : `Grupos ${nextMatches.map(m => m.group).join('/')}`;

  const label = `Siguiente: ${dayTime} · ${groupLabel}`;

  return { nextMatches, hasNext: true, label };
}

/**
 * Given a user's predictions, returns the summary of predictions
 * for the next match(es). Returns empty array if no next match.
 */
export function getPredictionsForNextMatches(
  userPredictions: Array<{ match_id: number; goles_local: number; goles_visita: number }>
): PredictionSummary[] {
  const { nextMatches, hasNext } = getNextMatches();
  if (!hasNext) return [];

  const predByMatch = new Map(userPredictions.map(p => [p.match_id, p]));

  return nextMatches.map(m => {
    const pred = predByMatch.get(m.id);
    return {
      matchId: m.id,
      local: m.local,
      visita: m.visita,
      golesLocal: pred?.goles_local ?? -1,
      golesVisita: pred?.goles_visita ?? -1,
      kickoff: m.kickoff,
    };
  });
}

/**
 * Converts a match flag emoji and name to just the flag emoji.
 * E.g. "🇲🇽 México" -> "🇲🇽"
 */
export function extractFlag(name: string): string {
  // Flag emojis are in the range \u{1F1E6}-\u{1F1FF} (Regional Indicator Symbols)
  // They come in pairs (2 surrogate pairs = 4 bytes per flag)
  const match = name.match(/[\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}]/u);
  // Also handle England/Scotland which use tag sequences with the flag of England/Scotland
  const tagMatch = name.match(/[\u{1F3F4}][\u{E0061}-\u{E007A}]+[\u{E007F}]/u);
  return tagMatch?.[0] ?? match?.[0] ?? '⚽';
}

