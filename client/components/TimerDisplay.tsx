'use client';

import { useTimers } from '@/components/GameProvider';
import { DISCUSSION_PANIC_THRESHOLD } from '@/lib/constants';

interface DiscussionTimerProps {
  fallbackSeconds: number;
  discussionTimeUp: boolean;
}

export function DiscussionTimer({ fallbackSeconds, discussionTimeUp }: DiscussionTimerProps) {
  const { discussionSeconds } = useTimers();
  
  const displaySeconds = discussionSeconds !== null ? discussionSeconds : (discussionTimeUp ? 0 : fallbackSeconds);
  const panicMode = !discussionTimeUp && displaySeconds > 0 && displaySeconds <= DISCUSSION_PANIC_THRESHOLD;

  return (
    <span
      className={`text-sm font-mono font-bold tabular-nums ${
        panicMode ? 'text-red-400 animate-pulse' : 'text-white/60'
      }`}
    >
      {discussionTimeUp ? 'Discussion over — vote now!' : `${displaySeconds}s to discuss`}
    </span>
  );
}

export function VotingTimer() {
  const { votingSeconds } = useTimers();

  if (votingSeconds === null) return null;

  return (
    <p className="text-white/70 font-mono text-lg font-bold tabular-nums">
      {votingSeconds}s to vote
    </p>
  );
}

export function VotingTimerSmall() {
  const { votingSeconds } = useTimers();

  if (votingSeconds === null) return null;

  return (
    <span className="text-imposter font-mono text-sm font-bold tabular-nums">
      {votingSeconds}s left
    </span>
  );
}

export function usePanicMode(fallbackSeconds: number, discussionTimeUp: boolean): boolean {
  const { discussionSeconds } = useTimers();
  const displaySeconds = discussionSeconds !== null ? discussionSeconds : (discussionTimeUp ? 0 : fallbackSeconds);
  return !discussionTimeUp && displaySeconds > 0 && displaySeconds <= DISCUSSION_PANIC_THRESHOLD;
}

export function useDisplaySeconds(fallbackSeconds: number, discussionTimeUp: boolean): number {
  const { discussionSeconds } = useTimers();
  return discussionSeconds !== null ? discussionSeconds : (discussionTimeUp ? 0 : fallbackSeconds);
}
