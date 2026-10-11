import React, { useMemo } from 'react';
import { Session, SessionStats, Solve } from '../types';
import { formatTime } from '../utils/formatTime';
import { getSolveAverages } from '../utils/statistics';

interface SidebarProps {
  session: Session;
  stats: SessionStats;
  onSelectSolve: (solve: Solve) => void;
  onClearSession: () => void;
  onOpenSessionManager: () => void;
  onSwitchSession: (sessionNumber: number) => void;
  onStatClick: (statName: string, value: number | null, isBest: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  stats,
  onSelectSolve,
  onClearSession,
  onOpenSessionManager,
  onSwitchSession,
  onStatClick
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

  // Reverse list so latest solve is at the top (matching in Cube Timer)
  const reversedSolves = useMemo(() => {
    return [...solvesWithAverages].reverse();
  }, [solvesWithAverages]);

  const statRows: Array<{ label: string; key: keyof SessionStats }> = [
    { label: '시간', key: 'single' },
    { label: 'mo3', key: 'mo3' },
    { label: 'ao5', key: 'ao5' },
    { label: 'ao12', key: 'ao12' },
    { label: 'ao25', key: 'ao25' },
    { label: 'ao50', key: 'ao50' },
    { label: 'ao100', key: 'ao100' },
    { label: 'ao200', key: 'ao200' },
    { label: 'ao500', key: 'ao500' }
  ];

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

      {/* Summary Table */}
      <table className="stats-table">
        <thead>
          <tr>
            <th></th>
            <th>현재</th>
            <th>최고</th>
          </tr>
        </thead>
        <tbody>
          {statRows.map(({ label, key }) => {
            const stat = stats[key] as { current: number | null; best: number | null; currentIsDnf?: boolean; bestIsDnf?: boolean };
            const currentStr = stat.currentIsDnf ? 'DNF' : formatTime(stat.current);
            const bestStr = stat.bestIsDnf ? 'DNF' : formatTime(stat.best);

            return (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <span
                    className="stat-link"
                    onClick={() => onStatClick(label, stat.current, false)}
                  >
                    {currentStr}
                  </span>
                </td>
                <td>
                  <span
                    className="stat-link"
                    onClick={() => onStatClick(label, stat.best, true)}
                  >
                    {bestStr}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Total & Mean */}
      <div className="session-summary-box">
        <div className="summary-line">
          완료: {stats.completedCount}/{stats.totalCount}
        </div>
        <div className="summary-line">
          평균: {formatTime(stats.mean)}
        </div>
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
