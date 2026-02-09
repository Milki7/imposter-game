import { Room } from './Room.js';
import { PHASE } from './constants.js';

/** @type {Map<string, Room>} */
const rooms = new Map();

/** @type {Map<string, string>} socketId -> roomCode */
const playerRooms = new Map();

/**
 * @param {string} code
 * @returns {Room|null}
 */
export function getRoom(code) {
  return rooms.get(code?.toUpperCase()) ?? null;
}

/**
 * @param {string} socketId
 * @returns {Room|null}
 */
export function getRoomByPlayer(socketId) {
  const code = playerRooms.get(socketId);
  return code ? getRoom(code) : null;
}

/**
 * @returns {Room}
 */
export function createRoom() {
  let room;
  let attempts = 0;
  do {
    room = new Room();
    if (!rooms.has(room.code)) {
      rooms.set(room.code, room);
      return room;
    }
    attempts++;
  } while (attempts < 20);
  room.code = `R${Date.now().toString(36).slice(-3).toUpperCase()}`;
  rooms.set(room.code, room);
  return room;
}

/**
 * Create room and add host
 * @param {string} socketId
 * @param {string} name
 * @returns {{ success: boolean, room?: Room, error?: string }}
 */
export function createRoomWithHost(socketId, name) {
  const room = createRoom();
  const added = room.addPlayer(socketId, name, true);
  if (!added) return { success: false, error: 'Could not create room' };
  playerRooms.set(socketId, room.code);
  return { success: true, room };
}

/**
 * @param {string} code
 * @param {string} socketId
 * @param {string} name
 * @returns {{ success: boolean, room?: Room, error?: string }}
 */
export function joinRoom(code, socketId, name) {
  const room = getRoom(code);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.phase !== PHASE.LOBBY) return { success: false, error: 'Game already started' };
  if (room.playerCount >= 8) return { success: false, error: 'Room is full' };
  if (room.playerCount < 2 && room.getPlayerList().some((p) => p.name === name)) {
    return { success: false, error: 'Name taken' };
  }

  const isHost = room.playerCount === 0;
  const added = room.addPlayer(socketId, name, isHost);
  if (!added) return { success: false, error: 'Could not join' };

  playerRooms.set(socketId, room.code);
  return { success: true, room };
}

/**
 * @param {string} socketId
 */
export function leaveRoom(socketId) {
  const room = getRoomByPlayer(socketId);
  if (room) {
    room.removePlayer(socketId);
    playerRooms.delete(socketId);
    if (room.playerCount === 0) {
      rooms.delete(room.code);
    }
  }
}

/**
 * @param {string} code
 * @returns {boolean}
 */
export function roomExists(code) {
  return rooms.has(code?.toUpperCase());
}

export { rooms };
