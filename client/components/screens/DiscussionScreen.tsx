'use client';

import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';
import { VOTE_SKIP, DISCUSSION_PANIC_THRESHOLD } from '@/lib/constants';

const HURRY_UP_SECONDS = 10;

export function DiscussionScreen() {
  const { state, submitVote, submitDiscussionReady, socketId } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVotedOptimistic, setHasVotedOptimistic] = useState(false);
  const [hurryUpSeconds, setHurryUpSeconds] = useState<number | null>(null);
  const hurryUpStarted = useRef(false);
  const clues = state.roundData?.clues ?? [];
  const votedPlayerIds = state.roundData?.votedPlayerIds ?? [];
  const readyPlayerIds = state.roundData?.readyPlayerIds ?? [];
  const ejectedPlayerIds = state.ejectedPlayerIds ?? [];
  const isEjected = socketId ? ejectedPlayerIds.includes(socketId) : false;
  const activePlayers = state.players.filter((p) => !ejectedPlayerIds.includes(p.id));
  const totalPlayers = activePlayers.length;
  const hasVoted = hasVotedOptimistic || (socketId ? votedPlayerIds.includes(socketId) : false);
  const voteCount = votedPlayerIds.length;
  const isReady = socketId ? readyPlayerIds.includes(socketId) : false;
  const readyCount = readyPlayerIds.length;
  const requiredReady = totalPlayers > 0 ? Math.floor(totalPlayers / 2) + 1 : 1;
  const others = activePlayers.filter((p) => p.id !== socketId);
  const oneLeftToVote = totalPlayers > 1 && voteCount === totalPlayers - 1;
  const discussionTimeUp = state.discussionTimeUp ?? false;
  const discussionSec = state.timers?.discussion ?? 120;
  const votingSecondsRemaining = state.votingSecondsRemaining ?? null;
  const serverSecondsRemaining = state.discussionSecondsRemaining ?? null;
  const [localSecondsLeft, setLocalSecondsLeft] = useState<number | null>(null);
  const discussionTimerStarted = useRef(false);
  const tickSoundPlayedFor = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const displaySecondsRemaining =
    serverSecondsRemaining !== null
      ? serverSecondsRemaining
      : (discussionTimeUp ? 0 : localSecondsLeft ?? discussionSec);
  const panicMode =
    !discussionTimeUp && displaySecondsRemaining > 0 && displaySecondsRemaining <= DISCUSSION_PANIC_THRESHOLD;

  useEffect(() => {
    if (oneLeftToVote && !hurryUpStarted.current) {
      hurryUpStarted.current = true;
      setHurryUpSeconds(HURRY_UP_SECONDS);
    }
    if (!oneLeftToVote) {
      hurryUpStarted.current = false;
      setHurryUpSeconds(null);
    }
  }, [oneLeftToVote]);

  useEffect(() => {
    if (hurryUpSeconds === null || hurryUpSeconds <= 0) return;
    const t = setInterval(() => setHurryUpSeconds((s) => (s != null && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [hurryUpSeconds]);

  useEffect(() => {
    if (state.phase !== 'discussion') {
      discussionTimerStarted.current = false;
      tickSoundPlayedFor.current = null;
      return;
    }
    if (discussionTimerStarted.current) return;
    discussionTimerStarted.current = true;
    setLocalSecondsLeft(discussionSec);
  }, [state.phase, discussionSec]);

  useEffect(() => {
    if (discussionTimeUp || serverSecondsRemaining !== null) return;
    if (localSecondsLeft === null || localSecondsLeft <= 0) return;
    const t = setInterval(() => setLocalSecondsLeft((s) => (s != null && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [localSecondsLeft, discussionTimeUp, serverSecondsRemaining]);

  useEffect(() => {
    if (!panicMode || displaySecondsRemaining <= 0) return;
    if (tickSoundPlayedFor.current === displaySecondsRemaining) return;
    tickSoundPlayedFor.current = displaySecondsRemaining;
    try {
      const ctx = audioContextRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore if audio not allowed
    }
  }, [panicMode, displaySecondsRemaining]);

  const handleVote = () => {
    if (selectedId && !hasVoted) {
      setHasVotedOptimistic(true);
      submitVote(selectedId);
    }
  };

  const selectedStyle = 'border-innocent border-2 bg-innocent/20 ring-2 ring-innocent/50';
  const unselectedStyle = 'border-white/20 bg-white/5 hover:bg-white/10';

  if (isEjected) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
        <div className="screen-card p-6 animate-slide-up text-center">
          <h2 className="text-xl font-bold mb-2">You were ejected</h2>
          <p className="text-white/60 mb-4">You can only watch. Chat is still available.</p>
          <div className="space-y-2 mb-4 text-left">
            <p className="text-white/80 text-sm font-medium">Clues this round:</p>
            {clues.map((c) => (
              <div key={c.playerId} className="p-2 rounded-lg bg-white/5 text-sm">
                <span className="text-white/60">{c.name}:</span> <span className="text-white">{c.clue}</span>
              </div>
            ))}
          </div>
        </div>
        <Chat frozen={discussionTimeUp} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      {/* All clues on one screen - red border/background in panic mode */}
      <div
        className={`screen-card p-4 animate-slide-up transition-colors duration-300 ${
          panicMode ? 'ring-2 ring-red-500 bg-red-950/40 border-red-500/50' : ''
        }`}
      >
        <h2 className="text-lg font-bold mb-3">Everyone&apos;s clues</h2>
        <div className="grid grid-cols-1 gap-2">
          {clues.map((c) => (
            <div key={c.playerId} className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm flex justify-between items-center gap-2">
              <span className="text-white/70 font-medium">{c.name}</span>
              <span className="text-white font-semibold">{c.clue}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 flex-wrap gap-2">
          <span
            className={`text-sm font-mono font-bold tabular-nums ${
              panicMode ? 'text-red-400 animate-pulse' : 'text-white/60'
            }`}
          >
            {discussionTimeUp ? 'Discussion over — vote now!' : `${displaySecondsRemaining}s to discuss`}
          </span>
          {!discussionTimeUp && (
            <span className="text-white/60 text-sm">{readyCount}/{totalPlayers} ready to vote</span>
          )}
          {discussionTimeUp && (
            <span className="text-innocent text-sm font-medium">{voteCount}/{totalPlayers} voted</span>
          )}
        </div>
        {!discussionTimeUp && (
          <button
            type="button"
            onClick={submitDiscussionReady}
            disabled={isReady}
            className={`mt-3 w-full py-3 rounded-xl font-semibold border-2 transition-all ${
              isReady ? 'bg-innocent/20 border-innocent text-innocent cursor-default' : 'btn-primary border-transparent'
            }`}
          >
            {isReady ? 'Ready — waiting for others' : `Ready to vote (${readyCount}/${requiredReady} to skip)`}
          </button>
        )}
        {panicMode && (
          <p className="text-red-400 font-bold text-sm mt-2 uppercase tracking-wider">Last 10 seconds — panic mode!</p>
        )}
        {oneLeftToVote && hurryUpSeconds !== null && discussionTimeUp && (
          <p className="text-imposter font-mono text-sm font-bold mt-2">Hurry up! {hurryUpSeconds}s</p>
        )}
      </div>

      {/* Vote section and VOTE NOW only after discussion time is up */}
      {discussionTimeUp && (
        <>
          <div className="text-center py-2 flex flex-col gap-1">
            <h2 className="text-2xl font-black text-imposter uppercase tracking-wider">Vote now</h2>
            {votingSecondsRemaining !== null && (
              <p className="text-white/70 font-mono text-lg font-bold tabular-nums">
                {votingSecondsRemaining}s to vote
              </p>
            )}
          </div>
          <div className="screen-card p-6 animate-slide-up ring-2 ring-imposter">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-white/80 text-sm font-medium">Pick who to eject:</p>
              {votingSecondsRemaining !== null && (
                <span className="text-imposter font-mono text-sm font-bold tabular-nums">
                  {votingSecondsRemaining}s left
                </span>
              )}
            </div>
            <div className="space-y-3">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !hasVoted && setSelectedId(p.id)}
                  disabled={hasVoted}
                  className={`w-full p-4 text-lg rounded-xl text-left border-2 transition-all flex items-center gap-2 ${
                    hasVoted ? 'opacity-70 cursor-not-allowed' : ''
                  } ${selectedId === p.id ? selectedStyle : unselectedStyle}`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      votedPlayerIds.includes(p.id) ? 'bg-innocent' : 'bg-white/30'
                    }`}
                    title={votedPlayerIds.includes(p.id) ? 'Voted' : 'Waiting'}
                  />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => !hasVoted && setSelectedId(VOTE_SKIP)}
                disabled={hasVoted}
                className={`w-full p-4 text-lg rounded-xl text-center border-2 transition-all ${
                  hasVoted ? 'opacity-70 cursor-not-allowed' : ''
                } ${selectedId === VOTE_SKIP ? selectedStyle : unselectedStyle}`}
              >
                Skip Vote
              </button>
            </div>
            {hasVoted ? (
              <p className="text-innocent font-medium py-3 text-center">Vote submitted</p>
            ) : (
              <button
                onClick={handleVote}
                disabled={!selectedId}
                className="btn-primary w-full py-5 text-xl disabled:opacity-50 mt-4"
              >
                Submit Vote
              </button>
            )}
          </div>
        </>
      )}

      <Chat frozen={discussionTimeUp} />
    </div>
  );
}
