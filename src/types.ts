export type Penalty = 'NONE' | '+2' | 'DNF';

export interface Solve {
  id: string;
  index: number;
  time: number; // in milliseconds
  penalty: Penalty;
  scramble: string;
  date: number; // Unix timestamp
  comment?: string;
}

export interface SessionBestStats {
  single?: number;
  mo3?: number;
  ao5?: number;
  ao12?: number;
  ao25?: number;
  ao50?: number;
  ao100?: number;
  ao200?: number;
  ao500?: number;
}

export interface Session {
  id: string;
  name: string;
  solves: Solve[];
  scrambleType: string;
  scrambleCategory: string;
  bestStats?: SessionBestStats;
}

export interface AverageStat {
  current: number | null; // in milliseconds, or null if not enough solves / DNF
  best: number | null;
  currentIsDnf?: boolean;
  bestIsDnf?: boolean;
}

export interface SessionStats {
  single: AverageStat;
  mo3: AverageStat;
  ao5: AverageStat;
  ao12: AverageStat;
  ao25: AverageStat;
  ao50: AverageStat;
  ao100: AverageStat;
  ao200: AverageStat;
  ao500: AverageStat;
  completedCount: number;
  totalCount: number;
  mean: number | null;
}

export type ScrambleNetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';

export interface TimerSettings {
  holdTimeMs: number; // default 300ms
  inspection: boolean; // WCA inspection countdown (15s)
  voiceAlert: boolean; // Voice alert at 8s / 12s
  showMilli: boolean; // Show 3 decimals (.mmm)
  showDiff: boolean; // Show (+X.XXX) / (-X.XXX) difference
  showAvgLabel: boolean; // Show ao5, ao12 under timer
  hideWhenTiming: boolean; // Hide UI elements when solving
  theme: 'pastel-green' | 'solarized-dark' | 'classic-white' | 'black';
  language: 'ko' | 'en';
  timerSize: number; // rem size multiplier
  scrambleNetPosition?: ScrambleNetPosition;
}

