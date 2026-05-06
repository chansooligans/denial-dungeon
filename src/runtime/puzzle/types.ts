// Runtime puzzle-shape types — the data each encounter feeds the
// PuzzleBattleScene. Mirrors the shape used by the HTML prototypes
// in `src/<encounter>-prototype/main.ts` but stripped down for the
// runtime port (no glossary popovers / briefing popover for now —
// those land in a follow-up).
//
// Encounters opt into the new shape by setting `puzzleSpecId` on
// their entry in `src/content/enemies.ts`. The id is looked up in
// `runtime/puzzle/specs/index.ts`. Encounters without a spec keep
// running through the legacy HP-based BattleScene.

import type { District } from '../../shared/prototype-base'

export type PuzzleVerb = 'amend' | 'cite'

/** One issue on the encounter's checklist. Resolving all = win. */
export interface PuzzleIssue {
  id: string
  /** Player-facing label (rendered on the checklist). */
  label: string
  /** Recap shown in the "What you just did" panel after resolution. */
  recap: string
  /** Which verb resolves this issue. */
  verb: PuzzleVerb
}

/** Pickable phrase in the payer's denial language (the workbench's left col). */
export interface PuzzlePayerPhrase {
  id: string
  /** The verbatim payer text (clickable in the prose). */
  text: string
  /** Plain-English explanation surfaced on hover. */
  plain: string
  /** Which issue this phrase points at. */
  issueId: string
}

/** A fact from the patient chart (the workbench's middle col). */
export interface PuzzleChartFact {
  id: string
  plain: string
  technical: string
  /** Which issue this fact supports. null = distractor. */
  issueId: string | null
  /** If null issueId, why this fact doesn't bear on the appeal. */
  distractorReason?: string
}

/** A clause from the policy/criteria reference (the workbench's right col). */
export interface PuzzlePolicyClause {
  id: string
  plain: string
  technical: string
  /** Source label rendered in the column header (e.g. "NCCI", "LCD L34002"). */
  source?: string
  /** Which issue this clause supports. null = distractor. */
  issueId: string | null
  distractorReason?: string
}

/** Option in an amend modal (replaces a single field on the claim). */
export interface PuzzleAmendOption {
  /** Internal id (often same as the value). */
  id: string
  /** Display label (e.g. "Modifier 25 — significant…"). */
  label: string
  /** Short detail line shown under the label. */
  detail?: string
  /** 'current' = what's already on the claim; 'correct' = the right pick;
   *  'partial' = close-but-not-it; 'wrong' = won't work. */
  support: 'current' | 'correct' | 'partial' | 'wrong'
  /** Feedback shown when this option is picked. */
  feedback: string
}

/** Configuration for a single amend slot on an encounter. */
export interface PuzzleAmendSlot {
  /** Which issue this amend resolves. */
  issueId: string
  /** Field label shown in the modal (e.g. "Box 24 · Modifier"). */
  fieldLabel: string
  /** One-line context shown above the options (e.g. "The chart says…"). */
  contextLine: string
  /** Available options — exactly one should have support: 'correct'. */
  options: PuzzleAmendOption[]
}

/** A single CMS-1500 service line for the rendered claim. */
export interface PuzzleClaimServiceLine {
  dos: string
  pos: string
  cptCode: string
  cptLabel?: string
  modifier?: string
  charges: string
  /** If true, this line is the disputed one (highlighted with the amend
   *  callout pointer). The amend slot's correct option flips this off. */
  disputed?: boolean
}

/** CMS-1500 claim data for the puzzle's claim panel. */
export interface PuzzleClaim {
  claimId: string
  patientName: string
  patientDob: string
  insurer: string
  insuredId: string
  diagnoses: Array<{ code: string; label?: string }>
  serviceLines: PuzzleClaimServiceLine[]
}

/** Top-level puzzle spec — one per encounter that opts into the new shape. */
export interface PuzzleSpec {
  /** Stable id used by encounter.puzzleSpecId. */
  id: string
  /** Encounter title shown in the briefing tag (e.g. "Bundle"). */
  title: string
  /** Curriculum district — drives the accent color. */
  district: District
  /** Hospital intro prose (one paragraph or two). HTML allowed for <em>. */
  hospitalIntro: string[]
  /** Dana's briefing — paragraphs + bullets. */
  briefing: {
    paragraphs: string[]
    bullets: string[]
    signoff: string
  }
  /** The CMS-1500 to render. */
  claim: PuzzleClaim
  /** Issues to resolve. */
  issues: PuzzleIssue[]
  /** The denial paragraph: prose with phrase-id placeholders like {{phrase:bundled}}. */
  payerProse: string
  /** Phrases referenced from payerProse. */
  payerPhrases: PuzzlePayerPhrase[]
  /** Chart facts — middle column of the workbench. */
  chartFacts: PuzzleChartFact[]
  /** Policy clauses — right column of the workbench. */
  policyClauses: PuzzlePolicyClause[]
  /** Source label for the chart column header (e.g. "Chart (Kim, S.)"). */
  chartHeader?: string
  /** Source label for the policy column header (e.g. "NCCI Guidance"). */
  policyHeader?: string
  /** Amend slots for the encounter (Bundle has 1 — the modifier on Box 24). */
  amendSlots: PuzzleAmendSlot[]
  /** Submit button label (e.g. "SUBMIT CORRECTED CLAIM"). */
  submitLabel: string
  /** Victory prose — shown on the victory screen. */
  victory: {
    headline: string
    paragraphs: string[]
  }
}
