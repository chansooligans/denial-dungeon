# Cross-cutting concerns

Some topics aren't a level — they thread through multiple
levels. They live most strongly in one place but show up
everywhere.

| Concern | Lives most in | Touches |
|---|---|---|
| Denial taxonomy (CARC/RARC) | L7 Courtroom | every level |
| Compliance / documentation defense | L10 Audit | L4, L5, L6 |
| Patient experience | L8 River | L2, L3, L7 |
| Time pressure (filing windows) | L7 Courtroom (Reaper) | every back-end level |
| Vendor / clearinghouse | L6 Conveyor | L2, L7 |
| Health equity / financial harm | L8 River | L2, L7 |
| Charge capture / CDM | L6 Conveyor | L4 (intro) |
| AR aging / triage | L7 Courtroom | L8 |

## Why these aren't levels

Each is *too cross-cutting* for a single level to own. If we
gave any of them their own level, we'd either:

- Have to re-teach it everywhere it shows up (redundant), or
- Pretend it only matters in that level (false).

So they live in their *strongest home* and the player meets
them again as variations elsewhere. CARC codes get formally
introduced at L7 but appear from L1 forward; the player has
been reading them all along but doesn't get the system view
until the courtroom.

## Threading rules

When we author a level, we should ask:

1. Which cross-cutting concerns naturally surface here?
2. How do they appear *differently* than they did in their
   home level?
3. Is the player ready to see them, or should we hold off?

Example: COB shows up at L2 (registration captures the COB
chain), at L7 (cascading denials when COB is wrong), and at
L9 (the full Hydra fight where COB is the whole puzzle). At
L2 the player just notices it; at L7 they fight a denial; at
L9 they understand the system. Same concern, three depths.

## Open

- Should some cross-cutting concerns get their own *codex*
  entry that the player can return to and re-read as they
  see new variations? (Today's codex is per-CARC and per-
  archetype; a "concept" entry per cross-cutting concern
  would help.)
- The compliance thread is especially important because it
  retroactively re-grades every earlier level at L10. Worth
  designing the per-level compliance moments in advance so
  the L10 audit packs real punches.

## See also

- [`README.md`](README.md) — folder index
- [`levels/`](levels/) — per-level breakdowns; each level lists
  which cross-cutting concerns it touches
- [`open-questions.md`](open-questions.md) — open questions on
  threading
