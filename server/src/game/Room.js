import { PHASE, POINTS, VOTE_SKIP, DEFAULT_TIMERS, ROUND_WORDS, generateRoomCode, ANIMAL_AVATARS } from './constants.js';

/**
 * @typedef {Object} Player
 * @property {string} id - Socket ID
 * @property {string} name - Display name
 * @property {'innocent' | 'imposter'} role
 * @property {number} score
 * @property {boolean} isHost
 * @property {string} [secretWord] - Innocent only
 * @property {string} [theme] - Imposter only
 * @property {string} [clue] - Submitted clue for current round
 * @property {string} [voteTargetId] - Who they voted for
 * @property {number} voteCount - Votes received this round
 */

export class Room {
  /** @type {string} */
  code;

  /** @type {Map<string, Player>} */
  players = new Map();

  /** @type {string} */
  hostId;

  /** @type {string} */
  phase = PHASE.LOBBY;

  /** @type {number} */
  currentRound = 0;

  /** @type {number} */
  totalRounds = 5;

  /** @type {Object} */
  roundData = null;

  /** @type {string[]} Order of player IDs for turn-based clue entry */
  clueTurnOrder = [];

  /** @type {number} Index of current player in clue turn */
  clueTurnIndex = 0;

  /** @type {Object} */
  timers = { ...DEFAULT_TIMERS };

  /** @type {number|null} */
  phaseTimeout = null;

  /** @type {Array<{playerId: string, name: string, message: string, timestamp: number}>} */
  chatHistory = [];

  /** @type {Set<number>} */
  usedRoundIndices = new Set();

  /** @type {Set<string>} Player IDs ejected this game (can't play anymore) */
  ejectedPlayerIds = new Set();

  /** @type {1|2} Number of imposters when 6+ players (host choice); 3-5 players always use 1 */
  numberOfImposters = 1;

  constructor() {
    this.code = generateRoomCode();
  }

  /** @returns {number} */
  get playerCount() {
    return this.players.size;
  }

  /** @returns {Player[]} Players not ejected (still in the game) */
  getActivePlayerList() {
    return this.getPlayerList().filter((p) => !this.ejectedPlayerIds.has(p.id));
  }

  /** @returns {number} */
  get activeCount() {
    return this.getActivePlayerList().length;
  }

  /** @returns {number} 1 for 3-5 players; host choice (1 or 2) for 6+ */
  get imposterCount() {
    const n = this.activeCount;
    if (n <= 5) return 1;
    return this.numberOfImposters === 2 ? 2 : 1;
  }

  /** @returns {Player[]} */
  getPlayerList() {
    return Array.from(this.players.values());
  }

  /** @returns {Player|null} */
  getHost() {
    return this.hostId ? this.players.get(this.hostId) ?? null : null;
  }

  /** Reset to lobby for a new game (keeps players, host, settings, chat). */
  resetToLobby() {
    this.phase = PHASE.LOBBY;
    this.currentRound = 0;
    this.roundData = null;
    this.clueTurnOrder = [];
    this.clueTurnIndex = 0;
    this.usedRoundIndices = new Set();
    this.ejectedPlayerIds = new Set();
    for (const p of this.players.values()) {
      p.role = 'innocent';
      p.score = 0;
      p.secretWord = undefined;
      p.theme = undefined;
      p.clue = undefined;
      p.voteTargetId = undefined;
      p.voteCount = 0;
    }
  }

  /**
   * @param {string} id
   * @param {string} name
   * @param {boolean} [isHost]
   */
  addPlayer(id, name, isHost = false) {
    if (this.players.size >= 8) return false;
    const host = isHost || !this.hostId;
    if (host) this.hostId = id;
    const usedAvatars = new Set(this.getPlayerList().map((p) => p.avatar).filter(Boolean));
    const available = ANIMAL_AVATARS.filter((a) => !usedAvatars.has(a));
    const avatar = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : ANIMAL_AVATARS[0];
    this.players.set(id, {
      id,
      name,
      role: 'innocent',
      score: 0,
      isHost: host,
      voteCount: 0,
      avatar,
    });
    return true;
  }

  /**
   * Remove a player. Host migration: if the host leaves, the next player in the list becomes host.
   * @param {string} id
   */
  removePlayer(id) {
    this.players.delete(id);
    if (this.hostId === id && this.players.size > 0) {
      this.hostId = this.getPlayerList()[0].id;
      this.players.get(this.hostId).isHost = true;
    }
  }

  /** Assign roles and pick round word (only active players) */
  assignRoles() {
    const list = this.getActivePlayerList();
    if (list.length < 2) return;
    const impCount = this.imposterCount;

    // Pick a fresh round word
    let idx;
    do {
      idx = Math.floor(Math.random() * ROUND_WORDS.length);
    } while (this.usedRoundIndices.has(idx) && this.usedRoundIndices.size < ROUND_WORDS.length);
    this.usedRoundIndices.add(idx);
    const { theme, word } = ROUND_WORDS[idx];

    // Shuffle and assign imposters
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    for (let i = 0; i < impCount; i++) {
      shuffled[i].role = 'imposter';
      shuffled[i].theme = theme;
      shuffled[i].secretWord = undefined;
    }
    for (let i = impCount; i < shuffled.length; i++) {
      shuffled[i].role = 'innocent';
      shuffled[i].secretWord = word;
      shuffled[i].theme = undefined;
    }

    this.roundData = {
      theme,
      word,
      clues: [],
      clueOrder: [],
      votes: {},
      voteResults: {},
    };
    // Shuffle player order for turn-based clue entry
    this.clueTurnOrder = shuffled.map((p) => p.id);
    this.clueTurnIndex = 0;
  }

  /** Reset per-round fields (all players) */
  resetRoundFields() {
    for (const p of this.players.values()) {
      p.clue = undefined;
      p.voteTargetId = undefined;
      p.voteCount = 0;
    }
    if (this.roundData) {
      this.roundData.clues = [];
      this.roundData.clueOrder = [];
      this.roundData.votes = {};
      this.roundData.voteResults = {};
    }
    this.clueTurnOrder = [];
    this.clueTurnIndex = 0;
  }

  /** Start a new round */
  startRound() {
    this.currentRound++;
    this.resetRoundFields();
    this.assignRoles();
  }

  /**
   * @param {string} playerId
   * @param {string} clue
   */
  submitClue(playerId, clue) {
    if (this.ejectedPlayerIds.has(playerId)) return false;
    const currentId = this.clueTurnOrder[this.clueTurnIndex];
    if (currentId !== playerId) return false;
    const player = this.players.get(playerId);
    if (!player || player.clue) return false;
    player.clue = String(clue).trim().slice(0, 50);
    this.roundData.clueOrder.push(playerId);
    this.roundData.clues.push({
      playerId,
      name: player.name,
      clue: player.clue,
    });
    this.clueTurnIndex++;
    return true;
  }

  /** @returns {string|null} Current player ID whose turn it is */
  getCurrentCluePlayerId() {
    if (this.clueTurnIndex >= this.clueTurnOrder.length) return null;
    return this.clueTurnOrder[this.clueTurnIndex];
  }

  /** @returns {boolean} */
  allCluesIn() {
    return this.clueTurnIndex >= this.clueTurnOrder.length;
  }

  /** Skip current player's turn (timeout or disconnect) */
  skipClueTurn() {
    const currentId = this.clueTurnOrder[this.clueTurnIndex];
    if (!currentId) return;
    const player = this.players.get(currentId);
    if (player && !player.clue) {
      player.clue = '(skipped)';
      this.roundData.clueOrder.push(currentId);
      this.roundData.clues.push({ playerId: currentId, name: player.name, clue: '(skipped)' });
    }
    this.clueTurnIndex++;
  }

  /**
   * @param {string} voterId
   * @param {string} targetId - Player ID or VOTE_SKIP
   */
  submitVote(voterId, targetId) {
    if (this.ejectedPlayerIds.has(voterId)) return false;
    if (targetId === VOTE_SKIP) {
      this.roundData.votes[voterId] = VOTE_SKIP;
      return true;
    }
    if (!this.players.has(targetId) || voterId === targetId) return false;
    if (this.ejectedPlayerIds.has(targetId)) return false;
    this.roundData.votes[voterId] = targetId;
    return true;
  }

  /** @returns {boolean} */
  allVotesIn() {
    const list = this.getActivePlayerList();
    return list.length > 0 && list.every((p) => p.id in this.roundData.votes);
  }

  /** Compute vote counts and ejected player (only active players can receive votes) */
  tallyVotes() {
    const votes = this.roundData.votes;
    let skipVotes = 0;
    const activeList = this.getActivePlayerList();
    for (const id of Object.values(votes)) {
      if (id === VOTE_SKIP) {
        skipVotes++;
      } else {
        const p = this.players.get(id);
        if (p && !this.ejectedPlayerIds.has(id)) p.voteCount++;
      }
    }
    const list = activeList;
    const maxPlayerVotes = Math.max(...list.map((p) => p.voteCount), 0);
    const maxVotes = Math.max(maxPlayerVotes, skipVotes);
    const ejected = list.filter((p) => p.voteCount === maxVotes);
    const singleEjected = ejected.length === 1 ? ejected[0] : null;
    const skipWins = skipVotes === maxVotes;
    const skipTies = skipVotes > 0 && skipVotes === maxPlayerVotes && ejected.length > 0;
    const skipped = skipWins || skipTies;
    const ejectedId = skipped ? null : singleEjected?.id ?? null;
    this.roundData.voteResults = {
      ejectedId,
      ejectedName: skipped ? null : singleEjected?.name ?? null,
      wasImposter: skipped ? false : singleEjected?.role === 'imposter',
      maxVotes,
      skipVotes,
      skipped,
    };
    if (ejectedId) this.ejectedPlayerIds.add(ejectedId);
  }

  /** True if game should end because too few active players remain */
  shouldEndGameFromEjection() {
    return this.activeCount < 3;
  }

  /** Award points for this round */
  awardPoints() {
    const { ejectedId, wasImposter } = this.roundData.voteResults;
    const list = this.getPlayerList();

    for (const p of list) {
      if (p.role === 'innocent') {
        if (ejectedId && p.voteTargetId === ejectedId && wasImposter) {
          p.score += POINTS.INNOCENT_CORRECT_VOTE;
        }
        if (p.voteCount === 0) {
          p.score += POINTS.TRUST_BONUS;
        }
      } else {
        if (p.id !== ejectedId) {
          p.score += POINTS.IMPOSTER_SURVIVES;
        }
      }
    }
  }

  /**
   * @param {string} ejectedImposterId
   * @param {string} guess
   * @returns {boolean}
   */
  imposterGuessSecretWord(ejectedImposterId, guess) {
    const word = this.roundData?.word;
    if (!word) return false;
    const correct = String(guess).trim().toLowerCase() === word.toLowerCase();
    if (correct) {
      const p = this.players.get(ejectedImposterId);
      if (p) p.score += POINTS.IMPOSTER_SECRET_WORD_GUESS;
    }
    return correct;
  }

  /** @returns {boolean} */
  isGameOver() {
    return this.currentRound >= this.totalRounds || this.activeCount < 3;
  }

  /** @returns {Player[]} Sorted by score descending */
  getLeaderboard() {
    return this.getPlayerList().sort((a, b) => b.score - a.score);
  }

  /**
   * @param {string} playerId
   * @returns {Object} Sanitized room state for this player (no others' roles/secrets)
   */
  getPublicState(playerId) {
    const player = this.players.get(playerId);
    const list = this.getPlayerList().map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
      avatar: p.avatar,
      role: player?.id === p.id ? p.role : undefined,
      secretWord: player?.id === p.id ? p.secretWord : undefined,
      theme: player?.id === p.id ? p.theme : undefined,
      clue: this.phase !== PHASE.CLUE_INPUT && p.clue ? p.clue : undefined,
      voteCount: this.phase === PHASE.ROUND_RESULTS || this.phase === PHASE.FINAL_LEADERBOARD ? p.voteCount : undefined,
    }));

    const clueTurn = this.phase === PHASE.CLUE_INPUT ? this.getClueTurnInfo() : {};
    return {
      code: this.code,
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      players: list,
      hostId: this.hostId,
      roundData: this.getSanitizedRoundData(playerId),
      chatHistory: this.chatHistory,
      timers: this.timers,
      numberOfImposters: this.numberOfImposters,
      currentCluePlayerId: clueTurn.currentCluePlayerId ?? undefined,
      currentCluePlayerName: clueTurn.currentCluePlayerName ?? undefined,
      leaderboard: this.phase === PHASE.FINAL_LEADERBOARD
        ? this.getLeaderboard().map((p) => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }))
        : undefined,
      ejectedPlayerIds: Array.from(this.ejectedPlayerIds),
    };
  }

  /**
   * @param {string} playerId
   * @returns {Object}
   */
  getSanitizedRoundData(playerId) {
    if (!this.roundData) return null;
    const rd = { ...this.roundData };
    rd.word = undefined; // Never expose secret word to clients except for comparison
    if (this.phase === PHASE.DISCUSSION) {
      rd.votedPlayerIds = Object.keys(this.roundData.votes || {});
      rd.votes = undefined;
      rd.voteResults = undefined;
    }
    return rd;
  }

  /** @returns {{ currentCluePlayerId: string|null, currentCluePlayerName: string|null }} */
  getClueTurnInfo() {
    const id = this.getCurrentCluePlayerId();
    const player = id ? this.players.get(id) : null;
    return {
      currentCluePlayerId: id,
      currentCluePlayerName: player?.name ?? null,
    };
  }
}
