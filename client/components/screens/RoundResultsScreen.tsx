'use client';

import { useGame } from '@/components/GameProvider';

export function RoundResultsScreen() {
  const { state } = useGame();
  const results = state.roundData?.voteResults;
  const leaderboard = state.leaderboard ?? [];
  const isGameOver = state.currentRound !== undefined && state.totalRounds !== undefined && state.currentRound >= state.totalRounds;

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
      <div className="mb-4">
        <p className="text-white/80 text-sm font-medium mb-2">Leaderboard</p>
        <ol className="space-y-1">
          {leaderboard.map((p, i) => (
            <li key={p.id} className="flex justify-between">
              <span>{i + 1}. {p.name}</span>
              <span>{p.score} pts</span>
            </li>
          ))}
        </ol>
      </div>
      {isGameOver ? (
        <p className="text-white/60 text-sm">Game over! Final leaderboard next.</p>
      ) : (
        <p className="text-white/60 text-sm">Next round starting...</p>
      )}
    </div>
  );
}
