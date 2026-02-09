'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { LobbyScreen } from './LobbyScreen';
import { RoleRevealScreen } from './RoleRevealScreen';
import { ClueInputScreen } from './ClueInputScreen';
import { DiscussionScreen } from './DiscussionScreen';
import { VotingScreen } from './VotingScreen';
import { RoundResultsScreen } from './RoundResultsScreen';
import { ImposterLastChanceScreen } from './ImposterLastChanceScreen';
import { FinalLeaderboardScreen } from './FinalLeaderboardScreen';

export function HomeScreen() {
  const { inRoom, state } = useGame();

  if (!inRoom) {
    return <CreateOrJoinScreen />;
  }

  switch (state.phase) {
    case 'lobby':
      return <LobbyScreen />;
    case 'role_reveal':
      return <RoleRevealScreen />;
    case 'clue_input':
      return <ClueInputScreen />;
    case 'discussion':
    case 'voting':
      return state.phase === 'voting' ? <VotingScreen /> : <DiscussionScreen />;
    case 'round_results':
      return <RoundResultsScreen />;
    case 'imposter_last_chance':
      return <ImposterLastChanceScreen />;
    case 'final_leaderboard':
      return <FinalLeaderboardScreen />;
    default:
      return <LobbyScreen />;
  }
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
