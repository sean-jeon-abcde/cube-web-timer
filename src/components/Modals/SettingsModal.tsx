import React from 'react';
import { TimerSettings } from '../../types';
import { X } from 'lucide-react';

interface SettingsModalProps {
  settings: TimerSettings;
  onUpdateSettings: (newSettings: TimerSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const handleChange = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">옵션 (Options)</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close options">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Inspection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>WCA 15초 미리보기 (WCA inspection)</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                스페이스바를 놓으면 15초 카운트다운을 시작합니다.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.inspection}
              onChange={(e) => handleChange('inspection', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Voice Alert */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>미리보기 음성 안내 (Voice alert)</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                8초 및 12초 경과 시 알림음과 음성 경고를 출력합니다.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceAlert}
              onChange={(e) => handleChange('voiceAlert', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Hold time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>스페이스바 누르고 대기하는 시간</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                타이머가 녹색으로 바뀔 때까지 눌러야 하는 시간
              </div>
            </div>
            <select
              value={settings.holdTimeMs}
              onChange={(e) => handleChange('holdTimeMs', Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value={100}>0.1초</option>
              <option value={300}>0.3초 (기본값)</option>
              <option value={550}>0.55초 (WCA 규정)</option>
            </select>
          </div>

          {/* Milliseconds */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>밀리초 표시 (use milliseconds)</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                소수점 3자리(.mmm) 또는 2자리(.cc) 표시
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showMilli}
              onChange={(e) => handleChange('showMilli', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Diff label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>기록 차이 표시 (Show Difference Label)</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                이전 기록과의 차이를 빨간색(+) / 초록색(-)으로 표시
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showDiff}
              onChange={(e) => handleChange('showDiff', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Avg label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>타이머 하단 평균 표시 (Show Avg Label)</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                타이머 하단에 ao5 및 ao12 파란색 텍스트 표시
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showAvgLabel}
              onChange={(e) => handleChange('showAvgLabel', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Hide when timing */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>타이밍 중 모든 요소 숨기기</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                측정 중 상단바와 사이드바를 숨겨 집중도 향상
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hideWhenTiming}
              onChange={(e) => handleChange('hideWhenTiming', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Language */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>언어 (Language)</strong>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value as 'ko' | 'en')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="ko">한국어 (Korean)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            확인 (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
