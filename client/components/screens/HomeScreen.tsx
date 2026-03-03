'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/components/GameProvider';
import { QuitConfirmationModal } from '@/components/QuitConfirmationModal';
import { ToastContainer } from '@/components/Toast';
import { LobbyScreen } from './LobbyScreen';
import { RoleRevealScreen } from './RoleRevealScreen';
import { ClueInputScreen } from './ClueInputScreen';
import { DiscussionScreen } from './DiscussionScreen';
import { RoundResultsScreen } from './RoundResultsScreen';
import { ImposterLastChanceScreen } from './ImposterLastChanceScreen';
import { FinalLeaderboardScreen } from './FinalLeaderboardScreen';

export function HomeScreen() {
  const { inRoom, state, leaveRoom, toasts, dismissToast } = useGame();
  const router = useRouter();
  const [quitModalOpen, setQuitModalOpen] = useState(false);

  const handleQuitConfirm = () => {
    leaveRoom();
    router.push('/');
    setQuitModalOpen(false);
  };

  if (!inRoom) {
    return <CreateOrJoinScreen />;
  }

  const GameContent = () => {
    switch (state.phase) {
      case 'lobby':
        return <LobbyScreen />;
      case 'role_reveal':
        return <RoleRevealScreen />;
      case 'clue_input':
        return <ClueInputScreen />;
      case 'discussion':
        return <DiscussionScreen />;
      case 'round_results':
        return <RoundResultsScreen />;
      case 'imposter_last_chance':
        return <ImposterLastChanceScreen />;
      case 'final_leaderboard':
        return <FinalLeaderboardScreen />;
      default:
        return <LobbyScreen />;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setQuitModalOpen(true)}
        className="fixed top-4 right-4 z-40 py-2 px-4 rounded-lg text-sm font-medium bg-white/10 text-white/90 border border-white/20 hover:bg-white/15 transition-colors"
        aria-label="Quit game"
      >
        Quit
      </button>
      <QuitConfirmationModal
        isOpen={quitModalOpen}
        onClose={() => setQuitModalOpen(false)}
        onConfirm={handleQuitConfirm}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <GameContent />
    </>
  );
}

function CreateOrJoinScreen() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const { createRoom, joinRoom, error, clearError } = useGame();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      clearError();
      createRoom(name.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim().length === 4) {
      clearError();
      joinRoom(code.trim().toUpperCase(), name.trim());
    }
  };

  if (mode === 'select') {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">
          Guess the Imposter
        </h1>
        <p className="text-white/60 text-center text-sm mb-8">Social deduction • 3–8 players</p>
        <div className="screen-card p-4 mb-4 text-sm space-y-3">
          <div>
            <h3 className="text-white font-semibold mb-1">About the game</h3>
            <p className="text-white/75">
              A fast social deduction game where most players are Innocents and one or two are Imposters.
              Innocents know the secret word. Imposters only know the theme and must blend in.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Game rules</h3>
            <ul className="text-white/75 space-y-1 list-disc pl-5">
              <li>Each player gives one clue during clue phase.</li>
              <li>Discuss together, then vote who to eject.</li>
              <li>If votes tie or skip wins, no one gets ejected.</li>
              <li>Innocents win by finding all Imposters; Imposters win by surviving.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Point system</h3>
            <ul className="text-white/75 space-y-1 list-disc pl-5">
              <li>Innocent correct vote (on an Imposter): +200</li>
              <li>Trust bonus (0 votes against you): +50</li>
              <li>Imposter survives the round: +500</li>
              <li>Ejected Imposter correct last-chance guess: +150</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            className="btn-primary w-full py-4 text-lg"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className="btn-secondary w-full py-4 text-lg"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-in">
        <button
          onClick={() => { setMode('select'); clearError(); }}
          className="text-white/60 text-sm mb-4 hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-xl font-semibold mb-4">Create Room</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="input-field"
            autoFocus
          />
          {error && <p className="text-imposter text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full py-4" disabled={!name.trim()}>
            Create
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <button
        onClick={() => { setMode('select'); clearError(); }}
        className="text-white/60 text-sm mb-4 hover:text-white"
      >
        ← Back
      </button>
      <h2 className="text-xl font-semibold mb-4">Join Room</h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          className="input-field"
        />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="4-letter code"
          maxLength={4}
          className="input-field uppercase tracking-widest text-center"
        />
        {error && <p className="text-imposter text-sm">{error}</p>}
        <button
          type="submit"
          className="btn-primary w-full py-4"
          disabled={!name.trim() || code.length !== 4}
        >
          Join
        </button>
      </form>
    </div>
  );
}
