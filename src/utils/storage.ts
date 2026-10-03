import { Session, TimerSettings } from '../types';

const SESSIONS_KEY = 'intimer_sessions_v2';
const CURRENT_SESSION_ID_KEY = 'intimer_current_session_id_v2';
const SETTINGS_KEY = 'intimer_settings_v1';
const LEGACY_SETTINGS_KEY = 'cstimer_settings_v1';
const LEGACY_KEYS = [
  'intimer_sessions_v1',
  'intimer_current_session_id_v1',
  'cstimer_sessions_v1',
  'cstimer_current_session_id_v1'
];

export const DEFAULT_SETTINGS: TimerSettings = {
  holdTimeMs: 300,
  inspection: false,
  voiceAlert: true,
  showMilli: true,
  showDiff: true,
  showAvgLabel: true,
  hideWhenTiming: false,
  theme: 'pastel-green',
  language: 'ko',
  timerSize: 1.0
};

export function createInitialSession(): Session {
  return {
    id: 'session-1',
    name: '1',
    solves: [],
    scrambleType: '333',
    scrambleCategory: 'WCA'
  };
}

export function loadSessions(): Session[] {
  // Clean up legacy dummy session storage if present
  try {
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
  } catch {}

  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load sessions from localStorage', e);
  }

  const initial = [createInitialSession()];
  saveSessions(initial);
  return initial;
}

export function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to localStorage', e);
  }
}

export function loadCurrentSessionId(): string {
  try {
    const id = localStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (id) return id;
  } catch {}
  return 'session-1';
}

export function saveCurrentSessionId(id: string) {
  try {
    localStorage.setItem(CURRENT_SESSION_ID_KEY, id);
  } catch {}
}

export function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: TimerSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
