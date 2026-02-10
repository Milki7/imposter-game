/** @typedef {'innocent' | 'imposter'} Role */

/** Game phases */
export const PHASE = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  CLUE_INPUT: 'clue_input',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  ROUND_RESULTS: 'round_results',
  IMPOSTER_LAST_CHANCE: 'imposter_last_chance',
  FINAL_LEADERBOARD: 'final_leaderboard',
};

/** Special vote value when player chooses to skip rather than eject someone */
export const VOTE_SKIP = '__SKIP__';

/** Point values */
export const POINTS = {
  INNOCENT_CORRECT_VOTE: 200,
  IMPOSTER_SURVIVES: 500,
  TRUST_BONUS: 50,
  IMPOSTER_SECRET_WORD_GUESS: 150,
};

/** Default timers (seconds) */
export const DEFAULT_TIMERS = {
  CLUE_INPUT: 30,
  DISCUSSION: 120,
  VOTING: 30,
  IMPOSTER_LAST_CHANCE: 10,
};

/** Theme → secret word pairs for rounds */
export const ROUND_WORDS = [
  { theme: 'Fruit', word: 'Apple' },
  { theme: 'Animal', word: 'Elephant' },
  { theme: 'Color', word: 'Turquoise' },
  { theme: 'Food', word: 'Pizza' },
  { theme: 'Vehicle', word: 'Bicycle' },
  { theme: 'Country', word: 'Japan' },
  { theme: 'Instrument', word: 'Guitar' },
  { theme: 'Sport', word: 'Basketball' },
  { theme: 'Clothing', word: 'Sweater' },
  { theme: 'Weather', word: 'Thunderstorm' },
];

/** Generate random 4-letter room code */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
