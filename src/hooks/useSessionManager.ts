import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Solve, Penalty } from '../types';
import { loadSessions, saveSessions, loadCurrentSessionId, saveCurrentSessionId } from '../utils/storage';
import { calcSessionStats, getEffectiveTime } from '../utils/statistics';

export function useSessionManager() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => loadCurrentSessionId());

  // Current session object
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  // Current session stats
  const stats = calcSessionStats(currentSession.solves, currentSession.bestStats);

  // Last solve information
  const lastSolve = currentSession.solves.length > 0
    ? currentSession.solves[currentSession.solves.length - 1]
    : null;

  // Diff ms vs previous solve
  const diffMs = (() => {
    if (currentSession.solves.length < 2) return null;
    const curr = currentSession.solves[currentSession.solves.length - 1];
    const prev = currentSession.solves[currentSession.solves.length - 2];
    const currTime = getEffectiveTime(curr);
    const prevTime = getEffectiveTime(prev);
    if (!isFinite(currTime) || !isFinite(prevTime)) return null;
    return currTime - prevTime;
  })();

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Persist current session ID
  useEffect(() => {
    saveCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  // Solve completed
  const handleSolveComplete = useCallback((timeMs: number, penalty: Penalty, scramble: string) => {
    const newSolveIndex = currentSession.solves.length + 1;
    const newSolve: Solve = {
      id: `solve-${newSolveIndex}-${Date.now()}`,
      index: newSolveIndex,
      time: timeMs,
      penalty,
      scramble,
      date: Date.now()
    };

    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            solves: [...s.solves, newSolve]
          };
        }
        return s;
      })
    );
  }, [currentSession.id, currentSession.solves.length]);

  // Update a single solve
  const handleUpdateSolve = useCallback((updated: Solve) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            solves: s.solves.map(sol => (sol.id === updated.id ? updated : sol))
          };
        }
        return s;
      })
    );
  }, [currentSession.id]);

  // Delete a single solve
  const handleDeleteSolve = useCallback((solveId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          const filtered = s.solves.filter(sol => sol.id !== solveId);
          const reIndexed = filtered.map((sol, idx) => ({ ...sol, index: idx + 1 }));
          return {
            ...s,
            solves: reIndexed
          };
        }
        return s;
      })
    );
  }, [currentSession.id]);

  // Clear current session
  const handleClearSession = useCallback(() => {
    if (window.confirm(`모둠 '${currentSession.name}'의 모든 솔브 기록을 초기화하시겠습니까?`)) {
      setSessions(prev =>
        prev.map(s => (s.id === currentSession.id ? { ...s, solves: [], bestStats: undefined } : s))
      );
    }
  }, [currentSession.id, currentSession.name]);

  // Clear solves of a specific session
  const handleClearSessionSolves = useCallback((id: string) => {
    const targetSession = sessions.find(s => s.id === id);
    const sessionName = targetSession ? targetSession.name : id;
    if (window.confirm(`모둠 '${sessionName}'의 모든 솔브 기록을 초기화하시겠습니까?`)) {
      setSessions(prev =>
        prev.map(s => (s.id === id ? { ...s, solves: [], bestStats: undefined } : s))
      );
    }
  }, [sessions]);

  // Clear all sessions' solves
  const handleClearAllSessions = useCallback(() => {
    if (window.confirm('모든 모둠의 솔브 기록을 전부 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setSessions(prev =>
        prev.map(s => ({
          ...s,
          solves: [],
          bestStats: undefined
        }))
      );
    }
  }, []);

  // Switch session by number
  const handleSwitchSessionByNumber = useCallback((num: number) => {
    const existing = sessions.find(s => s.name === String(num));
    if (existing) {
      setCurrentSessionId(existing.id);
    } else {
      const newSess: Session = {
        id: `session-${Date.now()}`,
        name: String(num),
        solves: [],
        scrambleType: currentSession.scrambleType,
        scrambleCategory: 'WCA'
      };
      setSessions(prev => [...prev, newSess]);
      setCurrentSessionId(newSess.id);
    }
  }, [sessions, currentSession.scrambleType]);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    stats,
    lastSolve,
    diffMs,
    handleSolveComplete,
    handleUpdateSolve,
    handleDeleteSolve,
    handleClearSession,
    handleClearSessionSolves,
    handleClearAllSessions,
    handleSwitchSessionByNumber,
  };
}
