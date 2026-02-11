'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';
import { VOTE_SKIP } from '@/lib/constants';

export function DiscussionScreen() {
  const { state, submitVote, socketId } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVotedOptimistic, setHasVotedOptimistic] = useState(false);
  const clues = state.roundData?.clues ?? [];
  const others = state.players.filter((p) => p.id !== socketId);
  const votedPlayerIds = state.roundData?.votedPlayerIds ?? [];
  const hasVoted = hasVotedOptimistic || (socketId ? votedPlayerIds.includes(socketId) : false);
  const voteCount = votedPlayerIds.length;
  const totalPlayers = state.players.length;

  const handleVote = () => {
    if (selectedId && !hasVoted) {
      setHasVotedOptimistic(true);
      submitVote(selectedId);
    }
  };

  const selectedStyle = 'border-innocent border-2 bg-innocent/20 ring-2 ring-innocent/50';
  const unselectedStyle = 'border-white/20 bg-white/5 hover:bg-white/10';

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Debate & Vote</h2>
        <p className="text-white/60 text-sm mb-4">
          All votes in? Results show immediately. 1 player left? 10s hurry-up.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white/80 text-sm font-medium">Status:</span>
          <span className="text-innocent text-sm font-medium">
            {voteCount}/{totalPlayers} voted
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <p className="text-white/80 text-sm font-medium">Clues given:</p>
          {clues.map((c) => (
            <div key={c.playerId} className="p-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/60">{c.name}:</span>{' '}
              <span className="text-white">{c.clue}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-4 pt-4 border-t border-white/10">
          <p className="text-white/80 text-sm font-medium">Vote for the Imposter:</p>
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => !hasVoted && setSelectedId(p.id)}
              disabled={hasVoted}
              className={`w-full p-3 rounded-xl text-left border-2 transition-all flex items-center gap-2 ${
                hasVoted ? 'opacity-70 cursor-not-allowed' : ''
              } ${selectedId === p.id ? selectedStyle : unselectedStyle}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  votedPlayerIds.includes(p.id) ? 'bg-innocent' : 'bg-white/30'
                }`}
                title={votedPlayerIds.includes(p.id) ? 'Voted' : 'Waiting'}
              />
              {p.name}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <button
            onClick={() => !hasVoted && setSelectedId(VOTE_SKIP)}
            disabled={hasVoted}
            className={`w-full p-3 rounded-xl text-center border-2 transition-all ${
              hasVoted ? 'opacity-70 cursor-not-allowed' : ''
            } ${selectedId === VOTE_SKIP ? selectedStyle : unselectedStyle}`}
          >
            Skip Vote
          </button>
        </div>
        {hasVoted ? (
          <p className="text-innocent font-medium py-3 text-center">Vote submitted</p>
        ) : (
          <button
            onClick={handleVote}
            disabled={!selectedId}
            className="btn-primary w-full py-4 disabled:opacity-50"
          >
            Submit Vote
          </button>
        )}
      </div>
      <Chat />
    </div>
  );
}
