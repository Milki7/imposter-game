'use client';

import { useTimers } from '@/components/GameProvider';
import { DISCUSSION_PANIC_THRESHOLD } from '@/lib/constants';

interface DiscussionTimerProps {
  fallbackSeconds: number;
  discussionTimeUp: boolean;
}

export function DiscussionTimer({ fallbackSeconds, discussionTimeUp }: DiscussionTimerProps) {
  const { discussionSeconds } = useTimers();
  
  if (discussionTimeUp) {
    return null;
  }

  const displaySeconds = discussionSeconds !== null ? discussionSeconds : fallbackSeconds;
  const panicMode = displaySeconds > 0 && displaySeconds <= DISCUSSION_PANIC_THRESHOLD;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <span
        className={`text-2xl sm:text-3xl font-sans font-bold tabular-nums px-5 sm:px-8 py-2.5 sm:py-3 rounded-full border backdrop-blur-md transition-colors ${
          panicMode
            ? 'text-red-400 border-red-500/50 bg-red-950/40 shadow-glow-imposter animate-pulse'
            : 'text-innocent border-innocent/30 bg-black/40 shadow-glow-innocent'
        }`}
      >
        {displaySeconds}s
      </span>
    </div>
  );
}

export function VotingTimer() {
  const { votingSeconds } = useTimers();

  if (votingSeconds === null) return null;

  const panicMode = votingSeconds > 0 && votingSeconds <= DISCUSSION_PANIC_THRESHOLD;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <span
        className={`text-2xl sm:text-3xl font-sans font-bold tabular-nums px-5 sm:px-8 py-2.5 sm:py-3 rounded-full border backdrop-blur-md transition-colors ${
          panicMode
            ? 'text-red-400 border-red-500/50 bg-red-950/40 shadow-glow-imposter animate-pulse'
            : 'text-imposter border-imposter/30 bg-black/40 shadow-glow-imposter'
        }`}
      >
        {votingSeconds}s
      </span>
    </div>
  );
}

export function VotingTimerSmall() {
  const { votingSeconds } = useTimers();

  if (votingSeconds === null) return null;

  return (
    <span className="text-imposter font-sans text-sm font-bold tabular-nums">
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
