'use client';

import { useGame } from '@/components/GameProvider';
import { Chat } from '@/components/Chat';

export function DiscussionScreen() {
  const { state } = useGame();
  const clues = state.roundData?.clues ?? [];
  const timer = state.timers?.discussion ?? 120;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4 h-full">
      <div className="screen-card p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Discussion</h2>
        <p className="text-white/60 text-sm mb-4">
          Timer: {timer}s — Chat and debate who might be the Imposter!
        </p>
        <div className="space-y-2 mb-4">
          <p className="text-white/80 text-sm font-medium">Clues given:</p>
          {clues.map((c) => (
            <div key={c.playerId} className="p-2 rounded-lg bg-white/5 text-sm">
              <span className="text-white/60">{c.name}:</span>{' '}
              <span className="text-white">{c.clue}</span>
            </div>
          ))}
        </div>
      </div>
      <Chat />
    </div>
  );
}
