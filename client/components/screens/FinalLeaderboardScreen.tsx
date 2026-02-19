'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { QuitConfirmationModal } from '@/components/QuitConfirmationModal';

export function FinalLeaderboardScreen() {
  const { state, restartGame, leaveRoom, socketId } = useGame();
  const router = useRouter();
  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const leaderboard = state.leaderboard ?? [];
  const winner = leaderboard[0];
  const isHost = state.hostId === socketId;
  const finalWord = state.finalWord;
  const finalImposterNames = state.finalImposterNames ?? (state.finalImposterName ? [state.finalImposterName] : []);

  const handleQuitConfirm = () => {
    leaveRoom();
    router.push('/');
    setQuitModalOpen(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto screen-card p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">Final Leaderboard</h2>
      {(finalWord != null || finalImposterNames.length > 0) && (
        <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
          {finalImposterNames.length > 0 && (
            <p className="text-imposter font-semibold">
              {finalImposterNames.length === 1
                ? `The Imposter was: ${finalImposterNames[0]}`
                : `The Imposters were: ${finalImposterNames.join(' and ')}`}
            </p>
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
            className={`flex justify-between items-center p-3 rounded-xl gap-2 ${
              i === 0 ? 'bg-imposter/10' : 'bg-white/5'
            }`}
          >
            <span className="font-medium flex items-center gap-2">
              <span className="text-2xl">{p.avatar ?? '👤'}</span>
              {i + 1}. {p.name}
            </span>
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
        <button onClick={() => setQuitModalOpen(true)} className="btn-secondary w-full py-3">
          Quit
        </button>
      </div>
      <QuitConfirmationModal
        isOpen={quitModalOpen}
        onClose={() => setQuitModalOpen(false)}
        onConfirm={handleQuitConfirm}
      />
      <p className="text-white/40 text-sm text-center mt-4">Thanks for playing!</p>
    </div>
  );
}
