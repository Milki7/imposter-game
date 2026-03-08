'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { QuitConfirmationModal } from '@/components/QuitConfirmationModal';

export function FinalLeaderboardScreen() {
  const { state, restartGame, leaveRoom, socketId } = useGame();
  const router = useRouter();
  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const leaderboard = state.leaderboard ?? [];
  const isHost = state.hostId === socketId;
  const finalWord = state.finalWord;
  const finalImposterNames = state.finalImposterNames ?? (state.finalImposterName ? [state.finalImposterName] : []);

  const handleQuitConfirm = () => {
    leaveRoom();
    router.push('/');
    setQuitModalOpen(false);
  };

  const imposterFled = state.gameEndReason === 'imposter_fled';

  const rankedLeaderboard = useMemo(() => {
    const result: { player: typeof leaderboard[0]; rank: number; isTied: boolean }[] = [];
    let currentRank = 1;
    for (let i = 0; i < leaderboard.length; i++) {
      const player = leaderboard[i];
      const prevPlayer = leaderboard[i - 1];
      const nextPlayer = leaderboard[i + 1];
      const isTiedWithPrev = prevPlayer && prevPlayer.score === player.score;
      const isTiedWithNext = nextPlayer && nextPlayer.score === player.score;
      const isTied = isTiedWithPrev || isTiedWithNext;
      if (i > 0 && !isTiedWithPrev) {
        currentRank = i + 1;
      }
      result.push({ player, rank: currentRank, isTied });
    }
    return result;
  }, [leaderboard]);

  const winners = rankedLeaderboard.filter((r) => r.rank === 1);
  const hasWinnerTie = winners.length > 1;

  return (
    <div className="w-full max-w-lg mx-auto screen-card p-4 sm:p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">Final Leaderboard</h2>
      {imposterFled && (
        <div className="mb-6 p-5 rounded-xl bg-innocent/20 border-2 border-innocent text-center">
          <p className="text-innocent font-bold text-lg">The Imposter fled!</p>
          <p className="text-white/90 mt-1">Innocents win by default.</p>
        </div>
      )}
      {(finalWord != null || finalImposterNames.length > 0) && !imposterFled && (
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
      {winners.length > 0 && (
        <div className={`text-center mb-6 p-4 rounded-xl ${hasWinnerTie ? 'bg-yellow-500/20 border-2 border-yellow-500/50' : 'bg-imposter/20 border border-imposter'}`}>
          <p className="text-4xl mb-2">{hasWinnerTie ? '🤝' : '🏆'}</p>
          {hasWinnerTie ? (
            <>
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-1">It&apos;s a Tie!</p>
              <p className="text-xl font-bold">{winners.map((w) => w.player.name).join(' & ')}</p>
            </>
          ) : (
            <p className="text-xl font-bold">{winners[0].player.name}</p>
          )}
          <p className="text-white/80">{winners[0].player.score} points</p>
        </div>
      )}
      <ol className="space-y-3">
        {rankedLeaderboard.map(({ player, rank, isTied }, i) => (
          <li
            key={player.id}
            className={`flex justify-between items-center p-3 rounded-xl gap-2 ${
              rank === 1 ? 'bg-imposter/10' : 'bg-white/5'
            }`}
          >
            <span className="font-medium flex items-center gap-2">
              <span className="text-2xl">{player.avatar ?? '👤'}</span>
              <span className="flex items-center gap-1">
                {rank}. {player.name}
                {isTied && <span className="text-yellow-400 text-xs font-semibold ml-1">(TIE)</span>}
              </span>
            </span>
            <span>{player.score} pts</span>
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
