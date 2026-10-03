import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Copy, Check } from 'lucide-react';
import { solveWhiteCross } from '../../utils/cubeSolver';
import { generate3x3x3Scramble } from '../../utils/scramble';

interface ToolsModalProps {
  currentScramble: string;
  onClose: () => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({ currentScramble, onClose }) => {
  const [activeTab, setActiveTab] = useState<'solver' | 'generator' | 'metronome'>('solver');

  // Cross Solver
  const [crossSolution, setCrossSolution] = useState<string>('');
  useEffect(() => {
    setCrossSolution(solveWhiteCross(currentScramble));
  }, [currentScramble]);

  // Scramble Generator
  const [genCount, setGenCount] = useState<number>(5);
  const [generatedScrambles, setGeneratedScrambles] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = () => {
    const list: string[] = [];
    for (let i = 0; i < genCount; i++) {
      list.push(generate3x3x3Scramble());
    }
    setGeneratedScrambles(list);
    setCopied(false);
  };

  const handleCopy = () => {
    if (generatedScrambles.length === 0) return;
    const text = generatedScrambles.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metronome
  const [bpm, setBpm] = useState<number>(120);
  const [isPlayingMetro, setIsPlayingMetro] = useState<boolean>(false);
  const metroIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playClick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  const toggleMetronome = () => {
    if (isPlayingMetro) {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
      metroIntervalRef.current = null;
      setIsPlayingMetro(false);
    } else {
      setIsPlayingMetro(true);
      const intervalMs = (60 / bpm) * 1000;
      playClick();
      metroIntervalRef.current = setInterval(playClick, intervalMs);
    }
  };

  useEffect(() => {
    return () => {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">도구 (Tools)</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close tools modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('solver')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'solver' ? '#fff' : 'transparent',
              borderBottom: activeTab === 'solver' ? '2px solid #2563eb' : 'none',
              fontWeight: activeTab === 'solver' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            크로스 솔버 (Cross)
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'generator' ? '#fff' : 'transparent',
              borderBottom: activeTab === 'generator' ? '2px solid #2563eb' : 'none',
              fontWeight: activeTab === 'generator' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            스크램블 생성기
          </button>
          <button
            onClick={() => setActiveTab('metronome')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'metronome' ? '#fff' : 'transparent',
              borderBottom: activeTab === 'metronome' ? '2px solid #2563eb' : 'none',
              fontWeight: activeTab === 'metronome' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            메트로놈 (Metronome)
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'solver' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>현재 스크램블 (Current Scramble):</strong>
                <div style={{ fontSize: '13px', background: '#f1f5f9', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                  {currentScramble}
                </div>
              </div>

              <div>
                <strong>흰색 크로스 해법 (White Cross Solution):</strong>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', background: '#f0fdf4', padding: '12px', borderRadius: '6px', marginTop: '6px', border: '1px solid #bbf7d0' }}>
                  {crossSolution}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                * WCA 기본 방향(흰색 상단, 초록색 정면) 기준 하단(Yellow Face) 또는 z2 반전 기준 흰색 십자가 해법입니다.
              </div>
            </div>
          )}

          {activeTab === 'generator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>생성 개수:</span>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value={5}>5개 (ao5 세트)</option>
                  <option value={12}>12개 (ao12 세트)</option>
                  <option value={50}>50개</option>
                  <option value={100}>100개</option>
                </select>
                <button className="btn-primary" onClick={handleGenerate}>
                  생성하기
                </button>
              </div>

              {generatedScrambles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>생성된 스크램블 목록:</strong>
                    <button
                      className="btn-secondary"
                      onClick={handleCopy}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}
                    >
                      {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      <span>{copied ? '복사됨!' : '클립보드 복사'}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: '#f8fafc',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      lineHeight: 1.6
                    }}
                  >
                    {generatedScrambles.map((s, idx) => (
                      <div key={idx} style={{ padding: '2px 0' }}>
                        <strong>{idx + 1}.</strong> {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metronome' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{bpm} BPM</div>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                style={{ width: '80%' }}
              />
              <button
                className={isPlayingMetro ? 'btn-danger' : 'btn-primary'}
                onClick={toggleMetronome}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '16px' }}
              >
                {isPlayingMetro ? <Square size={18} /> : <Play size={18} />}
                <span>{isPlayingMetro ? '정지' : '시작'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
