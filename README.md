# Guess the Imposter

A real-time multiplayer social deduction web game. Players join rooms, receive secret roles (Innocent or Imposter), give clues, discuss, and vote to find the Imposter(s).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **State**: In-memory on server (rooms, players, game state)

## Quick Start

```bash
# Install dependencies
npm install

# Run both server and client in development
npm run dev
```

- **Client**: http://localhost:3000
- **Socket Server**: http://localhost:4000

## Project Structure

```
├── client/          # Next.js frontend
│   ├── app/         # App Router pages and layout
│   ├── components/  # Game screens and UI
│   ├── hooks/       # Socket and game state hooks
│   └── lib/         # Utilities and socket client
├── server/          # Express + Socket.io backend
│   └── src/
│       ├── game/    # Game logic, rooms, roles
│       └── socket/  # Socket event handlers
```

## Game Flow

1. **Lobby**: Create or join room with 4-letter code (3–8 players). Host can configure rounds and timers.
2. **Role Reveal**: Innocents get Secret Word; Imposters get Theme only
3. **Clue Phase**: Turn-based — each player has X seconds (configurable) to type one word, one at a time
4. **Discussion**: Timed chat phase with all clues visible
5. **Voting**: Blind vote; majority ejects a player
6. **Round Results**: Points, Last Chance for ejected Imposter to guess Secret Word (+150 pts)
7. **Final Leaderboard**: After chosen round count
