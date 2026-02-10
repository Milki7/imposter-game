'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';
import { VOTE_SKIP } from '@/lib/constants';

export function VotingScreen() {
  const { state, submitVote, socketId } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const others = state.players.filter((p) => p.id !== socketId);
  const clues = state.roundData?.clues ?? [];

  const handleVote = () => {
    if (selectedId) {
      submitVote(selectedId);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Vote for the Imposter</h2>
        <p className="text-white/60 text-sm mb-4">Blind vote — results hidden until time ends</p>
        <div className="space-y-2 mb-4">
          {clues.map((c) => (
            <div key={c.playerId} className="p-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/60">{c.name}:</span>{' '}
              <span className="text-white">{c.clue}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-4">
          <p className="text-white/80 text-sm font-medium">Who do you vote for?</p>
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full p-3 rounded-xl text-left border transition-colors ${
                selectedId === p.id
                  ? 'border-imposter bg-imposter/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="mb-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setSelectedId(VOTE_SKIP)}
            className={`w-full p-3 rounded-xl text-center border transition-colors ${
              selectedId === VOTE_SKIP
                ? 'border-imposter bg-imposter/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            Skip Vote
          </button>
        </div>
        <button
          onClick={handleVote}
          disabled={!selectedId}
          className="btn-primary w-full py-4 disabled:opacity-50"
        >
          Submit Vote
        </button>
      </div>
      <Chat />
    </div>
  );
}
