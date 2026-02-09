'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';

export function ImposterLastChanceScreen() {
  const { state, imposterGuess, socketId, imposterGuessResult } = useGame();
  const [guess, setGuess] = useState('');
  const ejectedId = state.roundData?.voteResults?.ejectedId;
  const isEjectedImposter = socketId === ejectedId;
  const theme = state.roundData?.theme ?? '?';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && isEjectedImposter) {
      imposterGuess(guess.trim());
    }
  };

  if (!isEjectedImposter) {
    return (
      <div className="w-full max-w-md mx-auto screen-card p-8 animate-slide-up text-center">
        <h2 className="text-xl font-bold mb-2">Last Chance</h2>
        <p className="text-white/80">The ejected Imposter is guessing the Secret Word...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto screen-card p-8 animate-slide-up text-center">
      <h2 className="text-xl font-bold mb-2">Last Chance!</h2>
      <p className="text-white/80 mb-4">
        Guess the Secret Word for +150 points. Theme: <span className="font-semibold">{theme}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Your guess..."
          className="input-field"
          autoFocus
          disabled={imposterGuessResult !== null}
        />
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!guess.trim() || imposterGuessResult !== null}
        >
          Submit Guess
        </button>
      </form>
      {imposterGuessResult === true && <p className="text-innocent mt-4 font-semibold">Correct! +150 pts</p>}
      {imposterGuessResult === false && <p className="text-imposter mt-4">Wrong guess</p>}
    </div>
  );
}
