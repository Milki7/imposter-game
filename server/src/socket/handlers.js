import { Server } from 'socket.io';
import { PHASE, HURRY_UP_SECONDS, MAX_DEBATE_SECONDS, SKIP_DISCUSSION_SECONDS } from '../game/constants.js';
import {
  getRoomByPlayer,
  createRoomWithHost,
  joinRoom,
  leaveRoom,
} from '../game/GameManager.js';
import { EVENTS } from './events.js';

/** @type {Map<string, NodeJS.Timeout>} phase timeouts (e.g. fallback) */
const phaseTimeouts = new Map();

/** @type {Map<string, { tickInterval?: NodeJS.Timeout, votingTimeout?: NodeJS.Timeout }>} discussion-phase timers */
const discussionTimers = new Map();

/**
 * @param {string} roomCode
 * @param {NodeJS.Timeout} timeout
 */
function setPhaseTimeout(roomCode, timeout) {
  const existing = phaseTimeouts.get(roomCode);
  if (existing) clearTimeout(existing);
  phaseTimeouts.set(roomCode, timeout);
}

/**
 * @param {string} roomCode
 */
function clearPhaseTimeout(roomCode) {
  const t = phaseTimeouts.get(roomCode);
  if (t) clearTimeout(t);
  phaseTimeouts.delete(roomCode);
}

/**
 * @param {string} roomCode
 * @param {NodeJS.Timeout} [tickInterval]
 * @param {NodeJS.Timeout} [votingTimeout]
 */
function setDiscussionTimers(roomCode, tickInterval, votingTimeout) {
  const cur = discussionTimers.get(roomCode) || {};
  if (tickInterval != null) cur.tickInterval = tickInterval;
  if (votingTimeout != null) cur.votingTimeout = votingTimeout;
  discussionTimers.set(roomCode, cur);
}

/**
 * @param {string} roomCode
 */
function clearDiscussionTimers(roomCode) {
  const cur = discussionTimers.get(roomCode);
  if (!cur) return;
  if (cur.tickInterval) clearInterval(cur.tickInterval);
  if (cur.votingTimeout) clearTimeout(cur.votingTimeout);
  discussionTimers.delete(roomCode);
}

/**
 * @param {string} roomCode
 * @param {NodeJS.Timeout} timeout
 */
function setDiscussionVotingTimeout(roomCode, timeout) {
  const cur = discussionTimers.get(roomCode) || {};
  cur.votingTimeout = timeout;
  discussionTimers.set(roomCode, cur);
}

/**
 * @param {string} roomCode
 */
function clearDiscussionVotingTimeout(roomCode) {
  const cur = discussionTimers.get(roomCode);
  if (cur?.votingTimeout) {
    clearTimeout(cur.votingTimeout);
    cur.votingTimeout = undefined;
    discussionTimers.set(roomCode, cur);
  }
}

/**
 * @param {Room} room
 * @param {string} phase
 * @param {number} [delayMs]
 */
function advancePhase(room, phase, delayMs = 0) {
  room.phase = phase;
  const io = room._io;
  const code = room.code;
  if (!io) return;

  const emit = () => {
    room.getPlayerList().forEach((p) => {
      io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
    });
    io.to(code).emit(EVENTS.PHASE_CHANGED, { phase, roomCode: code });
  };

  if (delayMs > 0) {
    const t = setTimeout(emit, delayMs);
    setPhaseTimeout(code, t);
  } else {
    emit();
  }
}

/**
 * Proceed to round results after voting (from tally)
 * @param {Room} room
 * @param {Server} io
 */
function proceedToRoundResults(room, io) {
  const code = room.code;
  const lastChanceSec = (room.timers?.imposterLastChance ?? 10) * 1000;
  const { ejectedId, wasImposter } = room.roundData.voteResults;
  io.to(code).emit(EVENTS.VOTING_ENDED, { ejectedId, wasImposter });
  advancePhase(room, PHASE.ROUND_RESULTS, 0);

  if (room.shouldEndGameFromEjection()) {
    setTimeout(() => finishRound(room, io), 2000);
    return;
  }
  if (ejectedId && wasImposter) {
    setTimeout(() => {
      room.phase = PHASE.IMPOSTER_LAST_CHANCE;
      room.getPlayerList().forEach((p) => {
        io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
      });
      io.to(code).emit(EVENTS.PHASE_CHANGED, { phase: PHASE.IMPOSTER_LAST_CHANCE, roomCode: code });
      io.to(ejectedId).emit(EVENTS.IMPOSTER_LAST_CHANCE, {
        seconds: room.timers?.imposterLastChance ?? 10,
      });
      const lastChanceTimeout = setTimeout(() => {
        clearPhaseTimeout(code);
        finishRound(room, io);
      }, lastChanceSec);
      setPhaseTimeout(code, lastChanceTimeout);
    }, 1500);
  } else {
    setTimeout(() => finishRound(room, io), 2500);
  }
}

/**
 * Emit voters list to room and optionally start hurry-up if 1 left.
 * @param {Room} room
 * @param {Server} io
 */
function broadcastVotersAndMaybeHurryUp(room, io) {
  const code = room.code;
  const votedCount = Object.keys(room.roundData?.votes || {}).length;
  const totalPlayers = room.getActivePlayerList().length;
  const votedPlayerIds = Object.keys(room.roundData?.votes || {});

  io.to(code).emit(EVENTS.VOTERS_UPDATED, { votedPlayerIds });

  if (votedCount >= totalPlayers) return;
  const leftToVote = totalPlayers - votedCount;
  if (leftToVote === 1) {
    clearDiscussionVotingTimeout(code);
    const hurryUpTimeout = setTimeout(() => {
      clearDiscussionTimers(code);
      clearPhaseTimeout(code);
      if (room.phase !== PHASE.DISCUSSION) return;
      room.tallyVotes();
      room.awardPoints();
      proceedToRoundResults(room, io);
    }, HURRY_UP_SECONDS * 1000);
    setDiscussionVotingTimeout(code, hurryUpTimeout);
  }
}

/**
 * When majority clicked Ready: jump discussion to 3s, notify room, then 3s countdown to DISCUSSION_TIME_UP.
 * @param {Room} room
 * @param {Server} io
 */
function triggerDiscussionSkip(room, io) {
  const code = room.code;
  const votingSec = room.timers?.voting ?? 30;
  const votingMs = votingSec * 1000;

  const cur = discussionTimers.get(code);
  if (cur?.tickInterval) {
    clearInterval(cur.tickInterval);
    cur.tickInterval = undefined;
    discussionTimers.set(code, cur);
  }

  io.to(code).emit(EVENTS.DISCUSSION_SKIPPED, { secondsRemaining: SKIP_DISCUSSION_SECONDS });

  let remaining = SKIP_DISCUSSION_SECONDS;
  io.to(code).emit(EVENTS.DISCUSSION_TICK, { secondsRemaining: remaining });

  const skipInterval = setInterval(() => {
    if (room.phase !== PHASE.DISCUSSION) {
      clearInterval(skipInterval);
      return;
    }
    remaining--;
    if (remaining < 0) {
      clearInterval(skipInterval);
      setDiscussionTimers(code, undefined, undefined);
      io.to(code).emit(EVENTS.DISCUSSION_TIME_UP);
      const votingTimeout = setTimeout(() => {
        clearDiscussionTimers(code);
        clearPhaseTimeout(code);
        if (room.phase !== PHASE.DISCUSSION) return;
        room.tallyVotes();
        room.awardPoints();
        proceedToRoundResults(room, io);
      }, votingMs);
      setDiscussionVotingTimeout(code, votingTimeout);
      return;
    }
    io.to(code).emit(EVENTS.DISCUSSION_TICK, { secondsRemaining: remaining });
  }, 1000);
  setDiscussionTimers(code, skipInterval, undefined);
}

/**
 * Dynamic timer: discussion phase (talk + chat) then voting phase (VOTE NOW).
 * - Discussion: server emits DISCUSSION_TICK every second with secondsRemaining; at 0 emits DISCUSSION_TIME_UP.
 * - Voting: after DISCUSSION_TIME_UP, room has votingSec to submit votes; then force tally. All vote or hurry-up clears voting timeout.
 */
function startDiscussionFlow(room, io) {
  const code = room.code;
  const discussionSec = room.timers?.discussion ?? 120;
  const votingSec = room.timers?.voting ?? 30;
  const discussionMs = discussionSec * 1000;
  const votingMs = votingSec * 1000;
  const totalDebateMs = Math.min(MAX_DEBATE_SECONDS * 1000, discussionMs + votingMs);

  advancePhase(room, PHASE.DISCUSSION, 0);

  room.roundData.readyPlayerIds = [];

  const discussionEndsAt = Date.now() + discussionMs;

  const tickInterval = setInterval(() => {
    if (room.phase !== PHASE.DISCUSSION) {
      clearInterval(tickInterval);
      return;
    }
    const remaining = Math.max(0, Math.ceil((discussionEndsAt - Date.now()) / 1000));
    io.to(code).emit(EVENTS.DISCUSSION_TICK, { secondsRemaining: remaining });
    if (remaining <= 0) {
      clearInterval(tickInterval);
      setDiscussionTimers(code, undefined, undefined);
      io.to(code).emit(EVENTS.DISCUSSION_TIME_UP);
      const votingTimeout = setTimeout(() => {
        clearDiscussionTimers(code);
        clearPhaseTimeout(code);
        if (room.phase !== PHASE.DISCUSSION) return;
        room.tallyVotes();
        room.awardPoints();
        proceedToRoundResults(room, io);
      }, votingMs);
      setDiscussionVotingTimeout(code, votingTimeout);
    }
  }, 1000);
  setDiscussionTimers(code, tickInterval, undefined);

  const fallbackTimeout = setTimeout(() => {
    clearDiscussionTimers(code);
    clearPhaseTimeout(code);
    if (room.phase !== PHASE.DISCUSSION) return;
    room.tallyVotes();
    room.awardPoints();
    proceedToRoundResults(room, io);
  }, totalDebateMs);
  setPhaseTimeout(code, fallbackTimeout);
}

/**
 * Emit clue turn state and schedule next turn or start discussion
 * @param {Room} room
 * @param {Server} io
 */
function scheduleClueTurnOrDiscussion(room, io) {
  const code = room.code;
  const clueSec = (room.timers?.clueInput ?? 30) * 1000;

  if (room.allCluesIn()) {
    clearPhaseTimeout(code);
    startDiscussionFlow(room, io);
    return;
  }

  room.getPlayerList().forEach((p) => {
    io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
  });
  io.to(code).emit(EVENTS.PHASE_CHANGED, { phase: PHASE.CLUE_INPUT, roomCode: code });

  const clueTimeout = setTimeout(() => {
    clearPhaseTimeout(code);
    if (room.phase !== PHASE.CLUE_INPUT) return;
    room.skipClueTurn();
    scheduleClueTurnOrDiscussion(room, io);
  }, clueSec);
  setPhaseTimeout(code, clueTimeout);
}

/**
 * @param {Room} room
 * @param {Server} io
 */
function runGameLoop(room, io) {
  room._io = io;
  const code = room.code;

  advancePhase(room, PHASE.CLUE_INPUT, 3000);

  const startCluePhaseTimeout = setTimeout(() => {
    clearPhaseTimeout(code);
    if (room.phase !== PHASE.CLUE_INPUT) return;
    scheduleClueTurnOrDiscussion(room, io);
  }, 3000);
  setPhaseTimeout(code, startCluePhaseTimeout);
}

/**
 * @param {Room} room
 * @param {Server} io
 */
function finishRound(room, io) {
  const code = room.code;
  room.phase = PHASE.ROUND_RESULTS;
  room.getPlayerList().forEach((p) => {
    io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
  });
  io.to(code).emit(EVENTS.ROUND_RESULTS, { roundData: room.roundData });

  if (room.isGameOver()) {
    room.phase = PHASE.FINAL_LEADERBOARD;
    io.to(code).emit(EVENTS.GAME_OVER);
    io.to(code).emit(EVENTS.LEADERBOARD, room.getLeaderboard().map((p) => ({ id: p.id, name: p.name, score: p.score })));
    clearPhaseTimeout(code);
    return;
  }

  // Next round after short delay
  setTimeout(() => {
    room.startRound();
    runGameLoop(room, io);
  }, 2500);
}

/**
 * @param {Server} io
 */
export function registerSocketHandlers(io) {
  io.on(EVENTS.CONNECT, (socket) => {
    socket.on(EVENTS.CREATE_ROOM, (data) => {
      const { name } = data || {};
      if (!name?.trim()) {
        socket.emit(EVENTS.ROOM_ERROR, { message: 'Name required' });
        return;
      }
      const result = createRoomWithHost(socket.id, String(name).trim().slice(0, 20));
      if (!result.success) {
        socket.emit(EVENTS.ROOM_ERROR, { message: result.error || 'Could not create room' });
        return;
      }
      const room = result.room;
      socket.join(room.code);
      socket.emit(EVENTS.ROOM_CREATED, {
        code: room.code,
        state: room.getPublicState(socket.id),
      });
    });

    socket.on(EVENTS.JOIN_ROOM, (data) => {
      const { code, name } = data || {};
      if (!name?.trim() || !code?.trim()) {
        socket.emit(EVENTS.ROOM_ERROR, { message: 'Code and name required' });
        return;
      }
      const result = joinRoom(code.toUpperCase(), socket.id, String(name).trim().slice(0, 20));
      if (!result.success) {
        socket.emit(EVENTS.ROOM_ERROR, { message: result.error || 'Could not join' });
        return;
      }
      const room = result.room;
      socket.join(room.code);
      socket.emit(EVENTS.ROOM_JOINED, { state: room.getPublicState(socket.id) });
      socket.to(room.code).emit(EVENTS.PLAYER_JOINED, {
        player: { id: socket.id, name: String(name).trim(), score: 0, isHost: false },
      });
    });

    socket.on(EVENTS.UPDATE_SETTINGS, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room) return;
      const host = room.getHost();
      if (host?.id !== socket.id) return;
      if (data?.totalRounds != null && data.totalRounds >= 1 && data.totalRounds <= 10) {
        room.totalRounds = data.totalRounds;
      }
      if (data?.clueInput != null) room.timers.clueInput = Math.max(10, Math.min(120, data.clueInput));
      if (data?.discussion != null) room.timers.discussion = Math.max(30, Math.min(300, data.discussion));
      if (data?.voting != null) room.timers.voting = Math.max(15, Math.min(60, data.voting));
      if (data?.imposterLastChance != null) room.timers.imposterLastChance = Math.max(5, Math.min(30, data.imposterLastChance));
      io.to(room.code).emit(EVENTS.SETTINGS_UPDATED, {
        timers: room.timers,
        totalRounds: room.totalRounds,
      });
    });

    socket.on(EVENTS.START_GAME, () => {
      const room = getRoomByPlayer(socket.id);
      if (!room) return;
      const host = room.getHost();
      if (host?.id !== socket.id) return;
      if (room.playerCount < 3 || room.playerCount > 8) return;
      if (room.phase !== PHASE.LOBBY) return;

      room.startRound();
      room.phase = PHASE.ROLE_REVEAL;
      room.getPlayerList().forEach((p) => {
        io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
      });
      io.to(room.code).emit(EVENTS.GAME_STARTED);
      io.to(room.code).emit(EVENTS.PHASE_CHANGED, { phase: PHASE.ROLE_REVEAL, roomCode: room.code });

      setTimeout(() => runGameLoop(room, io), 3000);
    });

    socket.on(EVENTS.SUBMIT_CLUE, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.phase !== PHASE.CLUE_INPUT) return;
      const clue = data?.clue;
      if (!clue) return;
      const ok = room.submitClue(socket.id, clue);
      if (ok) {
        socket.emit(EVENTS.CLUE_SUBMITTED);
        if (room.allCluesIn()) {
          clearPhaseTimeout(room.code);
          if (room.phase === PHASE.CLUE_INPUT) {
            scheduleClueTurnOrDiscussion(room, io);
          }
        } else {
          scheduleClueTurnOrDiscussion(room, io);
        }
      }
    });

    socket.on(EVENTS.CHAT_MESSAGE, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room) return;
      const msg = data?.message;
      if (!msg?.trim()) return;
      const player = room.players.get(socket.id);
      if (!player) return;
      const entry = {
        playerId: socket.id,
        name: player.name,
        message: String(msg).trim().slice(0, 200),
        timestamp: Date.now(),
      };
      room.chatHistory.push(entry);
      io.to(room.code).emit(EVENTS.CHAT_MESSAGE, entry);
    });

    socket.on(EVENTS.DISCUSSION_READY, () => {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.phase !== PHASE.DISCUSSION) return;
      if (room.ejectedPlayerIds.has(socket.id)) return;
      const ready = room.roundData.readyPlayerIds || [];
      if (ready.includes(socket.id)) return;
      ready.push(socket.id);
      room.roundData.readyPlayerIds = ready;
      const activeCount = room.getActivePlayerList().length;
      const requiredReady = Math.floor(activeCount / 2) + 1;
      io.to(room.code).emit(EVENTS.READY_UPDATED, { readyPlayerIds: ready });
      if (ready.length >= requiredReady) {
        triggerDiscussionSkip(room, io);
      }
    });

    socket.on(EVENTS.SUBMIT_VOTE, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.phase !== PHASE.DISCUSSION) return;
      const targetId = data?.targetId;
      if (!targetId) return;
      const ok = room.submitVote(socket.id, targetId);
      if (ok) {
        socket.emit(EVENTS.VOTE_SUBMITTED);
        if (room.allVotesIn()) {
          clearDiscussionTimers(room.code);
          clearPhaseTimeout(room.code);
          room.tallyVotes();
          room.awardPoints();
          proceedToRoundResults(room, io);
        } else {
          broadcastVotersAndMaybeHurryUp(room, io);
        }
      }
    });

    socket.on(EVENTS.IMPOSTER_GUESS, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.phase !== PHASE.IMPOSTER_LAST_CHANCE) return;
      const guess = data?.guess;
      const correct = room.imposterGuessSecretWord(socket.id, guess ?? '');
      socket.emit(EVENTS.IMPOSTER_GUESS_RESULT, { correct });
    });

    socket.on(EVENTS.LEAVE_ROOM, () => {
      const room = getRoomByPlayer(socket.id);
      if (room) {
        const code = room.code;
        const player = room.players.get(socket.id);
        socket.leave(code);
        leaveRoom(socket.id);
        socket.emit(EVENTS.ROOM_LEFT);
        io.to(code).emit(EVENTS.PLAYER_LEFT, {
          playerId: socket.id,
          playerName: player?.name,
        });
      }
    });

    socket.on(EVENTS.RESTART_GAME, () => {
      const room = getRoomByPlayer(socket.id);
      if (!room) return;
      const host = room.getHost();
      if (host?.id !== socket.id) return;
      clearDiscussionTimers(room.code);
      clearPhaseTimeout(room.code);
      room.resetToLobby();
      room.getPlayerList().forEach((p) => {
        io.to(p.id).emit(EVENTS.GAME_STATE, room.getPublicState(p.id));
      });
      io.to(room.code).emit(EVENTS.GAME_RESTARTED);
      io.to(room.code).emit(EVENTS.PHASE_CHANGED, { phase: PHASE.LOBBY, roomCode: room.code });
    });

    socket.on(EVENTS.DISCONNECT, () => {
      const room = getRoomByPlayer(socket.id);
      if (room) {
        const player = room.players.get(socket.id);
        leaveRoom(socket.id);
        socket.to(room.code).emit(EVENTS.PLAYER_LEFT, {
          playerId: socket.id,
          playerName: player?.name,
        });
      }
    });
  });
}
