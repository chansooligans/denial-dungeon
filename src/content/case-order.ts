// Case ordering — the single source of truth for what order the 32
// Cases appear in the game's narrative arc.
//
// This is a planning surface. The /level-editor.html dev page reads
// this array, lets you drag-reorder, and emits a paste-back snippet
// that you can drop back here.
//
// The current ordering preserves the existing L1-10 sequencing
// (the cases that are already in-game playable, in their existing
// level order) followed by the catalog-only cases grouped roughly
// by district + archetype. Rearrange freely.
//
// Each entry carries enough metadata for the editor to render a
// useful card: id, the human name, the archetype label, the district
// (drives the chip color), whether a runtime puzzle spec exists, and
// the legacy level the case sat on (if any).
//
// NOTE: once the ordering settles, a follow-up PR will regenerate
// `src/content/levels.ts` from this array (one level per case). For
// now, levels.ts still has its 10-entry shape; this file is just
// the planning layer.

export type District = 'eligibility' | 'coding' | 'billing' | 'appeals' | 'release-valve'

export interface CaseEntry {
  /** Stable id — matches the case-prototype directory name and
   *  the key in `src/content/case-recaps.ts`. */
  id: string
  /** Human name shown in the editor + catalog. */
  name: string
  /** Archetype label (Wraith, Bundle, Specter, etc.). */
  archetype: string
  /** District accent. Drives the editor's color chip. */
  district: District
  /** If true, the case has a runtime puzzle spec wired to an
   *  in-game encounter — it's actually playable inside the game
   *  (not just on the standalone catalog page). */
  hasRuntimeSpec: boolean
  /** The legacy level this case sat on in the 10-level shape, or
   *  null if it was catalog-only. Preserved for migration reference. */
  legacyLevel: number | null
  /** One-line gloss for the card subtitle. Pulled from the recap or
   *  the prototype's hospital-intro line. Kept short. */
  gloss: string
}

export const CASE_ORDER: CaseEntry[] = [
  // ===== L1-10 in-game playable cases (legacy order) =====
  {
    id: 'intro',
    name: 'The Wrong Card',
    archetype: 'Wrong Card',
    district: 'eligibility',
    hasRuntimeSpec: true,
    legacyLevel: 1,
    gloss: "Anjali handed her husband's insurance card at check-in. Subscriber ID mismatch.",
  },
  {
    id: 'fog',
    name: 'Eligibility Fog',
    archetype: 'Fog',
    district: 'eligibility',
    hasRuntimeSpec: true,
    legacyLevel: 2,
    gloss: 'Stale insurance card; new plan since the patient changed jobs.',
  },
  {
    id: 'gatekeeper',
    name: 'Prior-Auth Gatekeeper',
    archetype: 'Gatekeeper',
    district: 'eligibility',
    hasRuntimeSpec: true,
    legacyLevel: 3,
    gloss: 'No auth on file for an MRI. Polite, immovable, fixable.',
  },
  {
    id: 'wraith',
    name: 'Medical Necessity Wraith',
    archetype: 'Wraith',
    district: 'appeals',
    hasRuntimeSpec: true,
    legacyLevel: 3,
    gloss: 'CO-50 echo denial. Citation-chain appeal across three sources.',
  },
  {
    id: 'bundle',
    name: 'Bundling Beast',
    archetype: 'Bundle',
    district: 'coding',
    hasRuntimeSpec: true,
    legacyLevel: 4,
    gloss: 'CO-97 bundle. Modifier 25 + chart support for a separately identifiable E&M.',
  },
  {
    id: 'swarm',
    name: 'Documentation Sprite Swarm',
    archetype: 'Swarm',
    district: 'eligibility',
    hasRuntimeSpec: true,
    legacyLevel: 6,
    gloss: 'CO-16 catch-all batch. Read the RARC, find the upstream break.',
  },
  {
    id: 'reaper',
    name: 'Timely Filing Reaper',
    archetype: 'Reaper',
    district: 'appeals',
    hasRuntimeSpec: true,
    legacyLevel: 7,
    gloss: 'CO-29 timely filing. 277CA evidence + extenuating-circumstances waiver.',
  },
  {
    id: 'surprise-bill',
    name: 'Surprise Bill Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: true,
    legacyLevel: 8,
    gloss: 'NSA-protected balance bill. Recalculate cost-share, route the OON fight to IDR.',
  },
  {
    id: 'lighthouse',
    name: 'Lighthouse',
    archetype: 'Lighthouse',
    district: 'release-valve',
    hasRuntimeSpec: true,
    legacyLevel: 8,
    gloss: 'Charity-care / §501(r) financial assistance for a patient with no path to pay.',
  },
  {
    id: 'doppelganger',
    name: 'Doppelgänger',
    archetype: 'Doppelgänger',
    district: 'billing',
    hasRuntimeSpec: true,
    legacyLevel: 9,
    gloss: 'CO-18 duplicate. Frequency-code-7 replacement referencing the original ICN.',
  },
  {
    id: 'audit-boss',
    name: 'The Quarterly Audit',
    archetype: 'Audit Boss',
    district: 'appeals',
    hasRuntimeSpec: true,
    legacyLevel: 10,
    gloss: 'Three audit findings. RECEIPT vs AMEND. The reckoning.',
  },

  // ===== Catalog-only cases (legacy: prototype-only, never wired in-game) =====
  // Grouped roughly by district + archetype for a sensible starting order.
  // Drag-reorder freely in /level-editor.html.

  // Eligibility / Coverage
  {
    id: 'cob-cascade-spider',
    name: 'COB Cascade Spider',
    archetype: 'Spider',
    district: 'eligibility',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Multi-payer coordination of benefits — Medicare + retiree + spouse plan cascade.',
  },
  {
    id: 'phantom-patient',
    name: 'Phantom Patient',
    archetype: 'Phantom',
    district: 'eligibility',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Identity-matching collision — two patients, one demographic profile.',
  },
  {
    id: 'credentialing-lattice',
    name: 'Credentialing Lattice',
    archetype: 'Lattice',
    district: 'eligibility',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: "Provider credentialing gap — claim denied because the doc isn't credentialed with this plan yet.",
  },

  // Coding
  {
    id: 'form-mirror',
    name: 'Form Mirror',
    archetype: 'Mirror',
    district: 'coding',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'CMS-1500 vs UB-04 — which form does this service belong on?',
  },
  {
    id: 'cpt-licensure-mire',
    name: 'CPT Licensure Mire',
    archetype: 'Mire',
    district: 'coding',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'AMA CPT licensing edges — code mapping, derivative-work limits, public-domain alternatives.',
  },
  {
    id: 'outpatient-surgery-grouper',
    name: 'Outpatient Surgery Grouper',
    archetype: 'Grouper',
    district: 'coding',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'APC grouping for outpatient surgery — packaging rules + status indicators.',
  },
  {
    id: 'risk-adj-hollow',
    name: 'Risk Adjustment Hollow',
    archetype: 'Hollow',
    district: 'coding',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'HCC capture — chronic condition coded once a year, dropped the next, RAF score evaporates.',
  },
  {
    id: 'two-midnight-mire',
    name: 'Two-Midnight Mire',
    archetype: 'Mire',
    district: 'coding',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Inpatient vs observation — Medicare 2-midnight rule + medical-necessity overlay.',
  },

  // Billing — underpayments + carve-outs
  {
    id: 'specter',
    name: 'Underpayment Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: true, // wired via legacy `specter` spec (catalog ↔ runtime mismatch)
    legacyLevel: null,
    gloss: 'CO-45 underpayment — contract says one rate, payment shows another.',
  },
  {
    id: 'case-rate-specter',
    name: 'Case-Rate Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Case-rate vs per-diem mismatch — multi-day stay paid as a single bundle.',
  },
  {
    id: 'chemo-bundle-specter',
    name: 'Chemo Bundle Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Chemotherapy bundled into the case rate; admin code dropped, claim under-pays.',
  },
  {
    id: 'implant-carveout-specter',
    name: 'Implant Carve-Out Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Implant cost above stoploss — invoice carve-out missed by the contract.',
  },
  {
    id: 'ob-perdiem-specter',
    name: 'OB Per-Diem Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'OB per-diem with C-section escalator — payer paid the base rate only.',
  },
  {
    id: 'stoploss-reckoner',
    name: 'Stoploss Reckoner',
    archetype: 'Reckoner',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'High-cost case crossing the stoploss threshold — % outlier vs charges audit.',
  },
  {
    id: 'three-forty-b-specter',
    name: '340B Specter',
    archetype: 'Specter',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: '340B-eligible drug paid at non-340B rate post-Becerra clawback.',
  },
  {
    id: 'asp-wac-apothecary',
    name: 'ASP / WAC Apothecary',
    archetype: 'Apothecary',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Part B drug pricing — ASP vs WAC, J-code unit dose, NDC↔HCPCS crosswalk.',
  },
  {
    id: 'carveout-phantom',
    name: 'Carve-Out Phantom',
    archetype: 'Phantom',
    district: 'billing',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Two bills for one ER visit — NSA carve-out routes the OON physician fight to IDR.',
  },

  // Appeals / Compliance
  {
    id: 'idr-crucible',
    name: 'IDR Crucible',
    archetype: 'Crucible',
    district: 'appeals',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Baseball-style arbitration — submit one number, pick a number, defend the math.',
  },
  {
    id: 'gfe-oracle',
    name: 'Good Faith Estimate Oracle',
    archetype: 'Oracle',
    district: 'appeals',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'GFE accuracy — patient billed over the threshold, opens the appeal path.',
  },
  {
    id: 'mrf-cartographer',
    name: 'MRF Cartographer',
    archetype: 'Cartographer',
    district: 'appeals',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Machine-Readable Files — read the payer rate sheet, find the negotiated rate hidden in 8 GB of JSON.',
  },
  {
    id: 'hipaa-spider',
    name: 'HIPAA Spider',
    archetype: 'Spider',
    district: 'appeals',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'Breach response — four-factor assessment, notification thresholds, OCR follow-up.',
  },

  // Release-valve / patient-facing
  {
    id: 'no-show-bill',
    name: 'No-Show Bill',
    archetype: 'Lighthouse companion',
    district: 'release-valve',
    hasRuntimeSpec: false,
    legacyLevel: null,
    gloss: 'No-show fee policy — when to waive, when to enforce, what the patient hears.',
  },
]

/** Lookup helper. */
export function caseById(id: string): CaseEntry | undefined {
  return CASE_ORDER.find(c => c.id === id)
}

/** Sanity: at module load, confirm no duplicate ids. */
const _seenIds = new Set<string>()
for (const c of CASE_ORDER) {
  if (_seenIds.has(c.id)) {
    throw new Error(`Duplicate case id in CASE_ORDER: ${c.id}`)
  }
  _seenIds.add(c.id)
}
