import { Server } from 'socket.io';
import { PHASE } from '../game/constants.js';
import {
  getRoomByPlayer,
  createRoomWithHost,
  joinRoom,
  leaveRoom,
} from '../game/GameManager.js';
import { EVENTS } from './events.js';

/** @type {Map<string, NodeJS.Timeout>} phase timeouts */
const phaseTimeouts = new Map();

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
  if (ejectedId && wasImposter) {
    advancePhase(room, PHASE.IMPOSTER_LAST_CHANCE, 2000);
    const lastChanceTimeout = setTimeout(() => {
      clearPhaseTimeout(code);
      finishRound(room, io);
    }, lastChanceSec);
    setPhaseTimeout(code, lastChanceTimeout);
    io.to(ejectedId).emit(EVENTS.IMPOSTER_LAST_CHANCE, {
      seconds: room.timers?.imposterLastChance ?? 10,
    });
  } else {
    setTimeout(() => finishRound(room, io), 5000);
  }
}

/**
 * Start debate phase: discussion + voting UI visible, single timer.
 * When all votes in, proceed immediately; otherwise wait for timer.
 */
function startDiscussionFlow(room, io) {
  const code = room.code;
  const discussionSec = (room.timers?.discussion ?? 120) * 1000;
  const votingSec = (room.timers?.voting ?? 30) * 1000;
  const totalSec = discussionSec + votingSec;

  advancePhase(room, PHASE.DISCUSSION, 0);
  const debateTimeout = setTimeout(() => {
    clearPhaseTimeout(code);
    if (room.phase !== PHASE.DISCUSSION) return;
    room.tallyVotes();
    room.awardPoints();
    proceedToRoundResults(room, io);
  }, totalSec);
  setPhaseTimeout(code, debateTimeout);
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

  advancePhase(room, PHASE.CLUE_INPUT, 5000);

  const startCluePhaseTimeout = setTimeout(() => {
    clearPhaseTimeout(code);
    if (room.phase !== PHASE.CLUE_INPUT) return;
    scheduleClueTurnOrDiscussion(room, io);
  }, 5000);
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
  io.to(code).emit(EVENTS.ROUND_RESULTS, {
    leaderboard: room.getLeaderboard().map((p) => ({ id: p.id, name: p.name, score: p.score })),
    roundData: room.roundData,
  });

  if (room.isGameOver()) {
    room.phase = PHASE.FINAL_LEADERBOARD;
    io.to(code).emit(EVENTS.GAME_OVER);
    io.to(code).emit(EVENTS.LEADERBOARD, room.getLeaderboard());
    clearPhaseTimeout(code);
    return;
  }

  // Next round after delay
  setTimeout(() => {
    room.startRound();
    runGameLoop(room, io);
  }, 8000);
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

      setTimeout(() => runGameLoop(room, io), 5000);
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

    socket.on(EVENTS.SUBMIT_VOTE, (data) => {
      const room = getRoomByPlayer(socket.id);
      if (!room || room.phase !== PHASE.DISCUSSION) return;
      const targetId = data?.targetId;
      if (!targetId) return;
      const ok = room.submitVote(socket.id, targetId);
      if (ok) {
        socket.emit(EVENTS.VOTE_SUBMITTED);
        if (room.allVotesIn()) {
          clearPhaseTimeout(room.code);
          room.tallyVotes();
          room.awardPoints();
          proceedToRoundResults(room, io);
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
