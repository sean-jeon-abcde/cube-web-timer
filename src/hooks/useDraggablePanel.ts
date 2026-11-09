import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggablePanelOptions {
  storageKey: string;
  legacyStorageKeys?: string[];
  defaultWidth: number;
  defaultHeight: number;
}

export function useDraggablePanel({
  storageKey,
  legacyStorageKeys = [],
  defaultWidth,
  defaultHeight,
}: UseDraggablePanelOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customCoords, setCustomCoords] = useState<Position | null>(() => {
    try {
      let raw: string | null = null;
      // Try main key first
      raw = localStorage.getItem(storageKey);
      // Fall back to legacy keys
      if (!raw) {
        for (const legacyKey of legacyStorageKeys) {
          raw = localStorage.getItem(legacyKey);
          if (raw) break;
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Migrate from legacy key if needed
          for (const legacyKey of legacyStorageKeys) {
            localStorage.removeItem(legacyKey);
          }
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  // Keep coords within viewport if window is resized
  useEffect(() => {
    const handleResize = () => {
      setCustomCoords(prev => {
        if (!prev) return prev;
        const width = panelRef.current ? panelRef.current.offsetWidth : defaultWidth;
        const height = panelRef.current ? panelRef.current.offsetHeight : defaultHeight;
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
  }, [defaultWidth, defaultHeight]);

  // Handle dragging
  const handlePointerDown = useCallback((e: React.PointerEvent, onDragEnd?: () => void) => {
    if ((e.target as HTMLElement).closest('button, select, input, .stat-link, .no-drag')) {
      return;
    }
    if (!panelRef.current) return;

    e.preventDefault();
    setIsDragging(true);

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
        localStorage.setItem(storageKey, JSON.stringify(latestCoords));
      } catch { /* ignore */ }

      if (onDragEnd) {
        onDragEnd();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [storageKey]);

  // Reset position
  const handleResetPosition = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
    setCustomCoords(null);
  }, [storageKey]);

  return {
    panelRef,
    isDragging,
    customCoords,
    setCustomCoords,
    handlePointerDown,
    handleResetPosition,
  };
}
