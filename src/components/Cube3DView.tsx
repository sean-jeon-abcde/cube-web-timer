import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CubeState, FaceName } from '../utils/cubeSimulator';
import { RotateCcw } from 'lucide-react';

interface Cube3DViewProps {
  cubeState: CubeState;
  size?: number; // Cube face size in px, default 56
}

const DEFAULT_ROT_X = -24;
const DEFAULT_ROT_Y = -36;

export const Cube3DView: React.FC<Cube3DViewProps> = ({
  cubeState,
  size = 56
}) => {
  const [rotX, setRotX] = useState<number>(DEFAULT_ROT_X);
  const [rotY, setRotY] = useState<number>(DEFAULT_ROT_Y);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number } | null>(null);

  // Handle pointer down for rotating 3D cube
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore button clicks
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY
    };
  };

  useEffect(() => {
    if (!isRotating) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Sensitivity factor
      const sensitivity = 0.85;

      const newRotY = (dragStartRef.current.startRotY + dx * sensitivity) % 360;
      // Clamp vertical rotation between -85 and +85 to avoid gimbal inversion
      const newRotX = Math.max(
        -85,
        Math.min(85, dragStartRef.current.startRotX - dy * sensitivity)
      );

      setRotX(newRotX);
      setRotY(newRotY);
    };

    const handlePointerUp = () => {
      setIsRotating(false);
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isRotating, rotX, rotY]);

  const handleResetAngle = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRotX(DEFAULT_ROT_X);
    setRotY(DEFAULT_ROT_Y);
  }, []);

  const half = size / 2;
  const stickerSize = Math.floor((size - 4 - 4) / 3); // 2px gap, 2px padding each side
  const faceGap = 2;
  const facePadding = 2;

  // Render individual 3x3 face
  const renderFace = (faceName: FaceName, transform: string, lightOverlay?: string) => {
    const stickers = cubeState[faceName];

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#18181b',
          borderRadius: '4px',
          padding: `${facePadding}px`,
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${stickerSize}px)`,
          gridTemplateRows: `repeat(3, ${stickerSize}px)`,
          gap: `${faceGap}px`,
          boxSizing: 'border-box',
          transform,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          boxShadow: '0 0 1px rgba(0,0,0,0.5)'
        }}
      >
        {stickers.map((color, idx) => (
          <div
            key={idx}
            style={{
              width: `${stickerSize}px`,
              height: `${stickerSize}px`,
              backgroundColor: color,
              borderRadius: '2.5px',
              border: '0.5px solid rgba(0,0,0,0.22)',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.22), inset 0 -1px 1px rgba(0,0,0,0.14)'
            }}
          />
        ))}

        {/* Ambient lighting overlay */}
        {lightOverlay && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: lightOverlay,
              borderRadius: '4px',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="no-drag"
      onPointerDown={handlePointerDown}
      onDoubleClick={() => handleResetAngle()}
      title="드래그하여 3D 큐브 회전 (더블클릭: 기본 각도로 복원)"
      style={{
        position: 'relative',
        width: '100%',
        height: '82px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isRotating ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* 3D Perspective Stage */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          perspective: '380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Soft shadow underneath the cube */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${size * 0.95}px`,
            height: '11px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        {/* The 3D Rubik's Cube Object */}
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: isRotating ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Front (F) */}
          {renderFace('F', `translateZ(${half}px)`, 'rgba(255,255,255,0.02)')}

          {/* Back (B) */}
          {renderFace('B', `rotateY(180deg) translateZ(${half}px)`, 'rgba(0,0,0,0.18)')}

          {/* Right (R) */}
          {renderFace('R', `rotateY(90deg) translateZ(${half}px)`, 'rgba(0,0,0,0.08)')}

          {/* Left (L) */}
          {renderFace('L', `rotateY(-90deg) translateZ(${half}px)`, 'rgba(0,0,0,0.14)')}

          {/* Top (U) */}
          {renderFace('U', `rotateX(90deg) translateZ(${half}px)`, 'rgba(255,255,255,0.09)')}

          {/* Bottom (D) */}
          {renderFace('D', `rotateX(-90deg) translateZ(${half}px)`, 'rgba(0,0,0,0.22)')}
        </div>
      </div>

      {/* Quick angle reset button */}
      <button
        onClick={handleResetAngle}
        title="기본 시점(UFR)으로 각도 복원 (더블클릭으로도 가능)"
        aria-label="기본 각도로 복원"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)')}
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '4px',
          padding: '2px 5px',
          fontSize: '10px',
          color: '#555',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.15s ease'
        }}
      >
        <RotateCcw size={10} />
        <span>3D</span>
      </button>
    </div>
  );
};
