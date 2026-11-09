import React, { useMemo, useState, useEffect } from 'react';
import { getCubeStateFromScramble, CubeState } from '../utils/cubeSimulator';
import { Cube3DView } from './Cube3DView';
import { X, GripHorizontal, RotateCcw, LayoutGrid } from 'lucide-react';
import { ScrambleNetPosition } from '../types';
import { useDraggablePanel } from '../hooks/useDraggablePanel';

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
    legacyStorageKeys: ['incubetimer_scramble_net_coords', 'intimer_scramble_net_coords'],
    defaultWidth: 210,
    defaultHeight: 180,
  });

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

  const cubeState: CubeState = useMemo(() => {
    return getCubeStateFromScramble(scramble);
  }, [scramble]);

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

  const handleResetPosition = () => {
    resetPositionBase();
    if (onUpdatePositionSetting) {
      onUpdatePositionSetting('bottom-right');
    }
    setShowPosMenu(false);
  };

  const handleApplyPreset = (preset: ScrambleNetPosition) => {
    if (onUpdatePositionSetting) {
      onUpdatePositionSetting(preset);
    }
    setShowPosMenu(false);
  };

  // Compute position styles
  const getPanelStyle = (): React.CSSProperties => {
    if (positionSetting === 'custom' && customCoords) {
      const maxX = Math.max(8, window.innerWidth - 220);
      const maxY = Math.max(8, window.innerHeight - 200);
      const x = Math.min(Math.max(8, customCoords.x), maxX);
      const y = Math.min(Math.max(8, customCoords.y), maxY);
      return {
        left: `${x}px`,
        top: `${y}px`
      };
    }

    const leftSidebarOffset = isSidebarActive ? '278px' : '20px';
    switch (positionSetting) {
      case 'bottom-left':
        return { bottom: '20px', left: leftSidebarOffset };
      case 'top-right':
        return { top: '116px', right: '20px' };
      case 'top-left':
        return { top: '116px', left: leftSidebarOffset };
      case 'bottom-right':
      default:
        return { bottom: '20px', right: '20px' };
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
    <div
      ref={panelRef}
      className={`draggable-panel${isDragging ? ' dragging' : ''}`}
      style={{
        ...getPanelStyle(),
        padding: '8px 12px',
        alignItems: 'center',
        gap: '4px',
        zIndex: 60
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
          <span>Scramble Net (3x3x3)</span>
        </div>

        <div className="draggable-panel-header-right no-drag">
          {/* Preset Position Dropdown */}
          <div className="net-menu-container" style={{ position: 'relative' }}>
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
                    className={`draggable-panel-pos-menu-item${positionSetting === item.id ? ' active' : ''}`}
                    onClick={() => handleApplyPreset(item.id as ScrambleNetPosition)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Position Button */}
          <button
            className="draggable-panel-icon-btn"
            onClick={handleResetPosition}
            title="기본 위치로 복원"
            aria-label="Reset position"
          >
            <RotateCcw size={13} />
          </button>

          {/* Close visualizer button */}
          <button
            className="draggable-panel-icon-btn"
            onClick={onClose}
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
