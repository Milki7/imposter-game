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

/** Seconds for "hurry up" when only 1 player left to vote */
export const HURRY_UP_SECONDS = 10;

/** Max debate phase duration (safety fallback, seconds) */
export const MAX_DEBATE_SECONDS = 300;

/** Seconds left when "panic mode" starts (red UI, tick sound) */
export const DISCUSSION_PANIC_THRESHOLD = 10;

/** When majority vote "Ready", discussion countdown jumps to this many seconds */
export const SKIP_DISCUSSION_SECONDS = 3;

/** Default timers (seconds) */
export const DEFAULT_TIMERS = {
  CLUE_INPUT: 30,
  DISCUSSION: 120,
  VOTING: 30,
  IMPOSTER_LAST_CHANCE: 10,
};

/** Theme → secret word pairs for rounds */
export const ROUND_WORDS = [
  // Fruit & Food
  { theme: 'Fruit', word: 'Apple' },
  { theme: 'Fruit', word: 'Watermelon' },
  { theme: 'Fruit', word: 'Strawberry' },
  { theme: 'Fruit', word: 'Pineapple' },
  { theme: 'Fruit', word: 'Avocado' },
  { theme: 'Food', word: 'Pizza' },
  { theme: 'Food', word: 'Sushi' },
  { theme: 'Food', word: 'Taco' },
  { theme: 'Food', word: 'Pancake' },
  { theme: 'Food', word: 'Sandwich' },
  { theme: 'Dessert', word: 'Ice Cream' },
  { theme: 'Dessert', word: 'Brownie' },
  { theme: 'Dessert', word: 'Cupcake' },
  { theme: 'Beverage', word: 'Coffee' },
  { theme: 'Beverage', word: 'Smoothie' },
  // Animals
  { theme: 'Animal', word: 'Elephant' },
  { theme: 'Animal', word: 'Penguin' },
  { theme: 'Animal', word: 'Dolphin' },
  { theme: 'Animal', word: 'Butterfly' },
  { theme: 'Animal', word: 'Kangaroo' },
  { theme: 'Animal', word: 'Octopus' },
  { theme: 'Animal', word: 'Flamingo' },
  { theme: 'Animal', word: 'Hedgehog' },
  { theme: 'Sea Creature', word: 'Jellyfish' },
  { theme: 'Sea Creature', word: 'Seahorse' },
  // Colors & Nature
  { theme: 'Color', word: 'Turquoise' },
  { theme: 'Color', word: 'Magenta' },
  { theme: 'Color', word: 'Crimson' },
  { theme: 'Color', word: 'Lavender' },
  { theme: 'Weather', word: 'Thunderstorm' },
  { theme: 'Weather', word: 'Blizzard' },
  { theme: 'Weather', word: 'Rainbow' },
  { theme: 'Weather', word: 'Hurricane' },
  { theme: 'Nature', word: 'Waterfall' },
  { theme: 'Nature', word: 'Volcano' },
  { theme: 'Nature', word: 'Forest' },
  { theme: 'Nature', word: 'Canyon' },
  { theme: 'Plant', word: 'Sunflower' },
  { theme: 'Plant', word: 'Cactus' },
  // Vehicles & Transport
  { theme: 'Vehicle', word: 'Bicycle' },
  { theme: 'Vehicle', word: 'Helicopter' },
  { theme: 'Vehicle', word: 'Submarine' },
  { theme: 'Vehicle', word: 'Motorcycle' },
  { theme: 'Vehicle', word: 'Sailboat' },
  // Places & Geography
  { theme: 'Country', word: 'Japan' },
  { theme: 'Country', word: 'Brazil' },
  { theme: 'Country', word: 'Egypt' },
  { theme: 'Country', word: 'Australia' },
  { theme: 'City', word: 'Paris' },
  { theme: 'City', word: 'Tokyo' },
  { theme: 'City', word: 'Venice' },
  { theme: 'Landmark', word: 'Pyramid' },
  { theme: 'Landmark', word: 'Lighthouse' },
  { theme: 'Landmark', word: 'Castle' },
  // Music & Arts
  { theme: 'Instrument', word: 'Guitar' },
  { theme: 'Instrument', word: 'Piano' },
  { theme: 'Instrument', word: 'Drums' },
  { theme: 'Instrument', word: 'Violin' },
  { theme: 'Instrument', word: 'Saxophone' },
  { theme: 'Music Genre', word: 'Jazz' },
  { theme: 'Music Genre', word: 'Reggae' },
  { theme: 'Art', word: 'Sculpture' },
  { theme: 'Art', word: 'Mosaic' },
  // Sports & Activities
  { theme: 'Sport', word: 'Basketball' },
  { theme: 'Sport', word: 'Surfing' },
  { theme: 'Sport', word: 'Archery' },
  { theme: 'Sport', word: 'Gymnastics' },
  { theme: 'Sport', word: 'Wrestling' },
  { theme: 'Hobby', word: 'Photography' },
  { theme: 'Hobby', word: 'Gardening' },
  { theme: 'Hobby', word: 'Knitting' },
  { theme: 'Hobby', word: 'Chess' },
  { theme: 'Game', word: 'Monopoly' },
  { theme: 'Game', word: 'Puzzle' },
  // Clothing & Objects
  { theme: 'Clothing', word: 'Sweater' },
  { theme: 'Clothing', word: 'Sneakers' },
  { theme: 'Clothing', word: 'Backpack' },
  { theme: 'Clothing', word: 'Umbrella' },
  { theme: 'Furniture', word: 'Bookshelf' },
  { theme: 'Furniture', word: 'Hammock' },
  { theme: 'Furniture', word: 'Chandelier' },
  { theme: 'Object', word: 'Compass' },
  { theme: 'Object', word: 'Flashlight' },
  { theme: 'Object', word: 'Telescope' },
  // Professions & People
  { theme: 'Profession', word: 'Astronaut' },
  { theme: 'Profession', word: 'Pirate' },
  { theme: 'Profession', word: 'Chef' },
  { theme: 'Profession', word: 'Detective' },
  { theme: 'Profession', word: 'Magician' },
  { theme: 'Profession', word: 'Librarian' },
  { theme: 'Fictional Character', word: 'Superhero' },
  { theme: 'Fictional Character', word: 'Vampire' },
  { theme: 'Fictional Character', word: 'Robot' },
  // Technology & Science
  { theme: 'Technology', word: 'Smartphone' },
  { theme: 'Technology', word: 'Drone' },
  { theme: 'Technology', word: 'Headphones' },
  { theme: 'Science', word: 'Telescope' },
  { theme: 'Science', word: 'Microscope' },
  { theme: 'Science', word: 'Molecule' },
  // Body & Health
  { theme: 'Body Part', word: 'Eyebrow' },
  { theme: 'Body Part', word: 'Fingerprint' },
  { theme: 'Emotion', word: 'Excitement' },
  { theme: 'Emotion', word: 'Nostalgia' },
  // Misc
  { theme: 'Season', word: 'Autumn' },
  { theme: 'Season', word: 'Winter' },
  { theme: 'Holiday', word: 'Halloween' },
  { theme: 'Holiday', word: 'Birthday' },
  { theme: 'Building', word: 'Skyscraper' },
  { theme: 'Building', word: 'Igloo' },
  { theme: 'Mythical', word: 'Dragon' },
  { theme: 'Mythical', word: 'Unicorn' },
  { theme: 'Insect', word: 'Ladybug' },
  { theme: 'Insect', word: 'Dragonfly' },
];

/** Animal emojis for player avatars (assigned on join) */
export const ANIMAL_AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦄',
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
