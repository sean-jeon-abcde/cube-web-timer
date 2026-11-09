import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, SessionStats, StatsPosition } from '../types';
import { formatTime } from '../utils/formatTime';
import { X, GripHorizontal, RotateCcw, LayoutGrid, Maximize2 } from 'lucide-react';

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

const STORAGE_COORDS_KEY = 'incubetimer_stats_coords';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showPosMenu, setShowPosMenu] = useState<boolean>(false);

  // Custom coordinates for freely dragged position
  const [customCoords, setCustomCoords] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COORDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
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

  // Keep coords within viewport if window is resized
  useEffect(() => {
    const handleResize = () => {
      setCustomCoords(prev => {
        if (!prev) return prev;
        const width = panelRef.current ? panelRef.current.offsetWidth : 228;
        const height = panelRef.current ? panelRef.current.offsetHeight : 280;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(8, prev.y), maxY)
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Handle Dragging
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input, .stat-link, .no-drag')) {
      return;
    }
    if (!panelRef.current) return;

    e.preventDefault();
    setIsDragging(true);
    setShowPosMenu(false);

    const rect = panelRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    let latestCoords = { x: rect.left, y: rect.top };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!panelRef.current) return;
      const width = panelRef.current.offsetWidth;
      const height = panelRef.current.offsetHeight;

      const rawX = moveEvt.clientX - offsetX;
      const rawY = moveEvt.clientY - offsetY;

      const maxX = Math.max(8, window.innerWidth - width - 8);
      const maxY = Math.max(8, window.innerHeight - height - 8);

      const clampedX = Math.min(Math.max(8, rawX), maxX);
      const clampedY = Math.min(Math.max(8, rawY), maxY);

      latestCoords = { x: clampedX, y: clampedY };
      setCustomCoords(latestCoords);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      try {
        localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(latestCoords));
      } catch {}
      if (onUpdatePositionSetting) {
        onUpdatePositionSetting('custom');
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [onUpdatePositionSetting]);

  // Reset position
  const handleResetPosition = () => {
    try {
      localStorage.removeItem(STORAGE_COORDS_KEY);
    } catch {}
    setCustomCoords(null);
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
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: '#fde7e7',
      border: '1px solid #f5cfcf',
      borderRadius: '8px',
      padding: '8px 14px',
      boxShadow: isDragging
        ? '0 10px 30px rgba(0,0,0,0.28)'
        : '0 4px 15px rgba(0,0,0,0.15)',
      zIndex: 55,
      display: 'flex',
      flexDirection: 'column',
      userSelect: isDragging ? 'none' : 'auto',
      transition: isDragging ? 'none' : 'box-shadow 0.2s ease, opacity 0.2s ease',
      opacity: isDragging ? 0.93 : 1,
      width: '228px',
      minWidth: '228px'
    };

    if (positionSetting === 'custom' && customCoords) {
      const maxX = Math.max(8, window.innerWidth - 240);
      const maxY = Math.max(8, window.innerHeight - 280);
      const x = Math.min(Math.max(8, customCoords.x), maxX);
      const y = Math.min(Math.max(8, customCoords.y), maxY);
      return {
        ...baseStyle,
        left: `${x}px`,
        top: `${y}px`
      };
    }

    const leftSidebarOffset = isSidebarActive ? '278px' : '16px';
    switch (positionSetting) {
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: leftSidebarOffset };
      case 'top-right':
        return { ...baseStyle, top: '116px', right: '20px' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '20px', right: '20px' };
      case 'top-left':
      default:
        return { ...baseStyle, top: '116px', left: leftSidebarOffset };
    }
  };

  return (
    <div ref={panelRef} style={getPanelStyle()}>
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleResetPosition}
        title="마우스로 드래그하여 자유롭게 이동 (더블 클릭: 기본 위치로 복원)"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12.5px',
          fontWeight: 'bold',
          color: '#333',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          paddingBottom: '5px',
          marginBottom: '4px',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <GripHorizontal size={14} style={{ color: '#777', flexShrink: 0 }} />
          <span>통계 ({session.name})</span>
        </div>

        <div
          className="no-drag"
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          {/* Position Presets */}
          <div className="stats-pos-menu-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPosMenu(prev => !prev)}
              style={{
                background: showPosMenu ? 'rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '3px',
                color: '#555',
                display: 'flex',
                alignItems: 'center'
              }}
              title="위치 프리셋 (모서리 빠른 이동)"
              aria-label="Position Presets"
            >
              <LayoutGrid size={13} />
            </button>

            {showPosMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dcdcdc',
                  borderRadius: '6px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                  zIndex: 120,
                  minWidth: '135px',
                  padding: '4px 0',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  color: '#222'
                }}
              >
                <div
                  style={{
                    padding: '4px 10px',
                    fontSize: '10.5px',
                    color: '#888',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: 'bold'
                  }}
                >
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
                    onClick={() => handleApplyPreset(item.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 10px',
                      background: positionSetting === item.id ? '#f0f4ff' : 'none',
                      color: positionSetting === item.id ? '#0000ee' : '#333',
                      fontWeight: positionSetting === item.id ? 'bold' : 'normal',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11.5px'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #f0f0f0', margin: '3px 0' }} />
                <button
                  onClick={handleResetPosition}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    background: 'none',
                    color: '#666',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px'
                  }}
                >
                  <RotateCcw size={11} />
                  위치 초기화
                </button>
              </div>
            )}
          </div>

          {/* Open full StatsModal */}
          <button
            onClick={onOpenStatsModal}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '3px',
              color: '#555',
              display: 'flex',
              alignItems: 'center'
            }}
            title="상세 통계 창 열기"
            aria-label="Open detailed statistics"
          >
            <Maximize2 size={13} />
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '3px',
              color: '#555',
              display: 'flex',
              alignItems: 'center'
            }}
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
