import React from 'react';
import { Settings } from 'lucide-react';
import { SCRAMBLE_EVENTS } from '../utils/scramble';

interface HeaderBarProps {
  currentScramble: string;
  category: string;
  eventId: string;
  onEventChange: (eventId: string) => void;
  onPrevScramble: () => void;
  onNextScramble: () => void;
  onOpenSettings: () => void;
  hasPrevScramble: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentScramble,
  category,
  eventId,
  onEventChange,
  onPrevScramble,
  onNextScramble,
  onOpenSettings,
  hasPrevScramble
}) => {
  return (
    <div className="scramble-bar-container">
      <div className="scramble-top-nav">
        <select
          className="scramble-select"
          value={category}
          onChange={() => {}}
          aria-label="Scramble category"
        >
          <option value="WCA">WCA</option>
        </select>

        <select
          className="scramble-select"
          value={eventId}
          onChange={(e) => onEventChange(e.target.value)}
          aria-label="Puzzle event"
        >
          {SCRAMBLE_EVENTS.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>

        <button
          className="scramble-gear-btn"
          onClick={onOpenSettings}
          title="Scramble options"
          aria-label="Scramble options"
        >
          <Settings size={15} />
        </button>

        <div className="scramble-nav-links">
          <span
            className={`scramble-nav-link ${hasPrevScramble ? 'blue' : ''}`}
            onClick={hasPrevScramble ? onPrevScramble : undefined}
            style={{ cursor: hasPrevScramble ? 'pointer' : 'default', opacity: hasPrevScramble ? 1 : 0.6 }}
          >
            이전
          </span>
          <span>/</span>
          <span
            className="scramble-nav-link blue"
            onClick={onNextScramble}
          >
            다음
          </span>
          <span> 섞기</span>
        </div>
      </div>

      <div className="scramble-text-display">
        {currentScramble}
      </div>
    </div>
  );
};
