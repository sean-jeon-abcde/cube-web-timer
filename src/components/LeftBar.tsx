import React from 'react';
import {
  Settings,
  Upload,
  Grid3X3,
  ListOrdered,
  JapaneseYen,
  SlidersHorizontal
} from 'lucide-react';

interface LeftBarProps {
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onToggleVisualizer: () => void;
  isVisualizerActive: boolean;
  onToggleSidebar: () => void;
  isSidebarActive: boolean;
  onOpenStats: () => void;
  onOpenTools: () => void;
}

export const LeftBar: React.FC<LeftBarProps> = ({
  onOpenSettings,
  onOpenExport,
  onToggleVisualizer,
  isVisualizerActive,
  onToggleSidebar,
  isSidebarActive,
  onOpenStats,
  onOpenTools
}) => {
  return (
    <div className="leftbar">
      {/* Top 3 Buttons */}
      <div className="icon-row">
        <button
          className="cstimer-btn"
          onClick={onOpenSettings}
          title="Option / 설정"
          aria-label="Option / 설정"
        >
          <Settings size={22} strokeWidth={2} />
        </button>

        <button
          className="cstimer-btn"
          onClick={onOpenExport}
          title="Export / 내보내기"
          aria-label="Export / 내보내기"
        >
          <Upload size={22} strokeWidth={2} />
        </button>

        <button
          className={`cstimer-btn ${isVisualizerActive ? 'active-pink' : ''}`}
          onClick={onToggleVisualizer}
          title="Scramble drawing / 큐브 섞기 그림"
          aria-label="Scramble drawing / 큐브 섞기 그림"
        >
          <Grid3X3 size={22} strokeWidth={2} />
        </button>
      </div>

      {/* in Cube Timer Logo */}
      <button
        className="cstimer-logo-btn"
        onClick={() => {
          window.location.reload();
        }}
        title="in Cube Timer"
        aria-label="in Cube Timer logo"
      >
        <span className="cstimer-logo-text">in Cube Timer</span>
      </button>

      {/* Bottom 3 Buttons */}
      <div className="icon-row">
        <button
          className={`cstimer-btn ${isSidebarActive ? 'active-pink' : ''}`}
          onClick={onToggleSidebar}
          title="List times / 기록 목록"
          aria-label="List times / 기록 목록"
        >
          <ListOrdered size={22} strokeWidth={2} />
        </button>

        <button
          className="cstimer-btn"
          onClick={onOpenStats}
          title="Statistics / 통계 세부"
          aria-label="Statistics / 통계 세부"
        >
          <JapaneseYen size={22} strokeWidth={2.2} />
        </button>

        <button
          className="cstimer-btn"
          onClick={onOpenTools}
          title="Tools / 도구 (Cross Solver, Scramble Generator)"
          aria-label="Tools / 도구"
        >
          <SlidersHorizontal size={22} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
