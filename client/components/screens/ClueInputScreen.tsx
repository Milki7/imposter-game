'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';

export function ClueInputScreen() {
  const { state, submitClue, socketId } = useGame();
  const [clue, setClue] = useState('');
  const me = state.players.find((p) => p.id === socketId);
  const alreadySubmitted = !!me?.clue;
  const isMyTurn = state.currentCluePlayerId === socketId;
  const timer = state.timers?.clueInput ?? 30;
  const cluesSoFar = state.roundData?.clues ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clue.trim() && !alreadySubmitted && isMyTurn) {
      submitClue(clue.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Clue Phase (turn-based)</h2>
        <p className="text-white/60 text-sm mb-4">
          {isMyTurn
            ? `Your turn! You have ${timer}s to type one word.`
            : state.currentCluePlayerName
              ? `Waiting for ${state.currentCluePlayerName}...`
              : 'Waiting for next player...'}
        </p>
        {cluesSoFar.length > 0 && (
          <div className="mb-4 space-y-1">
            <p className="text-white/80 text-xs font-medium">Clues so far:</p>
            {cluesSoFar.map((c) => (
              <div key={c.playerId} className="text-sm text-white/70">
                {c.name}: <span className="text-white">{c.clue}</span>
              </div>
            ))}
          </div>
        )}
        {alreadySubmitted ? (
          <p className="text-innocent py-4">Clue submitted!</p>
        ) : isMyTurn ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={clue}
              onChange={(e) => setClue(e.target.value.slice(0, 50))}
              placeholder="Your clue..."
              maxLength={50}
              className="input-field"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full" disabled={!clue.trim()}>
              Submit
            </button>
          </form>
        ) : (
          <p className="text-white/40 py-4">Wait for your turn</p>
        )}
      </div>
      <Chat />
    </div>
  );
}
