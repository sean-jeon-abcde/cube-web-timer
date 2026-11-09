import { useState, useCallback, useRef, useEffect } from 'react';
import { Session, Solve, Penalty } from '../types';

export function useModals(currentSession: Session, sessions: Session[]) {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showTools, setShowTools] = useState<boolean>(false);
  const [showSessionManager, setShowSessionManager] = useState<boolean>(false);
  const [selectedSolve, setSelectedSolve] = useState<Solve | null>(null);
  const [selectedStatName, setSelectedStatName] = useState<string | undefined>(undefined);

  // Best Score banner state
  const [showBestScore, setShowBestScore] = useState<boolean>(false);
  const bestScoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBestScore = useCallback(() => {
    setShowBestScore(true);
    if (bestScoreTimerRef.current) clearTimeout(bestScoreTimerRef.current);
    bestScoreTimerRef.current = setTimeout(() => {
      setShowBestScore(false);
    }, 3000);
  }, []);

  return {
    showSettings,
    setShowSettings,
    showExport,
    setShowExport,
    showStats,
    setShowStats,
    showTools,
    setShowTools,
    showSessionManager,
    setShowSessionManager,
    selectedSolve,
    setSelectedSolve,
    selectedStatName,
    setSelectedStatName,
    showBestScore,
    setShowBestScore,
    triggerBestScore,
  };
}
