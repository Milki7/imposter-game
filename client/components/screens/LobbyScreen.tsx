'use client';

import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';

export function LobbyScreen() {
  const { state, startGame, updateSettings, socketId } = useGame();
  const isHost = state.hostId === socketId;
  const canStart = state.players.length >= 3 && state.players.length <= 8;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Room {state.code}</h2>
        <p className="text-white/60 text-sm mb-4">
          Share this code: <span className="font-mono font-bold text-white">{state.code}</span>
        </p>
        <p className="text-white/60 text-sm mb-4">
          {state.players.length} / 8 players (need 3–8 to start)
        </p>

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
              <span className="w-2 h-2 rounded-full bg-imposter" />
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
      </div>

      <Chat />
    </div>
  );
}
