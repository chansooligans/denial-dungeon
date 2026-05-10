// Data Sandbox tips library — the team's documentation page.
//
// Surfaced in-game by the Sandbox terminal (the 'B' whiteboard at
// the north wall of DATA_SANDBOX): walk up to it and press E to
// open the TipsTerminalScene overlay. The overlay shows:
//
//   1. Per-level orientation — where to go, who hands the case, what
//      the case teaches. Always rendered for the player's current
//      currentLevel.
//   2. Per-encounter hints — short bullet-list playbooks for the in-
//      game encounters. Only rendered for encounters the player has
//      seen (`state.obstaclesSeen`) but not yet defeated. Solved
//      encounters collapse to a "✓ done" line.
//
// Voice: collaborative, first-person plural, slightly tech-witty.
// The terminal is the team's wiki, not Dana's notebook — different
// register on purpose.
//
// Scope: covers the 10 in-game encounters that actually appear in
// `levels.ts`. Other Case prototypes in `/prototypes.html` are not
// represented here (they're catalog-only).

/** Per-level orientation. Rendered as bullets. */
export const LEVEL_GUIDANCE: Record<number, string[]> = {
  1: [
    "Anjali walks up to your desk in the lobby. Talk to her — she's holding the case.",
    "The verb you'll learn is AMEND. Click the disputed field on the claim, pick the value the chart actually supports.",
    "The 271 eligibility response on file is the source of truth. The photocopy of her insurance card lied (it was the wrong card).",
  ],
  2: [
    "Kim's at the Registration counter. Two cases this level: a CMS-1500 fundamentals warmup and the Eligibility Fog encounter.",
    "Fog is about coverage scenarios — coordination of benefits, plan-effective dates, the kind of mismatch that throws CO-109 / CO-22.",
    "Run a 270 before you resubmit. The 271 will tell you what the payer actually has on file vs. what the patient handed to the clerk.",
  ],
  3: [
    "Sam in Patient Services. Two cases: Gatekeeper (Okafor, prior auth) and Wraith (Walker, medical-necessity citation chain).",
    "Wraith requires a chart pull at Med Records before Sam will hand it off. Walk to MED RECORDS, examine an 'F' cabinet to pull the echo report.",
    "Prior auth is X12 278 — the form payers use to say yes/no/needs-more-info before service. CO-197 / CO-50 land here.",
  ],
  4: [
    "Pat moved to HIM (south wing west, reachable from the lobby south-door corridor). The case is Bundle Kim — modifier 25 / NCCI-edit territory.",
    "Pull the op-note at Med Records first. Sarah Kim's chart has the answer in plain English; Pat won't hand off the case until you've got it.",
    "Modifier 25: significant, separately identifiable E&M service on the same day as a procedure. Belongs on the E&M line, not the procedure.",
  ],
  5: [
    "Sam's back in Patient Services. The wraith returned — same archetype, different patient (Walker's echo result).",
    "You're now building three-piece citation arguments: payer phrase + chart fact + policy clause, all addressing the same issue.",
    "If the citation pieces don't all line up on a single issue, the system rejects it. Mismatch is the test, not a bug.",
  ],
  6: [
    "Alex moved to Billing (south wing east). Cal the maintenance contractor cleared out at the start of the level — you can walk all the way through now.",
    "Swarm cases — the clearinghouse is sending back 277CA rejections in waves. Lots of small fixes per claim, not one big argument.",
    "X12 277CA is the 'we received your claim and here's what's wrong with it' ack. Read it carefully; each rejection has its own fix.",
  ],
  7: [
    "Sam in Patient Services again. The reaper has surfaced — timely-filing countdown, CO-29.",
    "Reaper cases are about deadlines. Find the first-submit timestamp on the 277CA chain and prove the original claim went out in time.",
    "Subscriber-id typos are the most common reason a timely-filed claim gets denied as 'not on file.' Amend the ID, attach the 277CA evidence.",
  ],
  8: [
    "Jordan's now at the PFS phone bank. Two cases this level: a surprise-bill specter and the lighthouse-charity case.",
    "Surprise bills are NSA territory — the No Surprises Act + IDR. The patient is out of the rate dispute once cost-share is correctly calculated.",
    "Charity care under §501(r) — financial assistance policies, presumptive eligibility. Patient-facing, restorative.",
  ],
  9: [
    "Kim back at Registration. The doppelgänger — duplicate claims, version control across submissions.",
    "Frequency codes (0=original, 7=replacement, 8=void) on the 837 are the official way to manage versions. ICN matters.",
    "Two claims that look identical may not be. Check the dates, the modifier set, and the original claim number before deciding which to keep.",
  ],
  10: [
    "Dana is on the Auditorium stage (1F, east of the Lobby). Talking to her starts the boss encounter.",
    "The audit covers everything you've touched in the last 90 days. Documentation, modifiers, medical necessity, the whole stack.",
    "RECEIPT vs AMEND: defend the original work with chart evidence (RECEIPT), or concede + accept the recoupment (AMEND). Pick the right verb per finding.",
  ],
}

/** Per-encounter hints. Keyed by encounter id (matches `enemies.ts`).
 *  Rendered only for encounters the player has seen but not defeated;
 *  defeated ones collapse to a one-line "✓ solved" entry. */
export const ENCOUNTER_HINTS: Record<string, { name: string; level: number; hints: string[] }> = {
  intro_wrong_card: {
    name: "The Wrong Card (L1)",
    level: 1,
    hints: [
      "Anjali handed her husband's insurance card at check-in. Different subscriber id than hers.",
      "The 271 eligibility response shows her on the plan as a dependent under her own id (AET447821491).",
      "Amend Box 1a to her id and resubmit. Single-issue case; the verb is AMEND.",
    ],
  },
  eligibility_fog: {
    name: "Eligibility Fog (L2)",
    level: 2,
    hints: [
      "The patient has two coverages and the wrong one was billed primary. CO-22 / CO-109 territory.",
      "Run a fresh 270 to see who's actually primary today — coverage can shift mid-month.",
      "Fix the claim's order-of-benefits flag and resubmit; Coordination of Benefits (COB) does the rest.",
    ],
  },
  co_197: {
    name: "Gatekeeper · Prior Auth (L3)",
    level: 3,
    hints: [
      "CO-197: prior authorization absent or invalid. The procedure went out without a 278 on file.",
      "Check the 278 response history — sometimes there IS an auth, just under a different procedure code.",
      "If no auth was ever requested, the appeal path depends on whether the service was urgent/emergent.",
    ],
  },
  co_50: {
    name: "Wraith · Medical Necessity (L3 + L5)",
    level: 3,
    hints: [
      "CO-50: not deemed medically necessary. The payer doesn't think the diagnosis supports the procedure.",
      "You'll need a chart pull from Med Records before Sam hands the case off — the echo report is the evidence.",
      "Citation chain: payer's denial phrase + a specific chart fact + the matching policy clause. All three must address the same issue.",
    ],
  },
  co_97: {
    name: "Bundle · Modifier 25 (L4)",
    level: 4,
    hints: [
      "CO-97: bundled service. The payer rolled the E&M into the procedure.",
      "Pull Sarah Kim's op-note from Med Records — it shows the E&M was significant + separately identifiable.",
      "Modifier 25 goes on the E&M line, not the procedure. NCCI edits with indicator '1' allow modifier override.",
    ],
  },
  co_16_swarm: {
    name: "Swarm · Clearinghouse (L6)",
    level: 6,
    hints: [
      "277CA waves — the clearinghouse is rejecting batches before they even reach the payer. Several small fixes per claim, not one argument.",
      "Each rejection has its own STC code. Read them; some are real billing errors, some are formatting.",
      "Resubmit corrected claims with frequency code 7 (replacement) so you don't dupe-flag.",
    ],
  },
  co_29_reaper: {
    name: "Reaper · Timely Filing (L7)",
    level: 7,
    hints: [
      "CO-29: timely filing limit exceeded. Look for the first-submit timestamp in the 277CA chain — the original may have gone out in time, even if a later resubmit didn't.",
      "Subscriber-id typos are the most common reason a timely claim gets denied as 'not on file.' Amend the ID, attach the 277CA evidence.",
      "If the original WAS timely, the appeal is procedural, not substantive. Keep the citation tight.",
    ],
  },
  surprise_bill_specter: {
    name: "Specter · Surprise Bill (L8)",
    level: 8,
    hints: [
      "NSA territory — the No Surprises Act caps patient cost-share to in-network levels for emergency + ancillary services at in-network facilities.",
      "Recalculate cost-share at the in-network rate. The patient owes that, not the OON rate.",
      "The OON provider and the payer fight in IDR. The patient is out of the rate dispute once their cost-share is right.",
    ],
  },
  co_18_doppelganger: {
    name: "Doppelgänger · Duplicate (L9)",
    level: 9,
    hints: [
      "CO-18: exact duplicate. Two claims look identical to the payer's matching algorithm.",
      "Check frequency codes. 0 = original, 7 = replacement, 8 = void. The duplicate is usually a missing 7.",
      "ICN (internal control number) matters — always reference the original ICN on the replacement so the chain is unambiguous.",
    ],
  },
  boss_audit: {
    name: "Audit · The Reckoning (L10)",
    level: 10,
    hints: [
      "Three findings. For each one, you choose RECEIPT (defend with chart evidence) or AMEND (concede + accept the recoupment).",
      "Concede fast on real errors. Don't burn goodwill defending the indefensible — the auditors are reading you for posture.",
      "Documentation > argumentation. If it's in the chart, lead with the chart. If it's not in the chart, you don't have an argument.",
    ],
  },
}
