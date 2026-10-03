import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Session,
  Solve,
  TimerSettings,
  Penalty
} from './types';
import {
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
  loadSettings,
  saveSettings
} from './utils/storage';
import { calcSessionStats, getEffectiveTime } from './utils/statistics';
import { getScramble } from './utils/scramble';
import { HeaderBar } from './components/HeaderBar';
import { LeftBar } from './components/LeftBar';
import { Sidebar } from './components/Sidebar';
import { TimerDisplay } from './components/TimerDisplay';
import { CubeNetView } from './components/CubeNetView';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ExportModal } from './components/Modals/ExportModal';
import { StatsModal } from './components/Modals/StatsModal';
import { ToolsModal } from './components/Modals/ToolsModal';
import { SolveDetailModal } from './components/Modals/SolveDetailModal';
import { SessionManagerModal } from './components/Modals/SessionManagerModal';

// Initial scramble generator
const INITIAL_SCRAMBLE = getScramble('333');

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => loadCurrentSessionId());
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());

  // Scramble navigation history
  const [scrambleHistory, setScrambleHistory] = useState<string[]>([INITIAL_SCRAMBLE]);
  const [scrambleIndex, setScrambleIndex] = useState<number>(0);

  // Active view toggles
  const [isVisualizerActive, setIsVisualizerActive] = useState<boolean>(true);
  const [isSidebarActive, setIsSidebarActive] = useState<boolean>(true);
  const [hideAllElements, setHideAllElements] = useState<boolean>(false);

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showTools, setShowTools] = useState<boolean>(false);
  const [showSessionManager, setShowSessionManager] = useState<boolean>(false);
  const [selectedSolve, setSelectedSolve] = useState<Solve | null>(null);
  const [selectedStatName, setSelectedStatName] = useState<string | undefined>(undefined);

  // Current session object
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || sessions[0];
  }, [sessions, currentSessionId]);

  // Current session stats
  const stats = useMemo(() => {
    return calcSessionStats(currentSession.solves, currentSession.bestStats);
  }, [currentSession.solves, currentSession.bestStats]);

  // Current scramble text
  const currentScramble = scrambleHistory[scrambleIndex] || INITIAL_SCRAMBLE;

  // Last solve information
  const lastSolve = useMemo(() => {
    if (currentSession.solves.length === 0) return null;
    return currentSession.solves[currentSession.solves.length - 1];
  }, [currentSession.solves]);

  // Diff ms vs previous solve
  const diffMs = useMemo(() => {
    if (currentSession.solves.length < 2) return null;
    const curr = currentSession.solves[currentSession.solves.length - 1];
    const prev = currentSession.solves[currentSession.solves.length - 2];
    const currTime = getEffectiveTime(curr);
    const prevTime = getEffectiveTime(prev);
    if (!isFinite(currTime) || !isFinite(prevTime)) return null;
    return currTime - prevTime;
  }, [currentSession.solves]);

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Persist current session ID
  useEffect(() => {
    saveCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Next / Prev Scramble handlers
  const handleNextScramble = useCallback(() => {
    const nextScrambleText = getScramble(currentSession.scrambleType);
    setScrambleHistory(prev => {
      const trimmed = prev.slice(0, scrambleIndex + 1);
      return [...trimmed, nextScrambleText];
    });
    setScrambleIndex(prev => prev + 1);
  }, [currentSession.scrambleType, scrambleIndex]);

  const handlePrevScramble = useCallback(() => {
    if (scrambleIndex > 0) {
      setScrambleIndex(prev => prev - 1);
    }
  }, [scrambleIndex]);

  const handleEventChange = useCallback((eventId: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === currentSessionId ? { ...s, scrambleType: eventId } : s))
    );
    const newScr = getScramble(eventId);
    setScrambleHistory(prev => [...prev, newScr]);
    setScrambleIndex(prev => prev + 1);
  }, [currentSessionId]);

  // Solve completed
  const handleSolveComplete = useCallback((timeMs: number, penalty: Penalty) => {
    const newSolveIndex = currentSession.solves.length + 1;
    const newSolve: Solve = {
      id: `solve-${newSolveIndex}-${Date.now()}`,
      index: newSolveIndex,
      time: timeMs,
      penalty,
      scramble: currentScramble,
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

    // Auto generate next scramble
    handleNextScramble();
  }, [currentSession.id, currentSession.solves.length, currentScramble, handleNextScramble]);

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
    setSelectedSolve(updated);
  }, [currentSession.id]);

  // Delete a single solve
  const handleDeleteSolve = useCallback((solveId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          const filtered = s.solves.filter(sol => sol.id !== solveId);
          // Re-index remaining solves
          const reIndexed = filtered.map((sol, idx) => ({ ...sol, index: idx + 1 }));
          return {
            ...s,
            solves: reIndexed
          };
        }
        return s;
      })
    );
    setSelectedSolve(null);
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
      // Create new session with this number
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Alt + z: Delete last solve
      if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (currentSession.solves.length > 0) {
          const last = currentSession.solves[currentSession.solves.length - 1];
          handleDeleteSolve(last.id);
        }
      }

      // Ctrl + 1/2/3: Mark last solve OK/+2/DNF
      if (e.ctrlKey && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
        e.preventDefault();
        if (currentSession.solves.length > 0) {
          const last = currentSession.solves[currentSession.solves.length - 1];
          const penalty: Penalty =
            e.code === 'Digit1' ? 'NONE' : e.code === 'Digit2' ? '+2' : 'DNF';
          handleUpdateSolve({ ...last, penalty });
        }
      }

      // Alt + Left / Right: Prev / Next scramble
      if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevScramble();
      }
      if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextScramble();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSession.solves, handleDeleteSolve, handleUpdateSolve, handlePrevScramble, handleNextScramble]);

  return (
    <div className="app-container">
      {/* Top Section: Left Toolbar & Top Scramble Bar */}
      {!hideAllElements && (
        <div className="top-section">
          <div className="left-controls-wrapper">
            <LeftBar
              onOpenSettings={() => setShowSettings(true)}
              onOpenExport={() => setShowExport(true)}
              onToggleVisualizer={() => setIsVisualizerActive(prev => !prev)}
              isVisualizerActive={isVisualizerActive}
              onToggleSidebar={() => setIsSidebarActive(prev => !prev)}
              isSidebarActive={isSidebarActive}
              onOpenStats={() => {
                setSelectedStatName(undefined);
                setShowStats(true);
              }}
              onOpenTools={() => setShowTools(true)}
            />
          </div>

          <HeaderBar
            currentScramble={currentScramble}
            category={currentSession.scrambleCategory}
            eventId={currentSession.scrambleType}
            onEventChange={handleEventChange}
            onPrevScramble={handlePrevScramble}
            onNextScramble={handleNextScramble}
            onOpenSettings={() => setShowSettings(true)}
            hasPrevScramble={scrambleIndex > 0}
          />
        </div>
      )}

      {/* Main Content Area: Sidebar & Center Timer */}
      <div className="main-content-area">
        {!hideAllElements && isSidebarActive && (
          <Sidebar
            session={currentSession}
            stats={stats}
            onSelectSolve={(solve) => setSelectedSolve(solve)}
            onClearSession={handleClearSession}
            onOpenSessionManager={() => setShowSessionManager(true)}
            onSwitchSession={handleSwitchSessionByNumber}
            onStatClick={(statName) => {
              setSelectedStatName(statName);
              setShowStats(true);
            }}
          />
        )}

        <TimerDisplay
          lastSolveTime={lastSolve ? lastSolve.time : null}
          lastSolvePenalty={lastSolve ? lastSolve.penalty : 'NONE'}
          diffMs={diffMs}
          currentAo5={stats.ao5.current}
          currentAo12={stats.ao12.current}
          settings={settings}
          onSolveComplete={handleSolveComplete}
          hideAllElements={hideAllElements}
          setHideAllElements={setHideAllElements}
        />

        {/* 2D Scramble Net Visualizer */}
        {!hideAllElements && isVisualizerActive && currentSession.scrambleType === '333' && (
          <CubeNetView
            scramble={currentScramble}
            onClose={() => setIsVisualizerActive(false)}
          />
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showExport && (
        <ExportModal
          sessions={sessions}
          onImportSessions={(newSessions) => {
            setSessions(newSessions);
            setCurrentSessionId(newSessions[0].id);
          }}
          onResetAll={() => {
            localStorage.clear();
            window.location.reload();
          }}
          onClose={() => setShowExport(false)}
        />
      )}

      {showStats && (
        <StatsModal
          session={currentSession}
          stats={stats}
          selectedStatName={selectedStatName}
          onClose={() => setShowStats(false)}
        />
      )}

      {showTools && (
        <ToolsModal
          currentScramble={currentScramble}
          onClose={() => setShowTools(false)}
        />
      )}

      {selectedSolve && (
        <SolveDetailModal
          solve={selectedSolve}
          onUpdateSolve={handleUpdateSolve}
          onDeleteSolve={handleDeleteSolve}
          onClose={() => setSelectedSolve(null)}
        />
      )}

      {showSessionManager && (
        <SessionManagerModal
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => setCurrentSessionId(id)}
          onCreateSession={(name) => {
            const newSess: Session = {
              id: `session-${Date.now()}`,
              name,
              solves: [],
              scrambleType: currentSession.scrambleType,
              scrambleCategory: 'WCA'
            };
            setSessions(prev => [...prev, newSess]);
            setCurrentSessionId(newSess.id);
          }}
          onRenameSession={(id, newName) => {
            setSessions(prev =>
              prev.map(s => (s.id === id ? { ...s, name: newName } : s))
            );
          }}
          onDeleteSession={(id) => {
            if (sessions.length > 1) {
              const remaining = sessions.filter(s => s.id !== id);
              setSessions(remaining);
              if (currentSessionId === id) {
                setCurrentSessionId(remaining[0].id);
              }
            }
          }}
          onClearSessionSolves={handleClearSessionSolves}
          onClearAllSessions={handleClearAllSessions}
          onClose={() => setShowSessionManager(false)}
        />
      )}
    </div>
  );
};
export default App;
