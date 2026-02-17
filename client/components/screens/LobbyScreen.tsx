'use client';

import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';

export function LobbyScreen() {
  const { state, startGame, updateSettings, leaveRoom, socketId } = useGame();
  const isHost = state.hostId === socketId;
  const canStart = state.players.length >= 3 && state.players.length <= 8;

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
            <div>
              <label className="block text-white/80 mb-1">Rounds: {state.totalRounds ?? 5}</label>
              <input
                type="range"
                min={1}
                max={10}
                value={state.totalRounds ?? 5}
                onChange={(e) => updateSettings({ totalRounds: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-1">Clue timer: {(state.timers?.clueInput ?? 30)}s</label>
              <input
                type="range"
                min={10}
                max={90}
                value={state.timers?.clueInput ?? 30}
                onChange={(e) => updateSettings({ clueInput: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-1">Discussion: {(state.timers?.discussion ?? 120)}s</label>
              <input
                type="range"
                min={30}
                max={180}
                value={state.timers?.discussion ?? 120}
                onChange={(e) => updateSettings({ discussion: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-1">Voting: {(state.timers?.voting ?? 30)}s</label>
              <input
                type="range"
                min={15}
                max={60}
                value={state.timers?.voting ?? 30}
                onChange={(e) => updateSettings({ voting: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
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
        <button onClick={leaveRoom} className="btn-secondary w-full py-3 mt-2">
          Quit
        </button>
      </div>
      </div>
      <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col min-h-0">
        <Chat />
      </aside>
    </div>
  );
}
