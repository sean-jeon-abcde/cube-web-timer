import React, { useMemo } from 'react';
import { getCubeStateFromScramble, CubeState } from '../utils/cubeSimulator';
import { X } from 'lucide-react';

interface CubeNetViewProps {
  scramble: string;
  onClose: () => void;
}

export const CubeNetView: React.FC<CubeNetViewProps> = ({ scramble, onClose }) => {
  const cubeState: CubeState = useMemo(() => {
    return getCubeStateFromScramble(scramble);
  }, [scramble]);

  const renderFace = (stickers: string[], label: string) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 14px)',
          gridTemplateRows: 'repeat(3, 14px)',
          gap: '2px',
          backgroundColor: '#222',
          padding: '2px',
          borderRadius: '4px'
        }}
        title={`Face ${label}`}
      >
        {stickers.map((color, idx) => (
          <div
            key={idx}
            style={{
              width: '14px',
              height: '14px',
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
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#fde7e7',
        border: '1px solid #f5cfcf',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333'
        }}
      >
        <span>Scramble Net (3x3x3)</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: '#666'
          }}
          aria-label="Close visualizer"
        >
          <X size={15} />
        </button>
      </div>

      {/* 2D Unfolded Cube Net */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, auto)',
          gridTemplateRows: 'repeat(3, auto)',
          gap: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '4px'
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
    </div>
  );
};
