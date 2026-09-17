# Stack & Survive — Technical Submission Notes

## What it is

A real-time cloud infrastructure management game where players scale Azure architecture as demand grows. Same workload, different decisions, different outcomes.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (GitHub Pages)                     │
│                                             │
│  React UI → Phaser Renderer → Game Loop     │
│       ↕                                     │
│  Deterministic Simulation Engine            │
│  (packages/simulation)                      │
│       ↕                                     │
│  Local Leaderboard (localStorage)           │
│       │                                     │
│       │ action provenance (not score)        │
│       ↓                                     │
│  ┌──────────────────────────────────────┐   │
│  │  Global Leaderboard API              │   │
│  │  (apps/leaderboard-api)              │   │
│  │                                      │   │
│  │  1. Validate challenge identity      │   │
│  │  2. Load canonical start state       │   │
│  │  3. Replay simulation server-side    │   │
│  │  4. Calculate authoritative score    │   │
│  │  5. Persist verified result          │   │
│  │  6. Return rank + Top 10            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Key technical differentiators

### 1. Deterministic simulation

The game simulation is fully deterministic: given the same starting architecture, workload scenario, and action schedule, the result is always identical. This enables:

- **Reproducible run history**: saved runs are verified by replaying them
- **Server-side score verification**: the leaderboard never trusts a client score
- **Fair competition**: all players face the exact same traffic pattern

### 2. Server-verified leaderboard

> The browser never submits a trusted score. The server replays the player's infrastructure decisions using the same deterministic simulation engine that powers the game.

The browser sends only:
- Player nickname
- Challenge identity (content hash)
- Action schedule (what infrastructure decisions were made, at what time)

The server:
- Loads the canonical starting architecture (preventing cheating)
- Replays every game tick through the shared simulation engine
- Calculates score, availability, cost, and business value authoritatively
- Only accepts runs that meet the challenge objective

### 3. Monorepo shared packages

```
packages/
  schema/        — Type definitions shared by all
  cloud-domain/  — Azure resource model + canonical start
  scenarios/     — Challenge definitions + workload scenarios
  simulation/    — Core simulation engine + replay verifier

apps/
  web/           — React + Phaser browser game
  leaderboard-api/ — Node.js verification server
```

The simulation engine, challenge definitions, and starting architecture are shared TypeScript packages imported by both the browser game and the server API. There is no second implementation.

### 4. Resilient architecture

- **Local-first**: Scores are saved locally immediately; global submission is async
- **Graceful fallback**: If the API is unavailable, the local leaderboard is shown
- **Retry**: Failed submissions are persisted and retried with the same run ID
- **No blocking**: Network failures never prevent gameplay, result display, or retry

### 5. Concept-art visual engine

The game world is rendered as a baked concept-art hall background (Canvas 2D, 2400×1350) with interactive hero facility sprites on top. This creates the impression of one authored scene rather than assembled UI components. The rendering is purely visual and never modifies simulation state.

## Game loop

```
Player starts → 5-second countdown → real-time operation begins
  ↓
Traffic arrives (Browse, Order, Bot requests)
  ↓
Player builds infrastructure (App capacity, Cache, Protected Edge)
  ↓
Simulation processes requests through the architecture each second
  ↓
Budget, availability, and pressure update in real time
  ↓
180 seconds → Score calculated (reliability, latency, business value, security)
  ↓
Result screen → Leaderboard → "Try another architecture"
```

## Score formula

```
Score = reliability (40%) + latency (20%) + business value (25%) + security (15%)
      - failure penalty (1500 if interrupted)
      - overprovisioning penalty (500 if wasteful)

Scale: 0 – 10,000
```

## What we did NOT build

- Authentication or user accounts
- Complex anti-cheat beyond replay verification
- Social features, friends, or chat
- Backend databases beyond simple file persistence
- Custom game engine — we use Phaser 3 and React 19
- Per-request simulation — representative bounded traffic only

## Limitations

- Nicknames are self-reported and not unique
- File-based persistence (suitable for hackathon, upgradeable to Azure Table Storage)
- Rate limiting is basic (10 submissions/min per IP)
- No anti-automation beyond server replay verification
- Capacities and costs are game assumptions, not real Azure pricing
