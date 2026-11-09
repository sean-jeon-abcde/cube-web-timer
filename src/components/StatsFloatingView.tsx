import React, { useState, useEffect } from 'react';
import { Session, SessionStats, StatsPosition } from '../types';
import { formatTime } from '../utils/formatTime';
import { X, GripHorizontal, RotateCcw, LayoutGrid, Maximize2 } from 'lucide-react';
import { useDraggablePanel } from '../hooks/useDraggablePanel';

interface StatsFloatingViewProps {
  session: Session;
  stats: SessionStats;
  onClose: () => void;
  onStatClick: (statName: string, value: number | null, isBest: boolean) => void;
  onOpenStatsModal: () => void;
  positionSetting?: StatsPosition;
  onUpdatePositionSetting?: (pos: StatsPosition) => void;
  isSidebarActive?: boolean;
}

const STORAGE_COORDS_KEY = 'baseballtimer_stats_coords';

export const StatsFloatingView: React.FC<StatsFloatingViewProps> = ({
  session,
  stats,
  onClose,
  onStatClick,
  onOpenStatsModal,
  positionSetting = 'top-left',
  onUpdatePositionSetting,
  isSidebarActive = true
}) => {
  const [showPosMenu, setShowPosMenu] = useState<boolean>(false);

  const {
    panelRef,
    isDragging,
    customCoords,
    setCustomCoords,
    handlePointerDown,
    handleResetPosition: resetPositionBase,
  } = useDraggablePanel({
    storageKey: STORAGE_COORDS_KEY,
    legacyStorageKeys: ['incubetimer_stats_coords'],
    defaultWidth: 228,
    defaultHeight: 280,
  });

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

  // Close preset menu on outside click
  useEffect(() => {
    if (!showPosMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.stats-pos-menu-container')) {
        setShowPosMenu(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showPosMenu]);

  const handleResetPosition = () => {
    resetPositionBase();
    if (onUpdatePositionSetting) {
      onUpdatePositionSetting('top-left');
    }
    setShowPosMenu(false);
  };

  const handleApplyPreset = (preset: StatsPosition) => {
    if (onUpdatePositionSetting) {
      onUpdatePositionSetting(preset);
    }
    setShowPosMenu(false);
  };

  // Compute position styles
  const getPanelStyle = (): React.CSSProperties => {
    if (positionSetting === 'custom' && customCoords) {
      const maxX = Math.max(8, window.innerWidth - 240);
      const maxY = Math.max(8, window.innerHeight - 280);
      const x = Math.min(Math.max(8, customCoords.x), maxX);
      const y = Math.min(Math.max(8, customCoords.y), maxY);
      return {
        left: `${x}px`,
        top: `${y}px`
      };
    }

    const leftSidebarOffset = isSidebarActive ? '278px' : '16px';
    switch (positionSetting) {
      case 'bottom-left':
        return { bottom: '20px', left: leftSidebarOffset };
      case 'top-right':
        return { top: '116px', right: '20px' };
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'top-left':
      default:
        return { top: '116px', left: leftSidebarOffset };
    }
  };

  return (
    <div
      ref={panelRef}
      className={`draggable-panel${isDragging ? ' dragging' : ''}`}
      style={{
        ...getPanelStyle(),
        padding: '8px 14px',
        width: '228px',
        minWidth: '228px'
      }}
    >
      {/* Draggable Header */}
      <div
        className="draggable-panel-header"
        onPointerDown={(e) => handlePointerDown(e, () => {
          if (onUpdatePositionSetting) {
            onUpdatePositionSetting('custom');
          }
        })}
        onDoubleClick={handleResetPosition}
        title="마우스로 드래그하여 자유롭게 이동 (더블 클릭: 기본 위치로 복원)"
      >
        <div className="draggable-panel-header-left">
          <GripHorizontal size={14} style={{ color: '#777', flexShrink: 0 }} />
          <span>통계 ({session.name})</span>
        </div>

        <div className="draggable-panel-header-right no-drag">
          {/* Position Presets */}
          <div className="stats-pos-menu-container" style={{ position: 'relative' }}>
            <button
              className={`draggable-panel-icon-btn${showPosMenu ? ' active' : ''}`}
              onClick={() => setShowPosMenu(prev => !prev)}
              title="위치 프리셋 (모서리 빠른 이동)"
              aria-label="Position Presets"
            >
              <LayoutGrid size={13} />
            </button>

            {showPosMenu && (
              <div className="draggable-panel-pos-menu">
                <div className="draggable-panel-pos-menu-header">
                  위치 프리셋
                </div>
                {[
                  { id: 'top-left' as StatsPosition, label: '좌측 상단 (기본)' },
                  { id: 'bottom-left' as StatsPosition, label: '좌측 하단' },
                  { id: 'top-right' as StatsPosition, label: '우측 상단' },
                  { id: 'bottom-right' as StatsPosition, label: '우측 하단' }
                ].map(item => (
                  <button
                    key={item.id}
                    className={`draggable-panel-pos-menu-item${positionSetting === item.id ? ' active' : ''}`}
                    onClick={() => handleApplyPreset(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="draggable-panel-pos-menu-divider" />
                <button
                  className="draggable-panel-pos-menu-btn"
                  onClick={handleResetPosition}
                >
                  <RotateCcw size={11} />
                  위치 초기화
                </button>
              </div>
            )}
          </div>

          {/* Open full StatsModal */}
          <button
            className="draggable-panel-icon-btn"
            onClick={onOpenStatsModal}
            title="상세 통계 창 열기"
            aria-label="Open detailed statistics"
          >
            <Maximize2 size={13} />
          </button>

          {/* Close Panel */}
          <button
            className="draggable-panel-icon-btn"
            onClick={onClose}
            title="통계 패널 닫기"
            aria-label="Close statistics panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Summary Table matching the image */}
      <table className="stats-table" style={{ margin: 0, fontSize: '15.5px' }}>
        <thead>
          <tr>
            <th style={{ width: '38%' }}></th>
            <th style={{ width: '31%' }}>현재</th>
            <th style={{ width: '31%' }}>최고</th>
          </tr>
        </thead>
        <tbody>
          {statRows.map(({ label, key }) => {
            const stat = stats[key] as {
              current: number | null;
              best: number | null;
              currentIsDnf?: boolean;
              bestIsDnf?: boolean;
            };
            const currentStr = stat.currentIsDnf ? 'DNF' : formatTime(stat.current);
            const bestStr = stat.bestIsDnf ? 'DNF' : formatTime(stat.best);

            return (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <span
                    className="stat-link"
                    onClick={() => onStatClick(label, stat.current, false)}
                    title={`${label} 현재 기록 세부정보`}
                  >
                    {currentStr}
                  </span>
                </td>
                <td>
                  <span
                    className="stat-link"
                    onClick={() => onStatClick(label, stat.best, true)}
                    title={`${label} 최고 기록 세부정보`}
                  >
                    {bestStr}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Compact Total & Mean footer */}
      <div
        className="session-summary-box"
        style={{
          marginTop: '6px',
          marginBottom: 0,
          padding: '4px 6px',
          fontSize: '13px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="summary-line" style={{ fontSize: '12.5px' }}>
            완료: {stats.completedCount}/{stats.totalCount}
          </span>
          <span className="summary-line" style={{ fontSize: '12.5px' }}>
            평균: {formatTime(stats.mean)}
          </span>
        </div>
      </div>
    </div>
  );
};
