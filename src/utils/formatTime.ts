import { Penalty } from '../types';

export function formatTime(
  ms: number | null | undefined,
  penalty: Penalty = 'NONE',
  showMilli: boolean = true
): string {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return '--';
  }

  if (penalty === 'DNF') {
    return 'DNF';
  }

  let effectiveMs = ms;
  if (penalty === '+2') {
    effectiveMs += 2000;
  }

  const totalSeconds = effectiveMs / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor(effectiveMs % 1000);
  const centiseconds = Math.floor((effectiveMs % 1000) / 10);

  const fracStr = showMilli
    ? milliseconds.toString().padStart(3, '0')
    : centiseconds.toString().padStart(2, '0');

  let timeStr = '';
  if (hours > 0) {
    const minPadded = minutes.toString().padStart(2, '0');
    const secPadded = seconds.toString().padStart(2, '0');
    timeStr = `${hours}:${minPadded}:${secPadded}.${fracStr}`;
  } else if (minutes > 0) {
    const secPadded = seconds.toString().padStart(2, '0');
    timeStr = `${minutes}:${secPadded}.${fracStr}`;
  } else {
    timeStr = `${seconds}.${fracStr}`;
  }

  if (penalty === '+2') {
    return `${timeStr}+`;
  }

  return timeStr;
}

export function formatDiff(diffMs: number | null): { text: string; isPositive: boolean } | null {
  if (diffMs === null || isNaN(diffMs)) return null;

  const sign = diffMs >= 0 ? '+' : '-';
  const absMs = Math.abs(diffMs);
  const totalSeconds = (absMs / 1000).toFixed(3);

  return {
    text: `(${sign}${totalSeconds})`,
    isPositive: diffMs > 0 // in cubing, positive means slower (worse/red), negative means faster (better/green)
  };
}
