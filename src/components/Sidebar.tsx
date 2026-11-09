import React, { useMemo } from 'react';
import { Session, SessionStats, Solve } from '../types';
import { formatTime } from '../utils/formatTime';
import { getSolveAverages } from '../utils/statistics';

interface SidebarProps {
  session: Session;
  stats?: SessionStats;
  onSelectSolve: (solve: Solve) => void;
  onClearSession: () => void;
  onOpenSessionManager: () => void;
  onSwitchSession: (sessionNumber: number) => void;
  onStatClick?: (statName: string, value: number | null, isBest: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  onSelectSolve,
  onClearSession,
  onOpenSessionManager,
  onSwitchSession
}) => {
  // Precalculate rolling ao5 and ao12 for all solves
  const solvesWithAverages = useMemo(() => {
    return session.solves.map((solve, index) => {
      const { ao5, ao12 } = getSolveAverages(session.solves, index);
      return {
        solve,
        ao5,
        ao12
      };
    });
  }, [session.solves]);

  // Reverse list so latest solve is at the top (matching Baseball Timer)
  const reversedSolves = useMemo(() => {
    return [...solvesWithAverages].reverse();
  }, [solvesWithAverages]);

  return (
    <div className="sidebar-panel">
      {/* Session Header */}
      <div className="sidebar-header">
        <button
          className="session-name-btn"
          onClick={onOpenSessionManager}
          title="Session Manager / 모둠 관리자"
        >
          모둠
        </button>
        <input
          type="text"
          className="session-input"
          value={session.name}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!isNaN(num) && num > 0) {
              onSwitchSession(num);
            }
          }}
          aria-label="Current session"
        />
        <button
          className="session-del-btn"
          onClick={onClearSession}
          title="Reset session / 현재 모둠 기록 초기화"
          aria-label="Reset session"
        >
          X
        </button>
      </div>

      {/* Solve History Table */}
      <div className="solve-list-container">
        <table className="solve-list-table">
          <thead>
            <tr>
              <th>⌕</th>
              <th>시간</th>
              <th>ao5</th>
              <th>ao12</th>
            </tr>
          </thead>
          <tbody>
            {reversedSolves.map(({ solve, ao5, ao12 }) => (
              <tr
                key={solve.id}
                className="solve-row"
                onClick={() => onSelectSolve(solve)}
                title={`Solve #${solve.index} - 클릭하여 세부정보 확인/수정`}
              >
                <td>{solve.index}</td>
                <td>{formatTime(solve.time, solve.penalty)}</td>
                <td>{formatTime(ao5)}</td>
                <td>{formatTime(ao12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
