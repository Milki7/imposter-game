'use client';

import { useGame } from '@/components/GameProvider';

export function FinalLeaderboardScreen() {
  const { state } = useGame();
  const leaderboard = state.leaderboard ?? [];
  const winner = leaderboard[0];

  return (
    <div className="w-full max-w-lg mx-auto screen-card p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">Final Leaderboard</h2>
      {winner && (
        <div className="text-center mb-6 p-4 rounded-xl bg-imposter/20 border border-imposter">
          <p className="text-4xl mb-2">🏆</p>
          <p className="text-xl font-bold">{winner.name}</p>
          <p className="text-white/80">{winner.score} points</p>
        </div>
      )}
      <ol className="space-y-3">
        {leaderboard.map((p, i) => (
          <li
            key={p.id}
            className={`flex justify-between items-center p-3 rounded-xl ${
              i === 0 ? 'bg-imposter/10' : 'bg-white/5'
            }`}
          >
            <span className="font-medium">{i + 1}. {p.name}</span>
            <span>{p.score} pts</span>
          </li>
        ))}
      </ol>
      <p className="text-white/40 text-sm text-center mt-6">Thanks for playing!</p>
    </div>
  );
}
