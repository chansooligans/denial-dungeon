# Denial Dungeon

A turn-based RPG that teaches the US healthcare revenue cycle. Walk through a hospital, talk to billing staff, fight claim denials, and discover the surreal "Waiting Room" where lost claims go.

**[Play it](https://chansooligans.github.io/denial-dungeon/)** (GitHub Pages)

## What You'll Learn

The game progressively teaches across 10 levels:

- Claim forms (CMS-1500, UB-04)
- Medical coding (ICD-10, CPT, HCPCS, modifiers)
- X12 transactions (270/271 eligibility, 837 claims, 835 remittance)
- CARC/RARC denial codes and how to resolve them
- Prior authorization, coordination of benefits, patient cost share
- CDI, audit compliance, payer policy navigation

## How to Play

- **Arrow keys / WASD** — Move around the hospital
- **E / Space** — Talk to NPCs, interact with objects
- **1-9** — Select tools during battle
- **ESC** — Skip intro cutscene

Walk through the hospital lobby, talk to NPCs in offices, and find the glowing gap in the floor to enter The Waiting Room. Resolve claim denials in turn-based encounters using billing tools — effectiveness depends on matching the right tool to the denial's root cause.

## Tech Stack

- **Phaser 3** — Game engine
- **TypeScript** — Type safety
- **Vite** — Dev server and bundler
- All sprites are procedurally generated (no external art assets)

## Development

```bash
npm install
npm run dev          # Dev server on localhost:5173
npm run build        # Production build to dist/
npx tsc --noEmit     # Type-check
```

## Project Structure

```
src/
├── main.ts           # Phaser config, scene registry
├── types.ts          # Game types
├── state.ts          # Save/load via localStorage
├── content/          # Game data (maps, NPCs, dialogue, encounters, codex)
└── scenes/           # Phaser scenes (Boot, Intro, Title, Hospital,
                      #   Dialogue, Battle, Form, WaitingRoom, Codex)
```

## License

Open source educational game.
