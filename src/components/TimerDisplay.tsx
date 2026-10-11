import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerSettings } from '../types';
import { formatTime, formatDiff } from '../utils/formatTime';
import { sounds } from '../utils/sound';

export type TimerState = 'IDLE' | 'HOLDING' | 'READY' | 'INSPECTING' | 'RUNNING';

interface TimerDisplayProps {
  lastSolveTime: number | null;
  lastSolvePenalty?: 'NONE' | '+2' | 'DNF';
  diffMs: number | null;
  currentAo5: number | null;
  currentAo12: number | null;
  currentAo25: number | null;
  settings: TimerSettings;
  onSolveComplete: (timeMs: number, penalty: 'NONE' | '+2' | 'DNF') => void;
  hideAllElements: boolean;
  setHideAllElements: (hide: boolean) => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  lastSolveTime,
  lastSolvePenalty = 'NONE',
  diffMs,
  currentAo5,
  currentAo12,
  currentAo25,
  settings,
  onSolveComplete,
  setHideAllElements
}) => {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [displayTime, setDisplayTime] = useState<number>(lastSolveTime ?? 0);
  const [inspectionCountdown, setInspectionCountdown] = useState<number>(15);

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const inspectionSecondsRef = useRef<number>(15);
  const spacePressedRef = useRef<boolean>(false);
  const stateRef = useRef<TimerState>('IDLE');

  stateRef.current = timerState;

  // Sync displayTime when lastSolveTime changes (e.g. on initial load or undo)
  useEffect(() => {
    if (stateRef.current === 'IDLE') {
      setDisplayTime(lastSolveTime ?? 0);
    }
  }, [lastSolveTime]);

  const stopTimer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setTimerState('IDLE');
    setHideAllElements(false);
    setDisplayTime(elapsed);
    onSolveComplete(elapsed, 'NONE');
  }, [onSolveComplete, setHideAllElements]);

  // Inspection tick
  const startInspection = useCallback(() => {
    setTimerState('INSPECTING');
    inspectionStartRef.current = Date.now();
    inspectionSecondsRef.current = 15;
    setInspectionCountdown(15);

    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);

    inspectionIntervalRef.current = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - inspectionStartRef.current) / 1000);
      const remaining = 15 - elapsedSec;
      setInspectionCountdown(remaining);
      inspectionSecondsRef.current = remaining;

      if (elapsedSec === 8 && settings.voiceAlert) {
        sounds.playInspectionAlert(8);
      } else if (elapsedSec === 12 && settings.voiceAlert) {
        sounds.playInspectionAlert(12);
      }

      if (remaining <= -2) {
        // Exceeded 17s: DNF
        clearInterval(inspectionIntervalRef.current!);
        setTimerState('IDLE');
        onSolveComplete(0, 'DNF');
      }
    }, 200);
  }, [settings.voiceAlert, onSolveComplete]);

  const clearInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Animation loop for running timer
  const runTimerLoop = useCallback(() => {
    const now = performance.now();
    setDisplayTime(Math.round(now - startTimeRef.current));
    animFrameRef.current = requestAnimationFrame(runTimerLoop);
  }, []);

  const startSolve = useCallback((penalty: 'NONE' | '+2' | 'DNF' = 'NONE') => {
    clearInspection();
    if (settings.hideWhenTiming) {
      setHideAllElements(true);
    }
    startTimeRef.current = performance.now();
    setTimerState('RUNNING');
    animFrameRef.current = requestAnimationFrame(runTimerLoop);
  }, [clearInspection, runTimerLoop, settings.hideWhenTiming, setHideAllElements]);

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or modal is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (spacePressedRef.current) return;
        spacePressedRef.current = true;

        if (stateRef.current === 'RUNNING') {
          stopTimer();
          return;
        }

        if (stateRef.current === 'IDLE') {
          if (settings.inspection) {
            // Start inspection
            startInspection();
          } else {
            // Normal hold
            setTimerState('HOLDING');
            holdTimeoutRef.current = setTimeout(() => {
              setTimerState('READY');
              sounds.playReadyBeep();
            }, settings.holdTimeMs);
          }
        } else if (stateRef.current === 'INSPECTING') {
          // In inspection, hold space to get ready to solve
          setTimerState('HOLDING');
          holdTimeoutRef.current = setTimeout(() => {
            setTimerState('READY');
            sounds.playReadyBeep();
          }, settings.holdTimeMs);
        }
      } else {
        // Any key stops the timer if running
        if (stateRef.current === 'RUNNING') {
          e.preventDefault();
          stopTimer();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        spacePressedRef.current = false;

        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = null;
        }

        if (stateRef.current === 'READY') {
          let penalty: 'NONE' | '+2' | 'DNF' = 'NONE';
          if (settings.inspection) {
            const rem = inspectionSecondsRef.current;
            if (rem <= 0 && rem > -2) {
              penalty = '+2';
            }
          }
          startSolve(penalty);
        } else if (stateRef.current === 'HOLDING') {
          // Released too early
          if (settings.inspection && inspectionIntervalRef.current) {
            setTimerState('INSPECTING');
          } else {
            setTimerState('IDLE');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [settings, startInspection, startSolve, stopTimer]);

  // Pointer / Touch support for clicking directly on timer area
  const handlePointerDown = () => {
    if (stateRef.current === 'RUNNING') {
      stopTimer();
      return;
    }
    if (stateRef.current === 'IDLE' || stateRef.current === 'INSPECTING') {
      setTimerState('HOLDING');
      holdTimeoutRef.current = setTimeout(() => {
        setTimerState('READY');
        sounds.playReadyBeep();
      }, settings.holdTimeMs);
    }
  };

  const handlePointerUp = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (stateRef.current === 'READY') {
      startSolve();
    } else if (stateRef.current === 'HOLDING') {
      setTimerState('IDLE');
    }
  };

  const formattedTimeStr =
    timerState === 'INSPECTING'
      ? inspectionCountdown.toString()
      : formatTime(displayTime, timerState === 'IDLE' ? lastSolvePenalty : 'NONE', settings.showMilli);

  const diffResult = settings.showDiff && timerState === 'IDLE' ? formatDiff(diffMs) : null;

  return (
    <div
      className="timer-center-area"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      tabIndex={0}
      aria-label="Timer area. Hold space or press to start timing"
    >
      <div className="timer-main-display">
        <span
          className={`timer-digits ${
            timerState === 'HOLDING'
              ? 'holding'
              : timerState === 'READY'
              ? 'ready'
              : timerState === 'INSPECTING'
              ? 'inspecting'
              : ''
          }`}
          style={{ transform: `scale(${settings.timerSize})` }}
        >
          {formattedTimeStr}
        </span>

        {diffResult && (
          <span
            className={`timer-diff-tag ${
              diffResult.isPositive ? 'positive' : 'negative'
            }`}
          >
            {diffResult.text}
          </span>
        )}
      </div>

      {settings.showAvgLabel && timerState !== 'RUNNING' && (
        <div className="timer-sub-averages">
          <div className="avg-label-line">
            ao5: {formatTime(currentAo5)}
          </div>
          <div className="avg-label-line">
            ao12: {formatTime(currentAo12)}
          </div>
          <div className="avg-label-line">
            ao25: {formatTime(currentAo25)}
          </div>
        </div>
      )}
    </div>
  );
};
