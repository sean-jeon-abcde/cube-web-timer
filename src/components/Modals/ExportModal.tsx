import React, { useRef } from 'react';
import { Session } from '../../types';
import { X, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';

interface ExportModalProps {
  sessions: Session[];
  onImportSessions: (sessions: Session[]) => void;
  onResetAll: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  sessions,
  onImportSessions,
  onResetAll,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `intimer_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    let csv = 'Session,Index,Time (ms),Time (formatted),Penalty,Scramble,Date\n';
    sessions.forEach(sess => {
      sess.solves.forEach(solve => {
        csv += `"${sess.name}",${solve.index},${solve.time},"${formatTime(solve.time, solve.penalty)}","${solve.penalty}","${solve.scramble}","${new Date(solve.date).toISOString()}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `intimer_solves_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportSessions(parsed);
          alert('데이터를 성공적으로 불러왔습니다!');
          onClose();
        } else {
          alert('올바른 백업 파일 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 파싱하는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">가져오기 / 내보내기 (Export / Import)</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close export modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#444' }}>
            in Timer 기록을 안전하게 파일로 백업하거나, 이전 백업 파일을 복구할 수 있습니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={exportToJson}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <Download size={18} />
              <span>JSON 파일로 내보내기 (전체 백업)</span>
            </button>

            <button
              className="btn-secondary"
              onClick={exportToCsv}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <FileSpreadsheet size={18} />
              <span>CSV 파일로 내보내기 (엑셀용)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              style={{ display: 'none' }}
            />

            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <Download size={18} style={{ transform: 'rotate(180deg)' }} />
              <span>백업 파일에서 불러오기 (Import)</span>
            </button>

            <hr style={{ borderColor: '#eee', margin: '8px 0' }} />

            <button
              className="btn-danger"
              onClick={() => {
                if (window.confirm('정말 모든 모둠과 솔브 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  onResetAll();
                  onClose();
                }
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <RotateCcw size={18} />
              <span>모든 데이터 초기화</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
