import { Solve, SessionStats, AverageStat, SessionBestStats } from '../types';

export function getEffectiveTime(solve: Solve): number {
  if (solve.penalty === 'DNF') return Infinity;
  if (solve.penalty === '+2') return solve.time + 2000;
  return solve.time;
}

export function calcTrimmedAverage(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;

  const slice = solves.slice(solves.length - n);
  const times = slice.map(getEffectiveTime).sort((a, b) => a - b);

  // WCA standard trim count
  let trimCount = 1;
  if (n === 3) {
    // mo3 is mean without trimming
    trimCount = 0;
  } else if (n >= 50) {
    trimCount = Math.floor(n * 0.05);
  } else {
    trimCount = 1; // 1 for ao5, ao12, ao25
  }

  // Count DNFs
  const dnfCount = times.filter(t => !isFinite(t)).length;
  if (dnfCount > trimCount) {
    return Infinity; // DNF
  }

  const validTimes = times.slice(trimCount, n - trimCount);
  const sum = validTimes.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / validTimes.length);
}

export function calcBestAverage(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;

  let best: number | null = null;
  for (let i = 0; i <= solves.length - n; i++) {
    const windowSolves = solves.slice(i, i + n);
    const avg = calcTrimmedAverage(windowSolves, n);
    if (avg !== null && isFinite(avg)) {
      if (best === null || avg < best) {
        best = avg;
      }
    }
  }

  return best;
}

export function calcSessionStats(solves: Solve[], bestOverrides?: SessionBestStats): SessionStats {
  const totalCount = solves.length;
  const completedSolves = solves.filter(s => s.penalty !== 'DNF');
  const completedCount = completedSolves.length;

  // Mean
  let mean: number | null = null;
  if (completedCount > 0) {
    const sum = completedSolves.reduce((acc, s) => acc + getEffectiveTime(s), 0);
    mean = Math.round(sum / completedCount);
  }

  // Single
  let currentSingle: number | null = null;
  let singleIsDnf = false;
  if (totalCount > 0) {
    const lastSolve = solves[totalCount - 1];
    if (lastSolve.penalty === 'DNF') {
      currentSingle = null;
      singleIsDnf = true;
    } else {
      currentSingle = getEffectiveTime(lastSolve);
    }
  }

  let bestSingle: number | null = bestOverrides?.single ?? null;
  completedSolves.forEach(s => {
    const t = getEffectiveTime(s);
    if (bestSingle === null || t < bestSingle) {
      bestSingle = t;
    }
  });

  const getStat = (n: number, overrideKey?: keyof SessionBestStats): AverageStat => {
    const current = calcTrimmedAverage(solves, n);
    let best = calcBestAverage(solves, n);
    const overrideVal = overrideKey ? bestOverrides?.[overrideKey] : undefined;
    if (overrideVal !== undefined) {
      if (best === null || overrideVal < best) {
        best = overrideVal;
      }
    }
    return {
      current: current === Infinity ? null : current,
      currentIsDnf: current === Infinity,
      best: best,
      bestIsDnf: best === Infinity
    };
  };

  return {
    single: {
      current: currentSingle,
      best: bestSingle,
      currentIsDnf: singleIsDnf
    },
    mo3: getStat(3, 'mo3'),
    ao5: getStat(5, 'ao5'),
    ao12: getStat(12, 'ao12'),
    ao25: getStat(25, 'ao25'),
    ao50: getStat(50, 'ao50'),
    ao100: getStat(100, 'ao100'),
    ao200: getStat(200, 'ao200'),
    ao500: getStat(500, 'ao500'),
    completedCount,
    totalCount,
    mean
  };
}

export function getSolveAverages(solves: Solve[], index: number): { ao5: number | null; ao12: number | null } {
  const subSolves5 = solves.slice(Math.max(0, index - 4), index + 1);
  const ao5 = subSolves5.length === 5 ? calcTrimmedAverage(subSolves5, 5) : null;

  const subSolves12 = solves.slice(Math.max(0, index - 11), index + 1);
  const ao12 = subSolves12.length === 12 ? calcTrimmedAverage(subSolves12, 12) : null;

  return { ao5, ao12 };
}
