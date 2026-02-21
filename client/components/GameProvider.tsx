'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';
import { getSocket } from '@/lib/socket';
import { EVENTS } from '@/lib/events';
import { ToastMessage } from './Toast';

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
  /** Why the game ended, e.g. 'imposter_fled' when last imposter disconnected */
  gameEndReason?: string;
  /** Updated vote requirements when player count changes */
  voteRequirements?: {
    requiredVotes: number;
    currentVotes: number;
    activePlayerCount: number;
  };
}

type ChatMessage = { playerId: string | null; name: string | null; message: string; timestamp: number; system?: boolean };

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
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

interface TimerContextValue {
  discussionSeconds: number | null;
  votingSeconds: number | null;
}

interface ChatContextValue {
  chatHistory: ChatMessage[];
  players: Player[];
}

const initialState: GameState = {
  phase: 'lobby',
  players: [],
  chatHistory: [],
};

const GameContext = createContext<GameContextValue | null>(null);
const TimerContext = createContext<TimerContextValue>({ discussionSeconds: null, votingSeconds: null });
const ChatContext = createContext<ChatContextValue>({ chatHistory: [], players: [] });

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imposterGuessResult, setImposterGuessResult] = useState<boolean | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [discussionSeconds, setDiscussionSeconds] = useState<number | null>(null);
  const [votingSeconds, setVotingSeconds] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [socket] = useState(() => getSocket());
  const toastsRef = useRef(setToasts);
  toastsRef.current = setToasts;

  const addToast = useCallback((message: string, type: ToastMessage['type'], avatar?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    toastsRef.current((prev) => [...prev, { id, message, type, avatar }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    socket.on(EVENTS.CONNECT, () => setSocketId(socket.id ?? null));
    socket.on(EVENTS.DISCONNECT, () => setSocketId(null));

    socket.on(EVENTS.ROOM_CREATED, (data: { code: string; state: GameState }) => {
      const { chatHistory: newChatHistory, ...restState } = data.state;
      setState({ ...restState, chatHistory: [] });
      setChatHistory(newChatHistory || []);
      setInRoom(true);
      setError(null);
    });

    socket.on(EVENTS.ROOM_JOINED, (data: { state: GameState }) => {
      const { chatHistory: newChatHistory, ...restState } = data.state;
      setState({ ...restState, chatHistory: [] });
      setChatHistory(newChatHistory || []);
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
      setDiscussionSeconds(null);
      setVotingSeconds(null);
      setState((s) => ({
        ...s,
        phase: data.phase,
        discussionTimeUp: false,
      }));
      if (data.phase === 'imposter_last_chance') {
        setImposterGuessResult(null);
      }
    });

    socket.on(EVENTS.DISCUSSION_TICK, (data: { secondsRemaining: number }) => {
      setDiscussionSeconds(data.secondsRemaining);
    });

    socket.on(EVENTS.DISCUSSION_TIME_UP, () => {
      setDiscussionSeconds(0);
      setState((s) =>
        s.phase === 'discussion'
          ? { ...s, discussionTimeUp: true }
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
      setDiscussionSeconds(data.secondsRemaining);
    });

    socket.on(EVENTS.VOTING_TICK, (data: { secondsRemaining: number }) => {
      setVotingSeconds(data.secondsRemaining);
    });

    socket.on(EVENTS.GAME_STATE, (newState: GameState) => {
      const { chatHistory: newChatHistory, ...restState } = newState;
      setState({ ...restState, chatHistory: [] });
      if (newChatHistory) {
        setChatHistory(newChatHistory);
      }
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

    socket.on(EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev, msg]);
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

    socket.on(EVENTS.LEADERBOARD, (data: { leaderboard?: GameState['leaderboard']; finalWord?: string; finalImposterName?: string; finalImposterNames?: string[]; gameEndReason?: string }) => {
      setState((s) => ({
        ...s,
        leaderboard: data?.leaderboard ?? s.leaderboard,
        finalWord: data?.finalWord,
        finalImposterName: data?.finalImposterName,
        finalImposterNames: data?.finalImposterNames,
        gameEndReason: data?.gameEndReason,
        phase: 'final_leaderboard',
      }));
    });

    socket.on(EVENTS.ROOM_LEFT, () => {
      setState(initialState);
      setChatHistory([]);
      setInRoom(false);
      setImposterGuessResult(null);
    });

    socket.on(EVENTS.GAME_RESTARTED, () => {});

    socket.on(EVENTS.IMPOSTER_GUESS_RESULT, (data: { correct?: boolean }) => {
      setImposterGuessResult(data?.correct ?? false);
    });

    socket.on(EVENTS.PLAYER_EXIT, (data: { playerName: string; playerAvatar?: string; reason: 'quit' | 'disconnect' }) => {
      const action = data.reason === 'quit' ? 'left the game' : 'disconnected';
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      toastsRef.current((prev) => [...prev, { id, message: `${data.playerName} ${action}`, type: 'warning' as const, avatar: data.playerAvatar }]);
    });

    socket.on(EVENTS.VOTE_REQUIREMENTS_UPDATED, (data: { requiredVotes: number; currentVotes: number; activePlayerCount: number }) => {
      setState((s) => ({
        ...s,
        voteRequirements: {
          requiredVotes: data.requiredVotes,
          currentVotes: data.currentVotes,
          activePlayerCount: data.activePlayerCount,
        },
      }));
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
      socket.off(EVENTS.PLAYER_EXIT);
      socket.off(EVENTS.VOTE_REQUIREMENTS_UPDATED);
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

  const value: GameContextValue = useMemo(() => ({
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
    toasts,
    dismissToast,
  }), [
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
    toasts,
    dismissToast,
  ]);

  const timerValue: TimerContextValue = useMemo(() => ({
    discussionSeconds,
    votingSeconds,
  }), [discussionSeconds, votingSeconds]);

  const chatValue: ChatContextValue = useMemo(() => ({
    chatHistory,
    players: state.players,
  }), [chatHistory, state.players]);

  return (
    <GameContext.Provider value={value}>
      <TimerContext.Provider value={timerValue}>
        <ChatContext.Provider value={chatValue}>
          {children}
        </ChatContext.Provider>
      </TimerContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function useTimers() {
  return useContext(TimerContext);
}

export function useChat() {
  return useContext(ChatContext);
}
