'use client';

import { useGame } from '@/components/GameProvider';

export function FinalLeaderboardScreen() {
  const { state, restartGame, leaveRoom, socketId } = useGame();
  const leaderboard = state.leaderboard ?? [];
  const winner = leaderboard[0];
  const isHost = state.hostId === socketId;
  const finalWord = state.finalWord;
  const finalImposterName = state.finalImposterName;

  return (
    <div className="w-full max-w-lg mx-auto screen-card p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">Final Leaderboard</h2>
      {(finalWord != null || finalImposterName != null) && (
        <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
          {finalImposterName != null && (
            <p className="text-imposter font-semibold">The Imposter was: {finalImposterName}</p>
          )}
          {finalWord != null && (
            <p className="text-innocent font-semibold">The word was: {finalWord}</p>
          )}
        </div>
      )}
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
      <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-3">
        {isHost && (
          <button onClick={restartGame} className="btn-primary w-full py-3">
            Restart Game
          </button>
        )}
        <button onClick={leaveRoom} className="btn-secondary w-full py-3">
          Quit
        </button>
      </div>
      <p className="text-white/40 text-sm text-center mt-4">Thanks for playing!</p>
    </div>
  );
}
