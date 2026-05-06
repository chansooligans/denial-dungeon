# Denial Dungeon

A turn-based RPG that teaches the US healthcare revenue cycle. Walk through a hospital, talk to billing staff, fight claim denials, and discover the surreal "Waiting Room" where lost claims go.

**[Play it](https://chansooligans.github.io/denial-dungeon/)** (GitHub Pages) &middot; **[Prototype catalog](https://chansooligans.github.io/denial-dungeon/prototypes.html)** (encounter-redesign sketches)

## What You'll Learn

The game progressively teaches across 10 levels:

- Claim forms (CMS-1500, UB-04)
- Medical coding (ICD-10, CPT, HCPCS, modifiers)
- X12 transactions (270/271 eligibility, 837 claims, 835 remittance)
- CARC/RARC denial codes and how to resolve them
- Prior authorization, coordination of benefits, patient cost share
- CDI, audit compliance, payer policy navigation

## How to Play

**Desktop**
- **Arrow keys / WASD** — Move
- **E / Space** — Talk to NPCs, interact with objects, advance dialogue
- **1-9** — Select tools / actions during battle
- **ESC** — Skip intro cutscene; flee battle

**Mobile / touch**
- On-screen virtual D-pad (bottom-left) for movement
- **E** button (bottom-right) to interact
- **ESC** button (top-right) to skip intro / flee battle
- Battle tools, dialogue choices, and obstacle markers all respond to taps

Walk through the hospital lobby, talk to NPCs in offices, and find the glowing gap in the floor to descend into The Waiting Room. Engage the pulsing purple obstacle markers to fight claim denials in turn-based combat. The mechanic varies per archetype: some are HP fights, some are case-file investigations against a real CMS-1500, some are races against a timely-filing clock.

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
├── battle/           # Battle engine (mechanic dispatch, ClaimSheet, screens, toolMenu)
├── content/          # Game data (maps, NPCs, dialogue, encounters, codex)
└── scenes/           # Phaser scenes (Boot, Intro, Title, Hospital,
                      #   Dialogue, Battle, Form, WaitingRoom, Codex,
                      #   TouchOverlay)
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`. Requires the repo's Pages source to be set to **GitHub Actions** in repo Settings → Pages.

## License

Open source educational game.
