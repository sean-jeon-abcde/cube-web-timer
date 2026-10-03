import React, { useState } from 'react';
import { Session } from '../../types';
import { X, Plus, Edit2, Trash2, RotateCcw } from 'lucide-react';

interface SessionManagerModalProps {
  sessions: Session[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: (name: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
  onClearSessionSolves?: (id: string) => void;
  onClearAllSessions?: () => void;
  onClose: () => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onClearSessionSolves,
  onClearAllSessions,
  onClose
}) => {
  const [newSessionName, setNewSessionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    const name = newSessionName.trim() || `${sessions.length + 1}`;
    onCreateSession(name);
    setNewSessionName('');
  };

  const handleStartRename = (sess: Session) => {
    setEditingId(sess.id);
    setEditingName(sess.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSession(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">모둠 관리자 (Session Manager)</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close session manager modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Create new session */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="새 모둠 이름 (예: 2, 3x3 OH 등)"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              className="btn-primary"
              onClick={handleCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={16} />
              <span>새 모둠 추가</span>
            </button>
          </div>

          {/* Session list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
            {sessions.map((sess) => {
              const isCurrent = sess.id === currentSessionId;
              const isEditing = sess.id === editingId;

              return (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? '#eff6ff' : '#f8fafc',
                    border: isCurrent ? '1.5px solid #3b82f6' : '1px solid #e2e8f0'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        style={{ flex: 1, padding: '4px 6px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                      />
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleSaveRename(sess.id)}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        onSelectSession(sess.id);
                        onClose();
                      }}
                      style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <strong style={{ color: isCurrent ? '#1d4ed8' : '#111' }}>
                        모둠 {sess.name}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        ({sess.solves.length}개 솔브)
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: '11px', color: '#2563eb', backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '10px' }}>
                          현재 선택됨
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleStartRename(sess)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
                      title="이름 변경"
                    >
                      <Edit2 size={15} />
                    </button>
                    {onClearSessionSolves && sess.solves.length > 0 && (
                      <button
                        onClick={() => onClearSessionSolves(sess.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#eab308' }}
                        title="이 모둠의 솔브 기록 초기화"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                    {sessions.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`모둠 '${sess.name}'을(를) 삭제하시겠습니까?`)) {
                            onDeleteSession(sess.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' }}
                        title="모둠 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onClearAllSessions ? (
            <button
              className="btn-danger"
              onClick={onClearAllSessions}
              style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>모든 기록 삭제</span>
            </button>
          ) : <div />}
          <button className="btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
