import { matches, type Match } from '../data/matches';

/**
 * Variable para modo debug/test. Si se asigna un timestamp (segundos, real UTC),
 * se usa en vez de Date.now() para las comparaciones.
 * Solo disponible en SSR, nunca en cliente.
 */
let _testNowSec: number | null = null;

export function setTestNowSec(sec: number | null): void {
  _testNowSec = sec;
}

/**
 * Duración total estimada de un partido en segundos (~115 minutos).
 */
const MATCH_DURATION_SEC = 115 * 60; // 6900

/**
 * Devuelve el timestamp actual en segundos (real UTC, UNIX epoch).
 * Si _testNowSec está activo, devuelve ese valor.
 */
function getCurrentTimeSec(): number {
  if (_testNowSec !== null) {
    return _testNowSec;
  }
  return Math.floor(Date.now() / 1000);
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
 * Finds the next upcoming match(es) based on current time (real UTC).
 * A match is considered "in progress" until kickoff + ~115 min.
 * Once all matches finish, returns empty.
 */
export function getNextMatches(): NextMatchInfo {
  const nowSec = getCurrentTimeSec();

  // Filter matches that haven't finished yet (kickoff + duration >= now)
  // Using >= so the match is "in progress" during the entire ~115min window
  const upcoming = matches.filter(m => m.kickoff + MATCH_DURATION_SEC >= nowSec);

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

