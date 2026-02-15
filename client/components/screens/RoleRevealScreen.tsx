'use client';

import { useGame } from '@/components/GameProvider';

export function RoleRevealScreen() {
  const { state, socketId } = useGame();
  const me = state.players.find((p) => p.id === socketId);
  const isImposter = me?.role === 'imposter';
  const imposterCount = state.players.length <= 5 ? 1 : (state.numberOfImposters ?? 1);

  return (
    <div className="w-full max-w-md mx-auto screen-card p-8 animate-slide-up text-center">
      <h2 className="text-2xl font-bold mb-6">Your Role</h2>
      <p className="text-white/60 text-sm mb-4">
        {imposterCount === 1 ? 'There is 1 Imposter' : `There are ${imposterCount} Imposters`} among you.
      </p>
      {isImposter ? (
        <>
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-imposter font-bold text-xl mb-2">IMPOSTER</p>
          <p className="text-white/80 mb-2">
            Theme: <span className="font-semibold text-white">{me?.theme ?? '?'}</span>
          </p>
          <p className="text-white/60 text-sm">
            You don&apos;t know the secret word. Blend in with your clues.
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl mb-4">✅</div>
          <p className="text-innocent font-bold text-xl mb-2">INNOCENT</p>
          <p className="text-white/80 mb-2">
            Secret Word: <span className="font-semibold text-white">{me?.secretWord ?? '?'}</span>
          </p>
          <p className="text-white/60 text-sm">
            Give clues that match the word. Find the Imposter!
          </p>
        </>
      )}
      <p className="text-white/40 text-xs mt-6">Starting clue phase...</p>
    </div>
  );
}
