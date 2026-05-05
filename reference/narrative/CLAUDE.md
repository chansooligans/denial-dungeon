# Narrative folder — orientation

Lore, characters, tone, story arc. Downstream of `curriculum.md`,
upstream of dialogue / scene authoring.

Start at [`README.md`](README.md) for the index. This file is
shorter and oriented at "what's locked, what's not, what voice
am I writing in."

## The braid (one-liners)

| Thread | Job | Where |
|---|---|---|
| **A · Cosmology** | Unresolved claims accumulate into a parallel place | [`cosmology.md`](cosmology.md) |
| **C · Philosophy** | Two truths — bleeds vs. bills | [`philosophy.md`](philosophy.md) |
| **D · Personal hook** | Dana's notebook; she's partially trapped; L10 is the door home | [`characters/dana.md`](characters/dana.md), [`notebook/`](notebook/) |

## What's locked

| Decision | Source |
|---|---|
| **Cosmology** — claims accumulate into the Waiting Room; resolution releases what's stuck | [`cosmology.md`](cosmology.md) |
| **Philosophy** — hospital = people-truth; Waiting Room = form-truth | [`philosophy.md`](philosophy.md) |
| **Dana's voice** — wise + warm. Less Sterling Archer, more Eve from WALL-E meets a senior attorney who means it | [`characters/dana.md`](characters/dana.md) |
| **Reveal pacing** — first cracks at L4, builds through L9, audit at L10 | [`notebook/reveal-timeline.md`](notebook/reveal-timeline.md) |
| **Pacing** — floor-by-floor; descent is a *dreamlike fall*, not a menu | [`tone.md`](tone.md) |
| **Tone split** — Hospital warm/cozy; Waiting Room funny/surreal; heavy → light register flip | [`tone.md`](tone.md) |
| **Player gets a notebook** — apprentice → peer; auto-journal mid-game; can annotate Dana's notebook late | [`notebook/README.md`](notebook/README.md) |
| **Notebook drafts** — pages 1–11 drafted; page 12 drafted but provisional | [`notebook/pages.md`](notebook/pages.md) |
| **Marginalia device** — pages 9, 11, 12 use a "smaller hand" voice that becomes Dana on page 12 | [`notebook/pages.md`](notebook/pages.md) |
| **Wrongness tools** — page 6 cuts off mid-sentence; signoff shape evolves (`— Dana` → `— D.`); each used once, no overplay | [`notebook/pages.md`](notebook/pages.md) |

## What's provisional (do not lock without checking in)

| Item | Why it's open | Notes |
|---|---|---|
| **Dana's specific child case** | User wants to revisit later | Foreshadowing on page 10 is *deliberately generic* — doesn't pre-commit to pediatrics. Page 12 has no child specifics. |
| **Trapped-soul slate** | User wants to revisit later | Drafts of 4 souls in [`characters/trapped-souls.md`](characters/trapped-souls.md). None implemented in code; can revise freely. |
| **L10 endings** | Author still working on them | 4-ending grid in [`endings.md`](endings.md) is the current draft; may collapse to 2–3 or add a 5th (refusal). |
| **Page 12 text** | Coupled to ending | Drafted as a flexible version that doesn't pre-commit to a specific outcome. |
| **Per-level descent visual language** | Per-level work | General dreamlike pattern locked; specifics (HIM door vs. PFS counter) come when each level is built. |
| **Player's annotation voice** (late game) | Not drafted | Probably distinct from Dana's but adjacent. To draft when player notebook is built. |

## Voice rules

The notebook's voice carries philosophical weight for the whole
game. Sanity-check every new line against the rubric in
[`notebook/pages.md`](notebook/pages.md) ("Voice consistency"
section).

**Quick check — Dana's voice should:**
- Use short sentences. Observation, then direction.
- Be specific. "Chair 14" beats "the unresolved."
- Have warmth that earns the next hard thing.
- Refuse to soften the critique when the system is cruel.
- Never lecture. Never cheerlead. Never abstract.

**On-voice samples to match:**
- *"Boring is a kind of hiding."*
- *"That's the math. Sorry."*
- *"Don't be most people."*
- *"You can be the one who tells them."*

**Marginal hand voice** (pages 9, 11, absorbed on 12):
- Closer to the ground than Dana usually allows herself.
- Says the thing Dana was about to say but couldn't.
- Slightly more vulnerable, slightly more direct.
- Same wisdom; different temperature.

## Authoring rules for new content

When drafting new notebook pages, NPC dialogue, or
descriptions:

1. **Stay in voice** unless intentionally writing a different
   character. Run any new line through the on-voice / off-voice
   rubric in [`notebook/pages.md`](notebook/pages.md).
2. **Don't pre-commit to provisional things.** Avoid lines that
   would need rewriting if Dana's case turns out not to be a
   child, or if a trapped soul gets cut, or if an ending
   changes.
3. **Use real revenue-cycle terms.** I50.42 not "diabetes." 278
   not "auth form." LCD L33526 not "the policy."
4. **Specific images > abstractions.** Always.
5. **Don't restate the cosmology after page 2.** Live inside
   it. The Waiting Room *is*; we don't keep explaining why.
6. **Length: about a page.** 60–150 words for notebook pages.
   NPC dialogue lines are shorter — 1–3 sentences usually.

## Don't author code from this folder yet

We're in design mode. Encounters, NPCs, scenes, and dialogue
content shouldn't be authored in `src/` based on these docs
without checking in. The docs are still moving. When the user
says "let's start building L4" (or whatever), we'll be ready —
but until then, sketches stay in markdown.

## See also

- [`README.md`](README.md) — folder index and "where to look
  for what"
- [`open-questions.md`](open-questions.md) — what's still up
  for shaping (current as of last edit)
- Parent [`../CLAUDE.md`](../CLAUDE.md) — reference folder
  conventions
- Root [`../../CLAUDE.md`](../../CLAUDE.md) — game-level
  context
