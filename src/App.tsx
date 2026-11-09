import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Session, Solve, Penalty } from './types';
import { getScramble } from './utils/scramble';
import { HeaderBar } from './components/HeaderBar';
import { LeftBar } from './components/LeftBar';
import { Sidebar } from './components/Sidebar';
import { TimerDisplay } from './components/TimerDisplay';
import { CubeNetView } from './components/CubeNetView';
import { StatsFloatingView } from './components/StatsFloatingView';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ExportModal } from './components/Modals/ExportModal';
import { StatsModal } from './components/Modals/StatsModal';
import { ToolsModal } from './components/Modals/ToolsModal';
import { SolveDetailModal } from './components/Modals/SolveDetailModal';
import { SessionManagerModal } from './components/Modals/SessionManagerModal';
import { useSessionManager } from './hooks/useSessionManager';
import { useSettings } from './hooks/useSettings';
import { useScramble } from './hooks/useScramble';
import { useModals } from './hooks/useModals';

// Initial scramble generator
const INITIAL_SCRAMBLE = getScramble('333');

export const App: React.FC = () => {
  // Custom hooks for separated concerns
  const {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    stats,
    lastSolve,
    diffMs,
    handleSolveComplete: handleSolveCompleteBase,
    handleUpdateSolve: handleUpdateSolveBase,
    handleDeleteSolve: handleDeleteSolveBase,
    handleClearSession,
    handleClearSessionSolves,
    handleClearAllSessions,
    handleSwitchSessionByNumber,
  } = useSessionManager();

  const { settings, setSettings } = useSettings();

  const {
    scrambleHistory,
    setScrambleHistory,
    scrambleIndex,
    setScrambleIndex,
    currentScramble,
    handleNextScramble,
    handlePrevScramble,
    handleEventChange,
  } = useScramble(currentSession.scrambleType);

  // Initialize scramble history with initial scramble if empty
  useEffect(() => {
    if (scrambleHistory.length === 0) {
      setScrambleHistory([INITIAL_SCRAMBLE]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const {
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
  } = useModals(currentSession, sessions);

  // Active view toggles
  const [isVisualizerActive, setIsVisualizerActive] = useState<boolean>(true);
  const [isSidebarActive, setIsSidebarActive] = useState<boolean>(true);
  const [isStatsActive, setIsStatsActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('baseballtimer_show_floating_stats');
    return saved !== null ? saved === 'true' : true;
  });
  const [hideAllElements, setHideAllElements] = useState<boolean>(false);

  // Solve completed — wraps base handler with best score check and scramble
  const handleSolveComplete = useCallback((timeMs: number, penalty: Penalty) => {
    // Check if it's a new personal best single (only for non-DNF solves)
    if (penalty !== 'DNF') {
      const effectiveTime = penalty === '+2' ? timeMs + 2000 : timeMs;
      const currentBest = stats.single.best;
      if (currentBest === null || effectiveTime < currentBest) {
        triggerBestScore();
      }
    }

    handleSolveCompleteBase(timeMs, penalty, currentScramble);
    handleNextScramble();
  }, [stats.single.best, triggerBestScore, handleSolveCompleteBase, currentScramble, handleNextScramble]);

  // Update a single solve — wraps base handler with modal update
  const handleUpdateSolve = useCallback((updated: Solve) => {
    handleUpdateSolveBase(updated);
    setSelectedSolve(updated);
  }, [handleUpdateSolveBase]);

  // Delete a single solve — wraps base handler with modal cleanup
  const handleDeleteSolve = useCallback((solveId: string) => {
    handleDeleteSolveBase(solveId);
    setSelectedSolve(null);
  }, [handleDeleteSolveBase]);

  // Refs to access latest values without re-registering listeners
  const currentSessionRef = useRef(currentSession);
  currentSessionRef.current = currentSession;
  const handleDeleteSolveRef = useRef(handleDeleteSolve);
  handleDeleteSolveRef.current = handleDeleteSolve;
  const handleUpdateSolveRef = useRef(handleUpdateSolve);
  handleUpdateSolveRef.current = handleUpdateSolve;
  const handlePrevScrambleRef = useRef(handlePrevScramble);
  handlePrevScrambleRef.current = handlePrevScramble;
  const handleNextScrambleRef = useRef(handleNextScramble);
  handleNextScrambleRef.current = handleNextScramble;

  // Global Keyboard Shortcuts — stable listener, no re-registration on solves change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const session = currentSessionRef.current;

      // Alt + z: Delete last solve
      if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (session.solves.length > 0) {
          const last = session.solves[session.solves.length - 1];
          handleDeleteSolveRef.current(last.id);
        }
      }

      // Ctrl + 1/2/3: Mark last solve OK/+2/DNF
      if (e.ctrlKey && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
        e.preventDefault();
        if (session.solves.length > 0) {
          const last = session.solves[session.solves.length - 1];
          const penalty: Penalty =
            e.code === 'Digit1' ? 'NONE' : e.code === 'Digit2' ? '+2' : 'DNF';
          handleUpdateSolveRef.current({ ...last, penalty });
        }
      }

      // Alt + Left / Right: Prev / Next scramble
      if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevScrambleRef.current();
      }
      if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextScrambleRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Best Score Banner */}
      {showBestScore && (
        <div className="best-score-banner" onClick={() => setShowBestScore(false)}>
          🏆 Best Score!
        </div>
      )}

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
              onToggleStats={() => {
                setIsStatsActive(prev => {
                  const next = !prev;
                  localStorage.setItem('baseballtimer_show_floating_stats', String(next));
                  return next;
                });
              }}
              isStatsActive={isStatsActive}
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
          currentAo25={stats.ao25.current}
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
            positionSetting={settings.scrambleNetPosition}
            onUpdatePositionSetting={(pos) =>
              setSettings(prev => ({ ...prev, scrambleNetPosition: pos }))
            }
            isSidebarActive={isSidebarActive}
          />
        )}

        {/* Floating Stats Summary Table on Desktop / Background */}
        {!hideAllElements && isStatsActive && (
          <StatsFloatingView
            session={currentSession}
            stats={stats}
            onClose={() => {
              setIsStatsActive(false);
              localStorage.setItem('baseballtimer_show_floating_stats', 'false');
            }}
            onStatClick={(statName) => {
              setSelectedStatName(statName);
              setShowStats(true);
            }}
            onOpenStatsModal={() => {
              setSelectedStatName(undefined);
              setShowStats(true);
            }}
            positionSetting={settings.statsPosition || 'top-left'}
            onUpdatePositionSetting={(pos) =>
              setSettings(prev => ({ ...prev, statsPosition: pos }))
            }
            isSidebarActive={isSidebarActive}
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
