import { useState, useCallback } from 'react';
import { getScramble } from '../utils/scramble';

const MAX_SCRAMBLE_HISTORY = 100;

export function useScramble(scrambleType: string) {
  const [scrambleHistory, setScrambleHistory] = useState<string[]>([]);
  const [scrambleIndex, setScrambleIndex] = useState<number>(0);

  const currentScramble = scrambleHistory[scrambleIndex] || '';

  const handleNextScramble = useCallback(() => {
    const nextScrambleText = getScramble(scrambleType);
    setScrambleHistory(prev => {
      const trimmed = prev.slice(0, Math.min(scrambleIndex + 1, MAX_SCRAMBLE_HISTORY));
      const newHistory = [...trimmed, nextScrambleText];
      if (newHistory.length > MAX_SCRAMBLE_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_SCRAMBLE_HISTORY);
      }
      return newHistory;
    });
    setScrambleIndex(prev => prev + 1);
  }, [scrambleType, scrambleIndex]);

  const handlePrevScramble = useCallback(() => {
    if (scrambleIndex > 0) {
      setScrambleIndex(prev => prev - 1);
    }
  }, [scrambleIndex]);

  const handleEventChange = useCallback((eventId: string) => {
    const newScr = getScramble(eventId);
    setScrambleHistory(prev => [...prev, newScr]);
    setScrambleIndex(prev => prev + 1);
  }, []);

  return {
    scrambleHistory,
    setScrambleHistory,
    scrambleIndex,
    setScrambleIndex,
    currentScramble,
    handleNextScramble,
    handlePrevScramble,
    handleEventChange,
  };
}
