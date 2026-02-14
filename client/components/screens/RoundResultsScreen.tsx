'use client';

import { useGame } from '@/components/GameProvider';

export function RoundResultsScreen() {
  const { state } = useGame();
  const results = state.roundData?.voteResults;
  const activeCount = state.players?.length - (state.ejectedPlayerIds?.length ?? 0);
  const isGameOver = state.phase === 'final_leaderboard' || activeCount < 3;

  return (
    <div className="w-full max-w-lg mx-auto screen-card p-6 animate-slide-up">
      <h2 className="text-xl font-bold mb-4">Round {state.currentRound} Results</h2>
      {results?.skipped ? (
        <div className="p-4 rounded-xl mb-4 bg-white/10 border border-white/20">
          <p className="font-semibold">No one was ejected (Skipped).</p>
          <p className="text-white/60 text-sm">{results.skipVotes ?? 0} vote(s) to skip</p>
        </div>
      ) : results?.ejectedId ? (
        <div className={`p-4 rounded-xl mb-4 ${results.wasImposter ? 'bg-imposter/20 border border-imposter' : 'bg-white/10'}`}>
          <p className="font-semibold">{results.ejectedName} was ejected.</p>
          <p className={results.wasImposter ? 'text-imposter' : 'text-white/80'}>
            {results.wasImposter ? 'They were the Imposter!' : 'They were Innocent.'}
          </p>
        </div>
      ) : null}
      {activeCount < 3 && (
        <p className="text-white/60 text-sm mb-4">Not enough players to continue. Game over!</p>
      )}
      {isGameOver ? (
        <p className="text-white/60 text-sm">Game over! Final leaderboard next.</p>
      ) : results?.wasImposter ? (
        <p className="text-white/60 text-sm">Last Chance: ejected Imposter can guess the word for +150 pts...</p>
      ) : (
        <p className="text-white/60 text-sm">Next round starting...</p>
      )}
    </div>
  );
}
