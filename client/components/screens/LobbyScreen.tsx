'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGame, type GameState } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';
import { QuitConfirmationModal } from '@/components/QuitConfirmationModal';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix?: string;
  onChange: (val: number) => void;
  onCommit: (val: number) => void;
}

function CustomSlider({ label, min, max, value, suffix = '', onChange, onCommit }: SliderProps) {
  const [localVal, setLocalVal] = useState(value);

  return (
    <div>
      <label className="block text-white/80 mb-1">{label}: {localVal}{suffix}</label>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={localVal}
        onChange={(e) => {
          const v = +e.target.value;
          setLocalVal(v);
          onChange(v);
        }}
        onMouseUp={(e) => onCommit(+(e.currentTarget as HTMLInputElement).value)}
        onTouchEnd={(e) => onCommit(+(e.currentTarget as HTMLInputElement).value)}
        onBlur={(e) => onCommit(+(e.currentTarget as HTMLInputElement).value)}
        className="w-full" 
      />
    </div>
  );
}

export function LobbyScreen() {
  const { state, startGame, updateSettings, leaveRoom, socketId } = useGame();
  const router = useRouter();
  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const isHost = state.hostId === socketId;
  const canStart = state.players.length >= 3 && state.players.length <= 8;

  const handleQuitConfirm = () => {
    leaveRoom();
    router.push('/');
    setQuitModalOpen(false);
  };

  const pendingSettingsRef = useRef<Partial<GameState['timers'] & { totalRounds?: number }>>({});
  
  const handleSliderChange = useCallback((key: string, val: number) => {
    if (key === 'totalRounds') pendingSettingsRef.current.totalRounds = val;
    else if (key === 'clueInput') pendingSettingsRef.current.clueInput = val;
    else if (key === 'discussion') pendingSettingsRef.current.discussion = val;
    else if (key === 'voting') pendingSettingsRef.current.voting = val;
  }, []);

  const handleSliderCommit = useCallback(() => {
    if (Object.keys(pendingSettingsRef.current).length > 0) {
      updateSettings(pendingSettingsRef.current);
      pendingSettingsRef.current = {};
    }
  }, [updateSettings]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 min-w-0 max-w-lg flex flex-col gap-4 overflow-y-auto">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Room {state.code}</h2>
        <p className="text-white/60 text-sm mb-4">
          Share this code: <span className="font-mono font-bold text-white">{state.code}</span>
        </p>
        <p className="text-white/60 text-sm mb-4">
          {state.players.length} / 8 players (need 3–8 to start)
        </p>

        <div className="mb-4 p-3 rounded-xl bg-white/5 text-sm">
          {state.players.length >= 6 ? (
            isHost ? (
              <div>
                <label className="block text-white/80 mb-2">Imposters (6+ players)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ imposters: 1 })}
                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition-all ${
                      (state.numberOfImposters ?? 1) === 1
                        ? 'bg-imposter/30 border-imposter text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    1 Imposter
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ imposters: 2 })}
                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition-all ${
                      (state.numberOfImposters ?? 1) === 2
                        ? 'bg-imposter/30 border-imposter text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    2 Imposters
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white/80">
                Imposters: {(state.numberOfImposters ?? 1) === 2 ? '2' : '1'}
              </p>
            )
          ) : (
            <p className="text-white/80">1 Imposter (fixed for 3–5 players)</p>
          )}
        </div>

        {isHost && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 text-sm space-y-3">
            <CustomSlider
              label="Rounds" min={1} max={10} value={state.totalRounds ?? 5}
              onChange={(v) => handleSliderChange('totalRounds', v)}
              onCommit={handleSliderCommit}
            />
            <CustomSlider
              label="Clue timer" min={10} max={90} value={state.timers?.clueInput ?? 30} suffix="s"
              onChange={(v) => handleSliderChange('clueInput', v)}
              onCommit={handleSliderCommit}
            />
            <CustomSlider
              label="Discussion" min={30} max={180} value={state.timers?.discussion ?? 120} suffix="s"
              onChange={(v) => handleSliderChange('discussion', v)}
              onCommit={handleSliderCommit}
            />
            <CustomSlider
              label="Voting" min={15} max={60} value={state.timers?.voting ?? 30} suffix="s"
              onChange={(v) => handleSliderChange('voting', v)}
              onCommit={handleSliderCommit}
            />
          </div>
        )}

        <ul className="space-y-2 mb-4">
          {state.players.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="text-2xl w-8 text-center flex-shrink-0" title="Avatar">
                {p.avatar ?? '👤'}
              </span>
              {p.name}
              {p.isHost && <span className="text-xs text-white/50">(host)</span>}
            </li>
          ))}
        </ul>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        )}
        <button onClick={() => setQuitModalOpen(true)} className="btn-secondary w-full py-3 mt-2">
          Quit
        </button>
      </div>
      <QuitConfirmationModal
        isOpen={quitModalOpen}
        onClose={() => setQuitModalOpen(false)}
        onConfirm={handleQuitConfirm}
      />
      </div>
      <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col min-h-0">
        <Chat />
      </aside>
    </div>
  );
}
