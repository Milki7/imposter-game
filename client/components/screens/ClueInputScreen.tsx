'use client';

import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/components/GameProvider';

export function ClueInputScreen() {
  const { state, submitClue, socketId } = useGame();
  const [clue, setClue] = useState('');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const turnStartRef = useRef(state.currentCluePlayerId);
  const ejectedPlayerIds = state.ejectedPlayerIds ?? [];
  const isEjected = socketId ? ejectedPlayerIds.includes(socketId) : false;
  const me = state.players.find((p) => p.id === socketId);
  const alreadySubmitted = !!me?.clue;
  const isMyTurn = state.currentCluePlayerId === socketId;
  const timerSec = state.timers?.clueInput ?? 30;
  const cluesSoFar = state.roundData?.clues ?? [];
  const currentTurnPlayer = state.players.find((p) => p.id === state.currentCluePlayerId);

  useEffect(() => {
    if (state.currentCluePlayerId !== turnStartRef.current) {
      turnStartRef.current = state.currentCluePlayerId;
      setSecondsLeft(timerSec);
    }
  }, [state.currentCluePlayerId, timerSec]);

  useEffect(() => {
    if (secondsLeft === null && state.currentCluePlayerId) {
      setSecondsLeft(timerSec);
    }
  }, [state.currentCluePlayerId, timerSec, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s != null && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clue.trim() && !alreadySubmitted && isMyTurn) {
      submitClue(clue.trim());
    }
  };

  if (isEjected) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
        <div className="screen-card p-6 animate-slide-up text-center">
          <h2 className="text-xl font-bold mb-2">You were ejected</h2>
          <p className="text-white/60 mb-4">You can only watch. Clues will appear below.</p>
          {cluesSoFar.length > 0 && (
            <div className="text-left space-y-2">
              {cluesSoFar.map((c) => {
                const avatar = state.players.find((p) => p.id === c.playerId)?.avatar ?? '👤';
                return (
                  <div key={c.playerId} className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        {avatar}
                      </span>
                      <span className="text-white/70 text-sm truncate">{c.name}</span>
                    </div>
                    <span className="text-white font-bold text-lg md:text-xl">{c.clue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayTime = secondsLeft != null ? secondsLeft : timerSec;
  const panicMode = displayTime > 0 && displayTime <= 10;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full pt-16">
      {isMyTurn && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span
            className={`text-3xl font-sans font-bold tabular-nums px-8 py-3 rounded-full border backdrop-blur-md transition-colors ${
              panicMode
                ? 'text-red-400 border-red-500/50 bg-red-950/40 shadow-glow-imposter animate-pulse'
                : 'text-innocent border-innocent/30 bg-black/40 shadow-glow-innocent'
            }`}
          >
            {displayTime}s
          </span>
        </div>
      )}
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Clue Phase (turn-based)</h2>
        <div className="mb-4">
          {isMyTurn ? (
            <p className="text-white/80 text-sm font-medium">Your turn! Type one word.</p>
          ) : (
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/40">
              <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Wait</p>
              {currentTurnPlayer ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    {currentTurnPlayer.avatar ?? '👤'}
                  </span>
                  <p className="text-white font-semibold">
                    It&apos;s <span className="text-primary">{currentTurnPlayer.name}</span>&apos;s turn
                  </p>
                </div>
              ) : (
                <p className="text-white/70 text-sm">Waiting for next player...</p>
              )}
            </div>
          )}
        </div>
        {cluesSoFar.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-white/80 text-xs font-medium">Clues so far:</p>
            {cluesSoFar.map((c) => {
              const avatar = state.players.find((p) => p.id === c.playerId)?.avatar ?? '👤';
              return (
                <div key={c.playerId} className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      {avatar}
                    </span>
                    <span className="text-white/70 text-sm truncate">{c.name}</span>
                  </div>
                  <span className="text-white font-bold text-lg md:text-xl">{c.clue}</span>
                </div>
              );
            })}
          </div>
        )}
        {alreadySubmitted ? (
          <p className="text-innocent py-4">Clue submitted!</p>
        ) : isMyTurn ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={clue}
              onChange={(e) => setClue(e.target.value.slice(0, 50))}
              placeholder="Your clue..."
              maxLength={50}
              className="input-field"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full" disabled={!clue.trim()}>
              Submit
            </button>
          </form>
        ) : (
          <p className="text-white/40 py-4">Wait for your turn</p>
        )}
      </div>
    </div>
  );
}
