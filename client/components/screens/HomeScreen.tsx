'use client';

import { useRef, useState } from 'react';
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

  let gameContent: React.ReactNode;
  if (!inRoom) {
    gameContent = <CreateOrJoinScreen />;
  } else {
    switch (state.phase) {
      case 'lobby':
        gameContent = <LobbyScreen />;
        break;
      case 'role_reveal':
        gameContent = <RoleRevealScreen />;
        break;
      case 'clue_input':
        gameContent = <ClueInputScreen />;
        break;
      case 'discussion':
        gameContent = <DiscussionScreen />;
        break;
      case 'round_results':
        gameContent = <RoundResultsScreen />;
        break;
      case 'imposter_last_chance':
        gameContent = <ImposterLastChanceScreen />;
        break;
      case 'final_leaderboard':
        gameContent = <FinalLeaderboardScreen />;
        break;
      default:
        gameContent = <LobbyScreen />;
    }
  }

  return (
    <>
      {inRoom && (
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
        </>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {gameContent}
    </>
  );
}

function CreateOrJoinScreen() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { createRoom, joinRoom, error, clearError } = useGame();
  const topSectionRef = useRef<HTMLElement | null>(null);
  const aboutSectionRef = useRef<HTMLDivElement | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    setValidationError(null);
    clearError();
    createRoom(name.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    if (!code.trim()) {
      setValidationError('Please add the code.');
      return;
    }
    if (code.trim().length !== 4) {
      setValidationError('Code must be 4 letters.');
      return;
    }
    setValidationError(null);
    clearError();
    joinRoom(code.trim().toUpperCase(), name.trim());
  };

  if (mode === 'select') {
    return (
      <div className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory animate-fade-in">
        <section ref={topSectionRef} className="min-h-full flex flex-col justify-center snap-start">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">
              Guess the Imposter
            </h1>
            <p className="text-white/60 text-center text-sm mb-8">Social deduction • 3–8 players</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setMode('create');
                }}
                className="btn-primary w-full py-4 text-lg"
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setMode('join');
                }}
                className="btn-secondary w-full py-4 text-lg"
              >
                Join Room
              </button>
            </div>
            <button
              type="button"
              onClick={() => aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-6 mx-auto w-12 h-12 rounded-full border border-white/20 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Go to about section"
              title="Go to about section"
            >
              <span aria-hidden="true" className="text-2xl leading-none">⌄</span>
            </button>
          </div>
        </section>
        <section ref={aboutSectionRef} className="min-h-full flex items-center snap-start py-6">
          <div className="w-full max-w-sm mx-auto">
            <div className="screen-card p-4 text-sm space-y-3 w-full">
              <div>
                <h3 className="text-white font-semibold mb-1">About the game</h3>
                <p className="text-white/75">
                  Guess the Imposter is a fast social deduction game for 3-8 players. Most players are
                  Innocents who know the secret word, while 1-2 Imposters only see the theme and try to
                  blend in without being caught.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Game rules</h3>
                <ul className="text-white/75 space-y-1 list-disc pl-5">
                  <li>Clue phase: each active player gives one short clue.</li>
                  <li>Discussion phase: compare clues and look for suspicious answers.</li>
                  <li>Voting phase: vote to eject, or choose to skip.</li>
                  <li>Tie/skip result: no one is ejected that round.</li>
                  <li>Innocents win by eliminating all Imposters; Imposters win by surviving rounds.</li>
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
            <button
              type="button"
              onClick={() => topSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-6 self-center w-12 h-12 rounded-full border border-white/20 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors mx-auto"
              aria-label="Go to top section"
              title="Go to top section"
            >
              <span aria-hidden="true" className="text-2xl leading-none">⌃</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-in">
        <button
          type="button"
          onClick={() => { setMode('select'); clearError(); setValidationError(null); }}
          className="text-white/60 text-sm mb-4 hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-xl font-semibold mb-4">Create Room</h2>
        <form noValidate onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Your name"
            maxLength={20}
            className="input-field"
            autoFocus
          />
          {validationError && <p className="text-yellow-300 text-sm">{validationError}</p>}
          {error && <p className="text-imposter text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full py-4">
            Create
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <button
        type="button"
        onClick={() => { setMode('select'); clearError(); setValidationError(null); }}
        className="text-white/60 text-sm mb-4 hover:text-white"
      >
        ← Back
      </button>
      <h2 className="text-xl font-semibold mb-4">Join Room</h2>
      <form noValidate onSubmit={handleJoin} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Your name"
          maxLength={20}
          className="input-field"
        />
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 4));
            if (validationError) setValidationError(null);
          }}
          placeholder="4-letter code"
          maxLength={4}
          className="input-field uppercase tracking-widest text-center"
        />
        {validationError && <p className="text-yellow-300 text-sm">{validationError}</p>}
        {error && <p className="text-imposter text-sm">{error}</p>}
        <button
          type="submit"
          className="btn-primary w-full py-4"
        >
          Join
        </button>
      </form>
    </div>
  );
}
