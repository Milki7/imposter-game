/** Socket event names - shared contract between client and server */

export const EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Lobby
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_ERROR: 'room:error',
  PLAYER_JOINED: 'room:player_joined',
  PLAYER_LEFT: 'room:player_left',
  LEAVE_ROOM: 'room:leave',
  ROOM_LEFT: 'room:left',
  RESTART_GAME: 'game:restart',
  GAME_RESTARTED: 'game:restarted',
  UPDATE_SETTINGS: 'room:update_settings',
  SETTINGS_UPDATED: 'room:settings_updated',

  // Game flow
  START_GAME: 'game:start',
  GAME_STARTED: 'game:started',
  PHASE_CHANGED: 'game:phase_changed',
  GAME_STATE: 'game:state',

  // Clue phase
  SUBMIT_CLUE: 'game:submit_clue',
  CLUE_SUBMITTED: 'game:clue_submitted',
  ALL_CLUES_IN: 'game:all_clues_in',

  // Discussion & Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',
  DISCUSSION_TIME_UP: 'game:discussion_time_up',

  // Voting
  SUBMIT_VOTE: 'game:submit_vote',
  VOTE_SUBMITTED: 'game:vote_submitted',
  VOTERS_UPDATED: 'game:voters_updated',
  VOTING_ENDED: 'game:voting_ended',

  // Round results
  ROUND_RESULTS: 'game:round_results',
  IMPOSTER_LAST_CHANCE: 'game:imposter_last_chance',
  IMPOSTER_GUESS: 'game:imposter_guess',
  IMPOSTER_GUESS_RESULT: 'game:imposter_guess_result',

  // Final
  GAME_OVER: 'game:over',
  LEADERBOARD: 'game:leaderboard',
};
