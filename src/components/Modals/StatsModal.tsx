import React, { useMemo } from 'react';
import { Session, SessionStats } from '../../types';
import { X } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';
import { getEffectiveTime } from '../../utils/statistics';

interface StatsModalProps {
  session: Session;
  stats: SessionStats;
  selectedStatName?: string;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  session,
  stats,
  selectedStatName,
  onClose
}) => {
  const distribution = useMemo(() => {
    const valid = session.solves.filter(s => s.penalty !== 'DNF');
    if (valid.length === 0) return [];

    const timesSec = valid.map(s => getEffectiveTime(s) / 1000);
    const minSec = Math.floor(Math.min(...timesSec) / 5) * 5;
    const maxSec = Math.ceil(Math.max(...timesSec) / 5) * 5;

    const bins: { label: string; count: number; percent: number }[] = [];
    for (let r = minSec; r < maxSec; r += 5) {
      const c = timesSec.filter(t => t >= r && t < r + 5).length;
      bins.push({
        label: `${r.toFixed(0)} - ${(r + 5).toFixed(0)}s`,
        count: c,
        percent: Math.round((c / valid.length) * 100)
      });
    }
    return bins;
  }, [session.solves]);

  const stdDev = useMemo(() => {
    const valid = session.solves.filter(s => s.penalty !== 'DNF');
    if (valid.length <= 1) return null;
    const mean = stats.mean ?? 0;
    const sumSq = valid.reduce((acc, s) => {
      const diff = getEffectiveTime(s) - mean;
      return acc + diff * diff;
    }, 0);
    return Math.round(Math.sqrt(sumSq / valid.length));
  }, [session.solves, stats.mean]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            통계 세부정보 (Statistics {selectedStatName ? `- ${selectedStatName}` : ''})
          </span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close stats modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>모둠 {session.name} 요약</div>
            <div>총 솔브 수: {stats.totalCount} (완료: {stats.completedCount}, DNF: {stats.totalCount - stats.completedCount})</div>
            <div>전체 평균 (Session Mean): <strong>{formatTime(stats.mean)}</strong></div>
            {stdDev !== null && (
              <div>표준편차 (σ): <strong>{(stdDev / 1000).toFixed(3)}s</strong></div>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '6px 4px' }}>지표</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>현재 (Current)</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>최고 (Best)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Single', stat: stats.single },
                { label: 'mo3', stat: stats.mo3 },
                { label: 'ao5', stat: stats.ao5 },
                { label: 'ao12', stat: stats.ao12 },
                { label: 'ao25', stat: stats.ao25 },
                { label: 'ao50', stat: stats.ao50 },
                { label: 'ao100', stat: stats.ao100 },
                { label: 'ao200', stat: stats.ao200 },
                { label: 'ao500', stat: stats.ao500 }
              ].map(({ label, stat }) => (
                <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{label}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', color: '#2563eb' }}>
                    {formatTime(stat.current)}
                  </td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', color: '#2563eb' }}>
                    {formatTime(stat.best)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {distribution.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>기록 분포 (Time Distribution)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {distribution.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ width: '70px', color: '#555' }}>{d.label}</span>
                    <div style={{ flex: 1, backgroundColor: '#f1f5f9', height: '14px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${d.percent}%`,
                          backgroundColor: '#3b82f6',
                          height: '100%',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                    <span style={{ width: '60px', textAlign: 'right', color: '#333' }}>
                      {d.count}회 ({d.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
