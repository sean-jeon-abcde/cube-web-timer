import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getCubeStateFromScramble, CubeState } from '../utils/cubeSimulator';
import { Cube3DView } from './Cube3DView';
import { X, GripHorizontal, RotateCcw, LayoutGrid } from 'lucide-react';
import { ScrambleNetPosition } from '../types';

interface CubeNetViewProps {
  scramble: string;
  onClose: () => void;
  positionSetting?: ScrambleNetPosition;
  onUpdatePositionSetting?: (pos: ScrambleNetPosition) => void;
  isSidebarActive?: boolean;
}

const STORAGE_COORDS_KEY = 'baseballtimer_scramble_net_coords';
const STORAGE_VIEW_MODE_KEY = 'baseballtimer_cube_view_mode';

export type VisualizerMode = 'both' | '3d' | 'net';

export const CubeNetView: React.FC<CubeNetViewProps> = ({
  scramble,
  onClose,
  positionSetting = 'bottom-right',
  onUpdatePositionSetting,
  isSidebarActive = true
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showPosMenu, setShowPosMenu] = useState<boolean>(false);

  // View mode: 'both' (3D + 2D Net), '3d' (Only 3D), 'net' (Only 2D Net)
  const [viewMode, setViewMode] = useState<VisualizerMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEW_MODE_KEY);
      if (saved === 'both' || saved === '3d' || saved === 'net') {
        return saved;
      }
    } catch {}
    return 'both';
  });

  const handleSetViewMode = (mode: VisualizerMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_VIEW_MODE_KEY, mode);
    } catch {}
  };

  // Custom coordinates for freely dragged position
  const [customCoords, setCustomCoords] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COORDS_KEY) || localStorage.getItem('incubetimer_scramble_net_coords') || localStorage.getItem('intimer_scramble_net_coords');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const cubeState: CubeState = useMemo(() => {
    return getCubeStateFromScramble(scramble);
  }, [scramble]);

  // Keep coords within viewport if window is resized
  useEffect(() => {
    const handleResize = () => {
      setCustomCoords(prev => {
        if (!prev) return prev;
        const width = panelRef.current ? panelRef.current.offsetWidth : 210;
        const height = panelRef.current ? panelRef.current.offsetHeight : 180;
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
      if (!(e.target as HTMLElement).closest('.net-menu-container')) {
        setShowPosMenu(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showPosMenu]);

  // Handle Dragging
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore clicks on buttons or inside menus
    if ((e.target as HTMLElement).closest('button, select, input, .no-drag')) {
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

      // Save coords and switch setting to custom
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

  // Reset to default bottom-right
  const handleResetPosition = () => {
    try {
      localStorage.removeItem(STORAGE_COORDS_KEY);
    } catch {}
    setCustomCoords(null);
    if (onUpdatePositionSetting) {
      onUpdatePositionSetting('bottom-right');
    }
    setShowPosMenu(false);
  };

  // Apply corner preset
  const handleApplyPreset = (preset: ScrambleNetPosition) => {
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
      padding: '8px 12px',
      boxShadow: isDragging
        ? '0 10px 30px rgba(0,0,0,0.28)'
        : '0 4px 15px rgba(0,0,0,0.15)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      userSelect: isDragging ? 'none' : 'auto',
      transition: isDragging ? 'none' : 'box-shadow 0.2s ease, opacity 0.2s ease',
      opacity: isDragging ? 0.93 : 1
    };

    if (positionSetting === 'custom' && customCoords) {
      const maxX = Math.max(8, window.innerWidth - 220);
      const maxY = Math.max(8, window.innerHeight - 200);
      const x = Math.min(Math.max(8, customCoords.x), maxX);
      const y = Math.min(Math.max(8, customCoords.y), maxY);
      return {
        ...baseStyle,
        left: `${x}px`,
        top: `${y}px`
      };
    }

    const leftSidebarOffset = isSidebarActive ? '278px' : '20px';
    switch (positionSetting) {
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: leftSidebarOffset };
      case 'top-right':
        return { ...baseStyle, top: '116px', right: '20px' };
      case 'top-left':
        return { ...baseStyle, top: '116px', left: leftSidebarOffset };
      case 'bottom-right':
      default:
        return { ...baseStyle, bottom: '20px', right: '20px' };
    }
  };

  const renderFace = (stickers: string[], label: string) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 12.5px)',
          gridTemplateRows: 'repeat(3, 12.5px)',
          gap: '1.5px',
          backgroundColor: '#222',
          padding: '2px',
          borderRadius: '3px'
        }}
        title={`Face ${label}`}
      >
        {stickers.map((color, idx) => (
          <div
            key={idx}
            style={{
              width: '12.5px',
              height: '12.5px',
              backgroundColor: color,
              borderRadius: '2px',
              border: '0.5px solid rgba(0,0,0,0.2)'
            }}
          />
        ))}
      </div>
    );
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
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          paddingBottom: '4px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <GripHorizontal size={14} style={{ color: '#777', flexShrink: 0 }} />
          <span>Scramble Net (3x3x3)</span>
        </div>

        <div
          className="no-drag"
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          {/* Preset Position Dropdown */}
          <div className="net-menu-container" style={{ position: 'relative' }}>
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
                  자리 / 위치 프리셋
                </div>
                {[
                  { id: 'bottom-right', label: '↘ 우측 하단 (기본)' },
                  { id: 'bottom-left', label: '↙ 좌측 하단' },
                  { id: 'top-right', label: '↗ 우측 상단' },
                  { id: 'top-left', label: '↖ 좌측 상단' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleApplyPreset(item.id as ScrambleNetPosition)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      background: positionSetting === item.id ? '#eff6ff' : 'none',
                      color: positionSetting === item.id ? '#2563eb' : '#333',
                      fontWeight: positionSetting === item.id ? 'bold' : 'normal',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'block',
                      fontSize: '11.5px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        positionSetting === item.id ? '#eff6ff' : 'none')
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Position Button */}
          <button
            onClick={handleResetPosition}
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
            title="기본 위치로 복원"
            aria-label="Reset position"
          >
            <RotateCcw size={13} />
          </button>

          {/* Close visualizer button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '3px',
              color: '#666',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Close visualizer"
            title="닫기"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* View Mode Tab Switcher */}
      <div
        className="no-drag"
        style={{
          display: 'flex',
          backgroundColor: 'rgba(0,0,0,0.06)',
          borderRadius: '5px',
          padding: '2px',
          width: '100%',
          justifyContent: 'space-between',
          gap: '2px',
          boxSizing: 'border-box'
        }}
      >
        <button
          onClick={() => handleSetViewMode('both')}
          style={{
            flex: 1,
            padding: '2.5px 0',
            fontSize: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: viewMode === 'both' ? '#ffffff' : 'transparent',
            color: viewMode === 'both' ? '#111' : '#666',
            fontWeight: viewMode === 'both' ? '600' : 'normal',
            boxShadow: viewMode === 'both' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}
          title="3D 입체 큐브와 전개도를 함께 표시"
        >
          3D + 전개도
        </button>
        <button
          onClick={() => handleSetViewMode('3d')}
          style={{
            flex: 1,
            padding: '2.5px 0',
            fontSize: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: viewMode === '3d' ? '#ffffff' : 'transparent',
            color: viewMode === '3d' ? '#111' : '#666',
            fontWeight: viewMode === '3d' ? '600' : 'normal',
            boxShadow: viewMode === '3d' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}
          title="3D 입체 큐브만 표시"
        >
          3D 입체
        </button>
        <button
          onClick={() => handleSetViewMode('net')}
          style={{
            flex: 1,
            padding: '2.5px 0',
            fontSize: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: viewMode === 'net' ? '#ffffff' : 'transparent',
            color: viewMode === 'net' ? '#111' : '#666',
            fontWeight: viewMode === 'net' ? '600' : 'normal',
            boxShadow: viewMode === 'net' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}
          title="2D 전개도만 표시"
        >
          전개도
        </button>
      </div>

      {/* 3D Scramble Cube (Above the 2D Net) */}
      {(viewMode === 'both' || viewMode === '3d') && (
        <Cube3DView cubeState={cubeState} size={56} />
      )}

      {/* Divider when both are displayed */}
      {viewMode === 'both' && (
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(0,0,0,0.07)',
            margin: '1px 0'
          }}
        />
      )}

      {/* 2D Unfolded Cube Net */}
      {(viewMode === 'both' || viewMode === 'net') && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, auto)',
            gridTemplateRows: 'repeat(3, auto)',
            gap: '3px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '2px'
          }}
        >
          {/* Row 0: Top face U */}
          <div style={{ gridColumn: 2, gridRow: 1 }}>
            {renderFace(cubeState.U, 'U')}
          </div>

          {/* Row 1: Left L, Front F, Right R, Back B */}
          <div style={{ gridColumn: 1, gridRow: 2 }}>
            {renderFace(cubeState.L, 'L')}
          </div>
          <div style={{ gridColumn: 2, gridRow: 2 }}>
            {renderFace(cubeState.F, 'F')}
          </div>
          <div style={{ gridColumn: 3, gridRow: 2 }}>
            {renderFace(cubeState.R, 'R')}
          </div>
          <div style={{ gridColumn: 4, gridRow: 2 }}>
            {renderFace(cubeState.B, 'B')}
          </div>

          {/* Row 2: Bottom face D */}
          <div style={{ gridColumn: 2, gridRow: 3 }}>
            {renderFace(cubeState.D, 'D')}
          </div>
        </div>
      )}
    </div>
  );
};
