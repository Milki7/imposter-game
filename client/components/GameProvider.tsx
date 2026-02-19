'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getSocket } from '@/lib/socket';
import { EVENTS } from '@/lib/events';

export type Phase =
  | 'lobby'
  | 'role_reveal'
  | 'clue_input'
  | 'discussion'
  | 'voting'
  | 'round_results'
  | 'imposter_last_chance'
  | 'final_leaderboard';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
  role?: 'innocent' | 'imposter';
  secretWord?: string;
  theme?: string;
  clue?: string;
  voteCount?: number;
  /** Animal emoji avatar assigned on join */
  avatar?: string;
}

export interface GameState {
  code?: string;
  phase: Phase;
  currentRound?: number;
  totalRounds?: number;
  players: Player[];
  hostId?: string;
  roundData?: {
    theme?: string;
    clues?: { playerId: string; name: string; clue: string }[];
    votedPlayerIds?: string[];
    readyPlayerIds?: string[];
    voteResults?: {
      ejectedId?: string | null;
      ejectedName?: string | null;
      wasImposter?: boolean;
      skipVotes?: number;
      skipped?: boolean;
    };
  };
  currentCluePlayerId?: string;
  currentCluePlayerName?: string;
  chatHistory: { playerId: string | null; name: string | null; message: string; timestamp: number; system?: boolean }[];
  timers?: { clueInput?: number; discussion?: number; voting?: number };
  /** 1 or 2 imposters when 6+ players (host choice); 3-5 players always use 1 */
  numberOfImposters?: 1 | 2;
  leaderboard?: { id: string; name: string; score: number; avatar?: string }[];
  /** Last round secret word (revealed on final leaderboard) */
  finalWord?: string;
  /** Last round imposter display name (revealed on final leaderboard) */
  finalImposterName?: string;
  /** Last round imposter names (one or two) for final leaderboard */
  finalImposterNames?: string[];
  ejectedPlayerIds?: string[];
  discussionTimeUp?: boolean;
  /** Server-authoritative discussion countdown (seconds left); null when not in discussion or after time up */
  discussionSecondsRemaining?: number | null;
  /** Server-authoritative voting phase countdown (seconds left); null when not in voting phase */
  votingSecondsRemaining?: number | null;
}

interface GameContextValue {
  state: GameState;
  socketId: string | null;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  startGame: () => void;
  submitClue: (clue: string) => void;
  sendChatMessage: (message: string) => void;
  submitVote: (targetId: string) => void;
  submitDiscussionReady: () => void;
  imposterGuess: (guess: string) => void;
  updateSettings: (settings: Partial<GameState['timers'] & { totalRounds?: number; imposters?: 1 | 2 }>) => void;
  leaveRoom: () => void;
  restartGame: () => void;
  inRoom: boolean;
  error: string | null;
  clearError: () => void;
  imposterGuessResult: boolean | null;
}

const initialState: GameState = {
  phase: 'lobby',
  players: [],
  chatHistory: [],
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imposterGuessResult, setImposterGuessResult] = useState<boolean | null>(null);
  const [socket] = useState(() => getSocket());

  useEffect(() => {
    socket.on(EVENTS.CONNECT, () => setSocketId(socket.id ?? null));
    socket.on(EVENTS.DISCONNECT, () => setSocketId(null));

    socket.on(EVENTS.ROOM_CREATED, (data: { code: string; state: GameState }) => {
      setState(data.state);
      setInRoom(true);
      setError(null);
    });

    socket.on(EVENTS.ROOM_JOINED, (data: { state: GameState }) => {
      setState(data.state);
      setInRoom(true);
      setError(null);
    });

    socket.on(EVENTS.ROOM_ERROR, (data: { message?: string }) => {
      setError(data?.message ?? 'Something went wrong');
    });

    socket.on(EVENTS.PLAYER_JOINED, (data: { player: Player }) => {
      setState((s) => ({
        ...s,
        players: [...s.players, data.player],
      }));
    });

    socket.on(EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      setState((s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== data.playerId),
      }));
    });

    socket.on(EVENTS.SETTINGS_UPDATED, (data: { timers?: GameState['timers']; totalRounds?: number; numberOfImposters?: 1 | 2 }) => {
      setState((s) => ({
        ...s,
        timers: data?.timers ?? s.timers,
        totalRounds: data?.totalRounds ?? s.totalRounds,
        numberOfImposters: data?.numberOfImposters ?? s.numberOfImposters,
      }));
    });

    socket.on(EVENTS.GAME_STARTED, () => {});

    socket.on(EVENTS.PHASE_CHANGED, (data: { phase: Phase }) => {
      setState((s) => ({
        ...s,
        phase: data.phase,
        discussionTimeUp: false,
        discussionSecondsRemaining: null,
        votingSecondsRemaining: null,
      }));
      if (data.phase === 'imposter_last_chance') {
        setImposterGuessResult(null);
      }
    });

    socket.on(EVENTS.DISCUSSION_TICK, (data: { secondsRemaining: number }) => {
      setState((s) =>
        s.phase === 'discussion' ? { ...s, discussionSecondsRemaining: data.secondsRemaining } : s
      );
    });

    socket.on(EVENTS.DISCUSSION_TIME_UP, () => {
      setState((s) =>
        s.phase === 'discussion'
          ? { ...s, discussionTimeUp: true, discussionSecondsRemaining: 0 }
          : s
      );
    });

    socket.on(EVENTS.READY_UPDATED, (data: { readyPlayerIds: string[] }) => {
      setState((s) =>
        s.phase === 'discussion' && s.roundData
          ? { ...s, roundData: { ...s.roundData, readyPlayerIds: data.readyPlayerIds } }
          : s
      );
    });

    socket.on(EVENTS.DISCUSSION_SKIPPED, (data: { secondsRemaining: number }) => {
      setState((s) =>
        s.phase === 'discussion'
          ? { ...s, discussionSecondsRemaining: data.secondsRemaining }
          : s
      );
    });

    socket.on(EVENTS.VOTING_TICK, (data: { secondsRemaining: number }) => {
      setState((s) =>
        s.phase === 'discussion' ? { ...s, votingSecondsRemaining: data.secondsRemaining } : s
      );
    });

    socket.on(EVENTS.GAME_STATE, (newState: GameState) => {
      setState(newState);
    });

    socket.on(EVENTS.VOTERS_UPDATED, (data: { votedPlayerIds: string[] }) => {
      setState((s) => ({
        ...s,
        roundData: {
          ...s.roundData,
          votedPlayerIds: data?.votedPlayerIds ?? [],
        },
      }));
    });

    socket.on(EVENTS.CHAT_MESSAGE, (msg: { playerId: string | null; name: string | null; message: string; timestamp: number; system?: boolean }) => {
      setState((s) => ({
        ...s,
        chatHistory: [...s.chatHistory, msg],
      }));
    });

    socket.on(EVENTS.ROUND_RESULTS, (data: { leaderboard?: GameState['leaderboard']; roundData?: GameState['roundData'] }) => {
      setState((s) => ({
        ...s,
        leaderboard: data.leaderboard ?? s.leaderboard,
        roundData: data.roundData ?? s.roundData,
      }));
    });

    socket.on(EVENTS.GAME_OVER, () => {
      setState((s) => ({ ...s, phase: 'final_leaderboard' }));
    });

    socket.on(EVENTS.LEADERBOARD, (data: { leaderboard?: GameState['leaderboard']; finalWord?: string; finalImposterName?: string; finalImposterNames?: string[] }) => {
      setState((s) => ({
        ...s,
        leaderboard: data?.leaderboard ?? s.leaderboard,
        finalWord: data?.finalWord,
        finalImposterName: data?.finalImposterName,
        finalImposterNames: data?.finalImposterNames,
        phase: 'final_leaderboard',
      }));
    });

    socket.on(EVENTS.ROOM_LEFT, () => {
      setState(initialState);
      setInRoom(false);
      setImposterGuessResult(null);
    });

    socket.on(EVENTS.GAME_RESTARTED, () => {});

    socket.on(EVENTS.IMPOSTER_GUESS_RESULT, (data: { correct?: boolean }) => {
      setImposterGuessResult(data?.correct ?? false);
    });

    return () => {
      socket.off(EVENTS.CONNECT);
      socket.off(EVENTS.DISCONNECT);
      socket.off(EVENTS.ROOM_CREATED);
      socket.off(EVENTS.ROOM_JOINED);
      socket.off(EVENTS.ROOM_ERROR);
      socket.off(EVENTS.PLAYER_JOINED);
      socket.off(EVENTS.PLAYER_LEFT);
      socket.off(EVENTS.SETTINGS_UPDATED);
      socket.off(EVENTS.GAME_STARTED);
      socket.off(EVENTS.PHASE_CHANGED);
      socket.off(EVENTS.DISCUSSION_TICK);
      socket.off(EVENTS.DISCUSSION_TIME_UP);
      socket.off(EVENTS.READY_UPDATED);
      socket.off(EVENTS.DISCUSSION_SKIPPED);
      socket.off(EVENTS.VOTING_TICK);
      socket.off(EVENTS.GAME_STATE);
      socket.off(EVENTS.VOTERS_UPDATED);
      socket.off(EVENTS.CHAT_MESSAGE);
      socket.off(EVENTS.ROUND_RESULTS);
      socket.off(EVENTS.GAME_OVER);
      socket.off(EVENTS.LEADERBOARD);
      socket.off(EVENTS.ROOM_LEFT);
      socket.off(EVENTS.GAME_RESTARTED);
      socket.off(EVENTS.IMPOSTER_GUESS_RESULT);
    };
  }, [socket]);

  const createRoom = useCallback(
    (name: string) => {
      socket.emit(EVENTS.CREATE_ROOM, { name });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (code: string, name: string) => {
      socket.emit(EVENTS.JOIN_ROOM, { code: code.toUpperCase(), name });
    },
    [socket]
  );

  const startGame = useCallback(() => {
    socket.emit(EVENTS.START_GAME);
  }, [socket]);

  const submitClue = useCallback(
    (clue: string) => {
      socket.emit(EVENTS.SUBMIT_CLUE, { clue });
    },
    [socket]
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      socket.emit(EVENTS.CHAT_MESSAGE, { message });
    },
    [socket]
  );

  const submitVote = useCallback(
    (targetId: string) => {
      socket.emit(EVENTS.SUBMIT_VOTE, { targetId });
    },
    [socket]
  );

  const submitDiscussionReady = useCallback(() => {
    socket.emit(EVENTS.DISCUSSION_READY);
  }, [socket]);

  const imposterGuess = useCallback(
    (guess: string) => {
      socket.emit(EVENTS.IMPOSTER_GUESS, { guess });
    },
    [socket]
  );

  const updateSettings = useCallback(
    (settings: Partial<GameState['timers'] & { totalRounds?: number; imposters?: 1 | 2 }>) => {
      socket.emit(EVENTS.UPDATE_SETTINGS, settings);
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    socket.emit(EVENTS.PLAYER_QUIT);
  }, [socket]);

  const restartGame = useCallback(() => {
    socket.emit(EVENTS.RESTART_GAME);
  }, [socket]);

  const clearError = useCallback(() => setError(null), []);

  const value: GameContextValue = {
    state,
    socketId,
    createRoom,
    joinRoom,
    startGame,
    submitClue,
    sendChatMessage,
    submitVote,
    submitDiscussionReady,
    imposterGuess,
    updateSettings,
    leaveRoom,
    restartGame,
    inRoom,
    error,
    clearError,
    imposterGuessResult,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
