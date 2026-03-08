'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';
import { VOTE_SKIP } from '@/lib/constants';
import { DiscussionTimer, VotingTimer, VotingTimerSmall } from '@/components/TimerDisplay';

const HURRY_UP_SECONDS = 10;

const selectedStyle = 'border-innocent border-2 bg-innocent/20 ring-2 ring-innocent/50';
const unselectedStyle = 'border-white/20 bg-white/5 hover:bg-white/10';
const profileStyles = [
  'bg-indigo-500/20 border-indigo-400/40',
  'bg-emerald-500/20 border-emerald-400/40',
  'bg-rose-500/20 border-rose-400/40',
  'bg-amber-500/20 border-amber-400/40',
  'bg-cyan-500/20 border-cyan-400/40',
  'bg-violet-500/20 border-violet-400/40',
  'bg-teal-500/20 border-teal-400/40',
  'bg-fuchsia-500/20 border-fuchsia-400/40',
];

function getProfileStyle(playerId: string) {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = (hash + playerId.charCodeAt(i)) % profileStyles.length;
  return profileStyles[hash];
}

interface VoteButtonProps {
  player: { id: string; name: string; avatar?: string };
  isSelected: boolean;
  hasVoted: boolean;
  onSelect: (id: string) => void;
  votedPlayerIds: string[];
}

const VoteButton = memo(function VoteButton({ player, isSelected, hasVoted, onSelect, votedPlayerIds }: VoteButtonProps) {
  const handleClick = useCallback(() => {
    if (!hasVoted) onSelect(player.id);
  }, [hasVoted, onSelect, player.id]);

  return (
    <button
      onClick={handleClick}
      disabled={hasVoted}
      className={`w-full p-4 text-lg rounded-xl text-left border-2 transition-all flex items-center gap-2 ${
        hasVoted ? 'opacity-70 cursor-not-allowed' : ''
      } ${isSelected ? selectedStyle : unselectedStyle}`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          votedPlayerIds.includes(player.id) ? 'bg-innocent' : 'bg-white/30'
        }`}
        title={votedPlayerIds.includes(player.id) ? 'Voted' : 'Waiting'}
      />
      <span className="text-xl flex-shrink-0">{player.avatar ?? '👤'}</span>
      {player.name}
    </button>
  );
});

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
  const activePlayers = useMemo(() => state.players.filter((p) => !ejectedPlayerIds.includes(p.id)), [state.players, ejectedPlayerIds]);
  const totalPlayers = activePlayers.length;
  const hasVoted = hasVotedOptimistic || (socketId ? votedPlayerIds.includes(socketId) : false);
  const voteCount = votedPlayerIds.length;
  const isReady = socketId ? readyPlayerIds.includes(socketId) : false;
  const readyCount = readyPlayerIds.length;
  const requiredReady = totalPlayers > 0 ? Math.floor(totalPlayers / 2) + 1 : 1;
  const others = useMemo(() => activePlayers.filter((p) => p.id !== socketId), [activePlayers, socketId]);
  const oneLeftToVote = totalPlayers > 1 && voteCount === totalPlayers - 1;
  const imposterCount = totalPlayers <= 5 ? 1 : (state.numberOfImposters ?? 1);
  const discussionTimeUp = state.discussionTimeUp ?? false;
  const discussionSec = state.timers?.discussion ?? 120;

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

  const handleVote = useCallback(() => {
    if (selectedId && !hasVotedOptimistic) {
      setHasVotedOptimistic(true);
      submitVote(selectedId);
    }
  }, [selectedId, hasVotedOptimistic, submitVote]);

  const handleSelectPlayer = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleSelectSkip = useCallback(() => {
    if (!hasVoted) setSelectedId(VOTE_SKIP);
  }, [hasVoted]);

  if (isEjected) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4 h-full pt-16">
        <DiscussionTimer fallbackSeconds={discussionSec} discussionTimeUp={discussionTimeUp} />
        {discussionTimeUp && <VotingTimer />}
        <div className="flex-1 min-w-0 max-w-lg flex flex-col gap-4 overflow-y-auto">
        <div className="screen-card p-6 animate-slide-up text-center">
          <h2 className="text-xl font-bold mb-2">You were ejected</h2>
          <p className="text-white/60 mb-4">You can only watch. Chat is still available.</p>
          <p className="text-imposter text-sm font-semibold mb-4">
            {imposterCount === 1 ? '1 Imposter' : `${imposterCount} Imposters`} in the game
          </p>
          <div className="space-y-2 mb-4 text-left">
            <p className="text-white/80 text-sm font-medium">Clues this round:</p>
            {clues.map((c) => {
              const avatar = state.players.find((p) => p.id === c.playerId)?.avatar ?? '👤';
              const isMe = c.playerId === socketId;
              return (
                <div
                  key={c.playerId}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-primary/15 border-2 border-primary/50 ring-1 ring-primary/40'
                      : 'bg-surface border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-2xl w-10 h-10 rounded-full border flex items-center justify-center ${getProfileStyle(c.playerId)}`}
                    >
                      {avatar}
                    </span>
                    <span className={`${isMe ? 'text-primary' : 'text-white/70'} text-sm font-semibold truncate`}>
                      {c.name}
                      {isMe && (
                        <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-primary/25 border border-primary/40 align-middle text-primary">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-white font-bold text-lg md:text-xl">{c.clue}</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>
        <aside className={`${discussionTimeUp ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 flex-shrink-0 flex-col min-h-0`}>
          <Chat frozen={discussionTimeUp} />
        </aside>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4 h-full pt-16">
      <DiscussionTimer fallbackSeconds={discussionSec} discussionTimeUp={discussionTimeUp} />
      {discussionTimeUp && <VotingTimer />}
      <div className="flex-1 min-w-0 max-w-lg flex flex-col gap-4 overflow-y-auto">
      {/* All clues on one screen */}
      <div className="screen-card p-4 animate-slide-up">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h2 className="text-lg font-bold">Everyone&apos;s clues</h2>
          <span className="text-imposter text-sm font-semibold">
            {imposterCount === 1 ? '1 Imposter' : `${imposterCount} Imposters`}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {clues.map((c) => {
            const avatar = state.players.find((p) => p.id === c.playerId)?.avatar ?? '👤';
            const isMe = c.playerId === socketId;
            return (
              <div
                key={c.playerId}
                className={`p-3 rounded-xl flex justify-between items-center gap-3 ${
                  isMe
                    ? 'bg-primary/15 border-2 border-primary/50 ring-1 ring-primary/40'
                    : 'bg-surface border border-white/10'
                }`}
              >
                <span className="text-white/80 font-medium flex items-center gap-2 min-w-0">
                  <span
                    className={`text-2xl w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${getProfileStyle(c.playerId)}`}
                  >
                    {avatar}
                  </span>
                  <span className={`${isMe ? 'text-primary' : 'text-white/80'} font-semibold truncate`}>
                    {c.name}
                    {isMe && (
                      <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-primary/25 border border-primary/40 align-middle text-primary">
                        You
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-white font-bold text-lg md:text-xl">{c.clue}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 flex-wrap gap-2">
          {!discussionTimeUp ? (
            <span className="text-white/60 text-sm">{readyCount}/{totalPlayers} ready to vote</span>
          ) : (
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
        {oneLeftToVote && hurryUpSeconds !== null && discussionTimeUp && (
          <p className="text-imposter font-mono text-sm font-bold mt-2">Hurry up! {hurryUpSeconds}s</p>
        )}
      </div>

      {/* Vote section - only after discussion time is up */}
      {discussionTimeUp && (
        <>
          <div className="text-center py-2 flex flex-col gap-1">
            <h2 className="text-2xl font-black text-imposter uppercase tracking-wider">Vote now</h2>
          </div>
          <div className="screen-card p-6 ring-2 ring-imposter">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-white/80 text-sm font-medium">Pick who to eject:</p>
              <VotingTimerSmall />
            </div>
            <div className="space-y-3">
              {others.map((p) => (
                <VoteButton
                  key={p.id}
                  player={p}
                  isSelected={selectedId === p.id}
                  hasVoted={hasVoted}
                  onSelect={handleSelectPlayer}
                  votedPlayerIds={votedPlayerIds}
                />
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={handleSelectSkip}
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
      </div>
      <aside className={`${discussionTimeUp ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 flex-shrink-0 flex-col min-h-0`}>
        <Chat frozen={discussionTimeUp} />
      </aside>
    </div>
  );
}
