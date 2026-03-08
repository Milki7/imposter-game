'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/components/GameProvider';

export function ImposterLastChanceScreen() {
  const { state, imposterGuess, socketId, imposterGuessResult } = useGame();
  const [guess, setGuess] = useState('');
  const lastChanceSec = state.timers?.imposterLastChance ?? 10;
  const [secondsLeft, setSecondsLeft] = useState(lastChanceSec);
  const ejectedId = state.roundData?.voteResults?.ejectedId;
  const isEjectedImposter = socketId === ejectedId;
  const theme = state.roundData?.theme ?? '?';

  useEffect(() => {
    setSecondsLeft(lastChanceSec);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastChanceSec]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && isEjectedImposter) {
      imposterGuess(guess.trim());
    }
  };

  const panicMode = secondsLeft > 0 && secondsLeft <= 10;

  const timerDisplay = (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <span
        className={`text-2xl sm:text-3xl font-sans font-bold tabular-nums px-5 sm:px-8 py-2.5 sm:py-3 rounded-full border backdrop-blur-md transition-colors ${
          panicMode
            ? 'text-red-400 border-red-500/50 bg-red-950/40 shadow-glow-imposter animate-pulse'
            : 'text-imposter border-imposter/30 bg-black/40 shadow-glow-imposter'
        }`}
      >
        {secondsLeft}s
      </span>
    </div>
  );

  if (!isEjectedImposter) {
    return (
      <div className="w-full max-w-md mx-auto h-full pt-16">
        {timerDisplay}
        <div className="screen-card p-5 sm:p-8 animate-slide-up text-center">
          <h2 className="text-xl font-bold mb-4">Last Chance</h2>
          <p className="text-white/80">The ejected Imposter has {lastChanceSec}s to guess the Secret Word for +150 pts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-full pt-16">
      {timerDisplay}
      <div className="screen-card p-5 sm:p-8 animate-slide-up text-center">
        <h2 className="text-xl font-bold mb-4">Last Chance!</h2>
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
        {imposterGuessResult === true && <p className="text-innocent mt-4 font-semibold shadow-glow-innocent inline-block px-4 py-2 rounded-lg bg-innocent/10 border border-innocent/30">Correct! +150 pts</p>}
        {imposterGuessResult === false && <p className="text-imposter mt-4 shadow-glow-imposter inline-block px-4 py-2 rounded-lg bg-imposter/10 border border-imposter/30">Wrong guess</p>}
      </div>
    </div>
  );
}
