# 2026-05-03 — Initial Design & Pivot to Action RPG

## Context
Building a web-based educational game about hospital revenue cycle.
Audience: devs/engineers + solutions engineers who are already RCM experts.
Hosted on GitHub Pages as a static SPA.

## Design Evolution
1. **Started as deck-builder** (Slay the Spire style) — card-based UI, turn-based combat
2. **User feedback**: keep it human, no silly creatures, insurance isn't the only bad guy
3. **Pivot**: action RPG roguelike (Hades/Zelda/Celeste feel) with same educational content

## Current Direction: Top-Down Action RPG Roguelike

### Core Mechanics
- WASD movement, dash/dodge (Celeste-tight)
- Top-down room clearing (Hades-style)
- Abilities replace cards — same faction effectiveness system
- Rooms = revenue cycle phases (11 total)
- Enemies = CARC denial codes with surface vs root faction reveal
- Boon selection between rooms (Hades door choices)
- Daily seeded runs for leaderboard

### Tech Stack
- **Engine**: Phaser 3
- **Bundler**: Vite 7
- **Language**: TypeScript
- **Deploy**: GitHub Pages via Actions

### Faction System (Type Effectiveness)
Using right tool against right root faction = 1.6x damage bonus.
Surface faction is visible; root faction revealed on kill (teaching moment).

| Faction   | Color   | Role in RC                       |
|-----------|---------|----------------------------------|
| Payer     | Blue    | Insurance/MCO adjudication       |
| Provider  | Clay    | Hospital/clinic operations       |
| Vendor    | Green   | Clearinghouse/EHR/tech           |
| Patient   | Yellow  | Member/beneficiary actions       |
| Employer  | Purple  | Plan sponsor/HR/benefits         |
| System    | Grey    | Regulatory/CMS/systemic issues   |

### Key Design Principles
- Human-centered (real people, real jobs, no mascots)
- Every denial teaches something real about RCM
- Provider can be the bad guy too (shadow abilities)
- Competitive via daily seeds + shareable scores
- Serious but engaging — the fun IS the learning

## Next Steps
- [ ] Complete Phaser scene implementation
- [ ] Procedural room generation
- [ ] Player movement + dash + abilities
- [ ] Enemy AI (chase + attack patterns)
- [ ] HUD overlay
- [ ] Boon/upgrade selection between rooms
- [ ] Summary/score screen
- [ ] Leaderboard integration
