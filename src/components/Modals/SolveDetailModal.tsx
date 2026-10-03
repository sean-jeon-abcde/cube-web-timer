import React, { useState } from 'react';
import { Solve, Penalty } from '../../types';
import { X, Trash2 } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';

interface SolveDetailModalProps {
  solve: Solve;
  onUpdateSolve: (updated: Solve) => void;
  onDeleteSolve: (id: string) => void;
  onClose: () => void;
}

export const SolveDetailModal: React.FC<SolveDetailModalProps> = ({
  solve,
  onUpdateSolve,
  onDeleteSolve,
  onClose
}) => {
  const [comment, setComment] = useState(solve.comment ?? '');

  const handlePenaltyChange = (penalty: Penalty) => {
    onUpdateSolve({
      ...solve,
      penalty,
      comment
    });
  };

  const handleCommentBlur = () => {
    if (comment !== solve.comment) {
      onUpdateSolve({
        ...solve,
        comment
      });
    }
  };

  const formattedDate = new Date(solve.date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">기록 세부정보 (#{solve.index})</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close solve detail modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Time Display */}
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#111' }}>
              {formatTime(solve.time, solve.penalty)}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              측정일시: {formattedDate}
            </div>
          </div>

          {/* Penalty Select Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {(['NONE', '+2', 'DNF'] as Penalty[]).map((p) => {
              const label = p === 'NONE' ? 'OK' : p;
              const isSelected = solve.penalty === p;
              return (
                <button
                  key={p}
                  onClick={() => handlePenaltyChange(p)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #ccc',
                    backgroundColor: isSelected ? '#eff6ff' : '#fff',
                    color: isSelected ? '#1d4ed8' : '#333',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Scramble Display */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>섞기 공식 (Scramble):</div>
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}
            >
              {solve.scramble}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>코멘트 (Comment):</div>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={handleCommentBlur}
              placeholder="예: OLL 스킵, 실수 등"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn-danger"
            onClick={() => {
              if (window.confirm(`솔브 #${solve.index} 기록을 삭제하시겠습니까?`)) {
                onDeleteSolve(solve.id);
                onClose();
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={16} />
            <span>기록 삭제</span>
          </button>

          <button className="btn-primary" onClick={onClose}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
