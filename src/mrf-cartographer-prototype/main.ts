// MRF Cartographer @ L8 — pricing-transparency Case.
//
// First Case where the deliverable is a regulatory file, not a
// claim packet. Mercy's machine-readable file (MRF) is due for
// refresh under the Hospital Price Transparency rule; the player
// sits with the chargemaster open in one window and twelve months
// of claims open in another, and assembles the MRF row by row.
//
// The lever is *which source of truth to pull from per service*.
//   - HARD-CODED services (room/board, surgical case rates, fixed
//     CDM lines that all payers pay near the same number) come
//     straight off the chargemaster — one rate per service.
//   - SOFT-CODED services (lab/imaging panels, supplies, PT, drugs)
//     don't have a stable code-rate pair; the chargemaster price
//     bears no relationship to what payers actually pay. The
//     truth is in the claim history, aggregated correctly.
//
// Verbs:
//   - MAP: classify each service hard-coded or soft-coded.
//   - ESTIMATE: for soft-coded services, pick the right statistic
//     to summarize the claim history (median per payer, NOT mean,
//     NOT max, NOT chargemaster).
//   - RECONCILE: submit the MRF batch and let the schema validator
//     check that hard-coded rows came from CDM and soft-coded rows
//     came from claims.
//
// Demonstrates: pricing transparency is real RCM work, the
// chargemaster is not the truth, and "what to publish" is a
// classification puzzle.
//
// Author: May 2026. Modeled on Swarm (queue) + Case Rate Specter
// (apply/reject decision lattice).
import { BASE_CSS, districtVars, escape } from '../shared/prototype-base'

// ===== Domain types =====

type ServiceKind = 'hard' | 'soft'

interface CdmEntry {
  /** Chargemaster gross charge — the rack-rate sticker price. */
  charge: number
}

interface ClaimSample {
  /** Payer name shown in the historical-claims table. */
  payer: string
  /** What the payer's contract pays per unit/encounter. */
  rate: number
  /** How many of those claims appear in the 12-month sample. */
  count: number
}

interface Service {
  id: string
  /** CPT/HCPCS/DRG/CDM code. */
  code: string
  /** Plain-English service description. */
  label: string
  /** Pedagogical hint about the service's pricing shape. */
  shape: string
  /** True kind. Player has to discover this; UI hides it until classified. */
  kind: ServiceKind
  /** Why this service is hard-coded or soft-coded; shown post-classify. */
  kindReason: string
  /** Chargemaster line item (always present — but for soft-coded this is the wrong source). */
  cdm: CdmEntry
  /** 12-month claim sample. Empty for hard-coded services where claim variance is below the rounding floor. */
  claims: ClaimSample[]
  /** The correct rate to publish for this service. */
  correctRate: number
}

interface AggregationOption {
  id: string
  label: string
  /** What it computes against the CMP claim sample. */
  amount: number
  correct: boolean
  feedback: string
}

interface Issue {
  id: string
  label: string
  recap: string
  verb: 'map' | 'estimate' | 'reconcile'
}

interface GlossaryEntry {
  term: string
  plain: string
}

// ===== Encounter data =====

const services: Service[] = [
  {
    id: 'xray-skull',
    code: '70250',
    label: 'X-ray, skull, complete (4+ views)',
    shape: 'Imaging — single fixed CDM rate; payer variance < 3%.',
    kind: 'hard',
    kindReason: "Fixed rate per study. Every payer pays close to the CDM line; the variance is below the MRF's rounding floor. Pull from CDM.",
    cdm: { charge: 185 },
    claims: [],
    correctRate: 185,
  },
  {
    id: 'cmp-lab',
    code: '80053',
    label: 'Comprehensive metabolic panel',
    shape: 'Lab panel — heavily negotiated; CDM is fiction.',
    kind: 'soft',
    kindReason: "CDM says $48; no commercial payer pays $48. Lab CPTs are negotiated case-by-case per payer; the truth is the median rate per payer in the claim history.",
    cdm: { charge: 48 },
    claims: [
      { payer: 'Anthem PPO',    rate: 16, count: 142 },
      { payer: 'BCBS HMO',      rate: 14, count: 88  },
      { payer: 'Aetna',         rate: 18, count: 76  },
      { payer: 'UHC',           rate: 22, count: 64  },
      { payer: 'Cigna',         rate: 20, count: 52  },
      { payer: 'Medicare Adv',  rate: 12, count: 41  },
      { payer: 'Medicaid MCO',  rate: 8,  count: 29  },
    ],
    // The "median" answer: median of the per-payer rates is $16
    // (sorted: 8, 12, 14, 16, 18, 20, 22 → middle = 16).
    correctRate: 16,
  },
  {
    id: 'drg-470',
    code: 'DRG 470',
    label: 'Major joint replacement, lower extremity, no MCC',
    shape: 'Inpatient case rate — fixed per payer per DRG.',
    kind: 'hard',
    kindReason: "Inpatient DRGs price at a contractually fixed case rate per payer. The CDM carries the standard charge; the contract carries the case rate. Either way it's hard-coded — there's no statistical aggregation to do.",
    cdm: { charge: 14_000 },
    claims: [],
    correctRate: 14_000,
  },
  {
    id: 'iv-saline',
    code: 'J7030',
    label: 'Saline infusion solution, 1000mL (per dose)',
    shape: 'Drug/supply — per-unit pricing; payer rates wander.',
    kind: 'soft',
    kindReason: "Drugs and supplies bill as separate units; payers price them differently and most pay below CDM. Soft-coded — pick from claim history, not CDM.",
    cdm: { charge: 32 },
    claims: [
      { payer: 'Anthem PPO',    rate: 6,  count: 220 },
      { payer: 'BCBS HMO',      rate: 5,  count: 150 },
      { payer: 'Aetna',         rate: 7,  count: 110 },
      { payer: 'UHC',           rate: 8,  count: 95  },
      { payer: 'Medicare Adv',  rate: 4,  count: 80  },
    ],
    // Median per-payer rate: sorted 4, 5, 6, 7, 8 → 6.
    correctRate: 6,
  },
]

// Aggregation options shown when player drills into a soft-coded
// service to pick the right statistic. These are computed against
// the CMP sample (the encounter's "anchor" soft-coded service);
// the player makes one pick and that pick locks in the method
// across all soft-coded services for the encounter.
const cmpAggregations: AggregationOption[] = [
  {
    id: 'cdm-charge',
    label: 'Chargemaster charge ($48)',
    amount: 48,
    correct: false,
    feedback: 'CDM is the rack rate. Publishing CDM as the negotiated rate misrepresents the contract — the MRF is supposed to show what payers actually pay, not what the hospital wishes it could collect.',
  },
  {
    id: 'mean',
    label: 'Mean of all sample claims (charge-weighted) ≈ $16.0',
    amount: 16.0,
    correct: false,
    feedback: 'Mean of charges is dominated by the highest-volume payers. CMS guidance asks for the per-payer negotiated rate, which means a representative central tendency *per payer* — not a weighted average across them.',
  },
  {
    id: 'max',
    label: 'Max negotiated rate ($22)',
    amount: 22,
    correct: false,
    feedback: "Max overstates and benefits the hospital at the patient's expense. The MRF is a transparency document, not a bargaining tool. Wrong direction.",
  },
  {
    id: 'mode',
    label: 'Mode (most-paid contract level) — none repeated, no stable mode',
    amount: 16,
    correct: false,
    feedback: "Mode requires repeated values across payers. Each payer here pays a different number; mode collapses to undefined. Median is the right summary.",
  },
  {
    id: 'median',
    label: 'Median of per-payer negotiated rates ($16)',
    amount: 16,
    correct: true,
    feedback: 'Right. Median per payer is robust to outliers, matches the CMS hospital-price-transparency guidance for "estimated allowed amount," and is what every other transparency vendor publishes. Lock this method across the soft-coded rows.',
  },
]

const issues: Issue[] = [
  {
    id: 'classify',
    label: 'Classify each service hard-coded (CDM is truth) or soft-coded (claims are truth).',
    recap: `You sorted four services. Two are hard-coded: imaging studies with payer variance under the rounding floor, and the inpatient DRG case rate that's contractually fixed per payer. Two are soft-coded: a lab panel and a supply line, both with CDM prices that bear no relation to what payers actually pay.`,
    verb: 'map',
  },
  {
    id: 'estimate',
    label: 'For soft-coded services, pick the right statistic from claim history.',
    recap: `You picked median per payer. Robust to outliers, matches CMS guidance, and applies the same way to the CMP lab line ($16) and the IV saline line ($6). Locked across soft-coded rows.`,
    verb: 'estimate',
  },
  {
    id: 'reconcile',
    label: 'Reconcile and publish the MRF batch.',
    recap: `Four rows submitted. Hard-coded rows pulled from CDM ($185, $14,000); soft-coded rows pulled from the claim-history median ($16, $6). Schema validates. CMS deadline cleared.`,
    verb: 'reconcile',
  },
]

const glossary: Record<string, GlossaryEntry> = {
  'MRF': {
    term: 'MRF (Machine-Readable File)',
    plain: "A standardized file every hospital must publish under the federal Hospital Price Transparency rule (45 CFR 180.50). One row per service per payer per plan, listing gross charge, discounted-cash price, payer-specific negotiated rates, and de-identified min/max. Updated at least monthly. CMS audits compliance; recent fines have hit seven figures per hospital.",
  },
  'CDM': {
    term: 'CDM (Chargemaster)',
    plain: "The hospital's master price list. Every billable service has a CDM line with a gross charge — the 'sticker price.' The CDM is the source of truth for fixed-rate services (imaging, room/board) but is mostly fiction for soft-coded ones; payers negotiate the actual price down to a fraction of CDM. The CDM is what shows up on a self-pay bill before discounts.",
  },
  'hard-coded': {
    term: 'Hard-coded service',
    plain: "A service whose price is the same number across all payers, give or take rounding. Imaging studies, room/board per-diems, surgical case rates by DRG. The CDM (or the contracted case rate) is the source of truth. Hard-coded services bypass the claim-aggregation step in MRF generation.",
  },
  'soft-coded': {
    term: 'Soft-coded service',
    plain: "A service whose price varies by payer, often dramatically. Lab panels, supplies, drugs (J-codes), therapy units. The CDM rate is rarely meaningful; the truth lives in the claim history, summarized as the median negotiated rate per payer. Most of the action in MRF generation is figuring out which services are soft-coded and pulling their rates from claims.",
  },
  'CMS': {
    term: 'CMS (Centers for Medicare & Medicaid Services)',
    plain: "The federal agency that runs Medicare and oversees Medicaid. Issues the rules every hospital and payer follows: the MRF schema, NCCI edits, the OPPS/IPPS payment systems, the CARC/RARC code list. When CMS publishes a rule, hospitals comply or face penalties.",
  },
  'price transparency': {
    term: 'Hospital price transparency',
    plain: "The federal rule (effective 2021, sharpened 2024) requiring hospitals to publish a machine-readable file of standard charges plus a consumer-friendly display of 300 shoppable services. The intent: let patients compare prices. The reality: most files are inconsistently formatted, and most patients don't read them. Compliance is the floor, not the ceiling.",
  },
  'median per payer': {
    term: 'Median per payer',
    plain: "The right central-tendency for soft-coded MRF rows. For each unique payer in the claim history, take the rate they paid; sort the per-payer rates; pick the middle one. Robust to high-volume single-payer outliers (which would skew a charge-weighted mean) and to single-claim oddities (which would skew a max or min).",
  },
  'soft-coded vs hard-coded': {
    term: 'Soft-coded vs hard-coded (in CDM context)',
    plain: "The CDM has two kinds of lines. Hard-coded lines have a fixed rate that all payers pay near (the variance is below the MRF rounding floor). Soft-coded lines have a CDM rate that's mostly aspirational; payers pay a small fraction. Knowing which is which is the entire MRF generation puzzle — pull the right number from the right source.",
  },
}

// ===== Runtime state =====

interface ServiceState {
  /** Player's classification — null if not yet sorted. */
  classification: ServiceKind | null
  /** Player attempted classify; if wrong, log here for transient feedback. */
  lastWrong: ServiceKind | null
}

const state = {
  briefingDone: false,
  briefingOpen: false,
  /** Per-service classification + feedback. */
  serviceStates: services.reduce((m, s) => { m[s.id] = { classification: null, lastWrong: null }; return m }, {} as Record<string, ServiceState>),
  /** Service the player is currently inspecting (for the soft-coded estimate panel). */
  inspectingId: null as string | null,
  /** The aggregation method the player picked; locks once set. */
  appliedAggregationId: null as string | null,
  transientFeedback: null as { id: string; message: string; kind: 'good' | 'bad' } | null,
  resolvedIssues: new Set<string>(),
  failedAttempts: 0,
  packetSubmitted: false,
  openTermId: null as string | null,
}

function isClassifyDone(): boolean {
  return services.every(s => state.serviceStates[s.id].classification === s.kind)
}
function isEstimateDone(): boolean {
  if (!isClassifyDone()) return false
  const f = cmpAggregations.find(a => a.id === state.appliedAggregationId)
  return !!f && f.correct
}
function softCodedServices(): Service[] {
  return services.filter(s => s.kind === 'soft')
}

// ===== Render =====

function term(termId: string, displayText?: string): string {
  const entry = glossary[termId]
  const text = displayText ?? termId
  if (!entry) return escape(text)
  return `<span class="term" data-action="open-term" data-term="${termId}">${escape(text)}<span class="term-icon">?</span></span>`
}

function money(n: number): string {
  return '$' + Math.round(n).toLocaleString()
}

function render(): string {
  if (state.packetSubmitted) {
    return renderHeader() + renderVictory() + renderTermPopover() + renderBriefingPopover()
  }
  return `
    ${renderHeader()}
    ${renderHospitalIntro()}
    ${!state.briefingDone ? renderBriefingInline() : `
      ${renderClassifyPanel()}
      ${renderEstimatePanel()}
      ${renderInspector()}
      ${renderPublishPanel()}
      ${renderChecklist()}
    `}
    ${state.briefingDone ? '' : renderDesignNotes()}
    ${renderTermPopover()}
    ${renderBriefingPopover()}
  `
}

function renderHeader(): string {
  const recallBtn = state.briefingDone
    ? `<button class="recall-btn" data-action="show-briefing">📜 Dana's note</button>`
    : ''
  return `
    <header class="page-h">
      <div class="title-row">
        <h1>MRF Cartographer <span class="muted">@ L8 — first sketch</span></h1>
        <div class="header-actions">
          ${recallBtn}
          <a class="back-link" href="./prototypes.html">← back to catalog</a>
        </div>
      </div>
      ${state.briefingDone ? '' : `
        <p class="lede">
          A pricing-transparency Case. Mercy's
          ${term('MRF')} refresh is due in seven days; the
          ${term('CDM')} sits open in one window and twelve
          months of claims sit open in another. The puzzle is
          which source of truth to pull from per service —
          ${term('hard-coded')} services come from CDM, but
          ${term('soft-coded')} ones come from the claim
          history, summarized correctly. New verbs: MAP,
          ESTIMATE, RECONCILE. See the
          <a href="#design-notes">design notes</a>.
        </p>
      `}
    </header>
  `
}

function renderHospitalIntro(): string {
  return `
    <section class="hospital-intro">
      <div class="register hospital">HOSPITAL · early morning</div>
      <p>
        Theo from compliance leans on your desk with a printed
        ${term('CMS')} notice. "${term('price transparency')} audit. Our
        ${term('MRF')} is stale. Four service rows came back flagged.
        Refresh them by Friday or we eat a fine."
      </p>
      <p>
        Behind him on a second monitor: the ${term('CDM')} on the left, the
        12-month claims warehouse on the right. "Some of these you can
        pull straight off the chargemaster. Some of them — don't. Pulling
        CDM for a soft-coded line is exactly how this got flagged in the
        first place."
      </p>
      <div class="register-flip">
        <div class="ripple"></div>
        <em>— and the lights flicker, bluish. The CDM and the claims
        slide a half-pixel left, then settle. The four services sit
        in a queue, waiting for you to map them.</em>
      </div>
      <div class="register waiting-room">WAITING ROOM · now</div>
    </section>
  `
}

function renderBriefingInline(): string {
  return `
    <section class="briefing">
      ${briefingContent()}
      <button class="btn primary" data-action="dismiss-briefing">
        Got it — start the encounter
      </button>
    </section>
  `
}

function briefingContent(): string {
  return `
    <div class="briefing-h">
      <span class="briefing-tag">DANA, IN YOUR EAR</span>
      <span class="briefing-sub">${state.briefingDone ? 'Re-reading her note.' : 'A non-claim Case. Different muscle.'}</span>
    </div>
    <div class="briefing-body">
      <p>
        "${term('MRF')} day. The deliverable isn't a packet — it's a regulatory
        file. CMS reads it; patients read it (some of them); plaintiffs'
        attorneys definitely read it. We have to publish what payers
        actually pay, not what the ${term('CDM')} pretends they do."
      </p>
      <p>
        "Three issues:"
      </p>
      <ul>
        <li>
          <strong>Classify.</strong> ${term('hard-coded')} or
          ${term('soft-coded')}? Hard-coded lines (imaging, DRG case
          rates) come straight off the CDM — one number, all payers.
          Soft-coded lines (labs, supplies, drugs, therapy) — CDM is
          fiction. Pull the truth from the claims. <em>New verb: MAP.</em>
        </li>
        <li>
          <strong>Estimate.</strong> For the soft-coded ones, pick a
          summary statistic. Mean is wrong (charge-weighted skew),
          mode is wrong (no stable repeat), max is wrong (overstates),
          chargemaster is wrong (the whole reason we're in compliance
          for). One right answer. <em>New verb: ESTIMATE.</em>
        </li>
        <li>
          <strong>Reconcile.</strong> Submit the MRF batch. The schema
          validator double-checks that hard-coded rows came from CDM
          and soft-coded rows came from the median. Wrong source = the
          row gets rejected and you publish stale data."
        </li>
      </ul>
      <p>
        "The sneaky part: the CDM <em>looks</em> authoritative. It's
        the master price list. It's just not the master <em>paid</em>
        list. Most rookies pull CDM for everything; that's exactly
        the audit finding we're refreshing for."
      </p>
      <p class="briefing-sign">"Don't be most people. — D."</p>
    </div>
  `
}

function renderBriefingPopover(): string {
  if (!state.briefingOpen) return ''
  return `
    <div class="briefing-popover-backdrop">
      <div class="briefing-popover">
        <button class="briefing-popover-close" data-action="close-briefing" aria-label="Close">×</button>
        ${briefingContent()}
        <button class="btn ghost" data-action="close-briefing">Back to the encounter</button>
      </div>
    </div>
  `
}

function renderClassifyPanel(): string {
  const done = state.resolvedIssues.has('classify')
  return `
    <section class="classify-panel ${done ? 'done' : ''}">
      <div class="cp-h">
        <span class="cp-tag">SERVICE QUEUE · 4 rows for the ${term('MRF')}</span>
        <span class="cp-sub">${done
          ? 'All four classified. Two hard-coded (CDM), two soft-coded (claim median).'
          : 'For each row, decide whether the chargemaster line is the source of truth or whether the claim history is.'}</span>
      </div>
      <table class="svc-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Service</th>
            <th>Pricing shape (hint)</th>
            <th class="right">CDM</th>
            <th>Classify</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(s => renderServiceRow(s)).join('')}
        </tbody>
      </table>
      ${state.transientFeedback && services.some(s => s.id === state.transientFeedback!.id)
        ? `<div class="feedback fb-${state.transientFeedback.kind}">${escape(state.transientFeedback.message)}</div>`
        : ''}
      ${done ? renderRecap('classify') : ''}
    </section>
  `
}

function renderServiceRow(s: Service): string {
  const ss = state.serviceStates[s.id]
  const classified = ss.classification !== null
  return `
    <tr class="svc-row ${classified ? 'classified ' + ss.classification : ''}">
      <td><code>${escape(s.code)}</code></td>
      <td>${escape(s.label)}</td>
      <td class="muted-cell">${escape(s.shape)}</td>
      <td class="right">${money(s.cdm.charge)}</td>
      <td class="classify-cell">
        ${classified ? `
          <span class="kind-badge ${ss.classification}">${ss.classification === 'hard' ? 'HARD-CODED · pull CDM' : 'SOFT-CODED · pull claims'}</span>
          <button class="btn ghost small" data-action="reset-classification" data-id="${s.id}">↺ undo</button>
        ` : `
          <button class="btn small ghost" data-action="classify" data-id="${s.id}" data-kind="hard">Hard-coded</button>
          <button class="btn small ghost" data-action="classify" data-id="${s.id}" data-kind="soft">Soft-coded</button>
        `}
      </td>
    </tr>
  `
}

function renderEstimatePanel(): string {
  const unlocked = state.resolvedIssues.has('classify')
  const done = state.resolvedIssues.has('estimate')
  if (!unlocked) {
    return `
      <section class="estimate-panel locked">
        <div class="ep-h">
          <span class="ep-tag idle">ESTIMATE WORKBENCH</span>
          <span class="ep-sub">Locked until every service is classified. Sort the four rows above first.</span>
        </div>
      </section>
    `
  }
  if (state.appliedAggregationId === null) {
    return `
      <section class="estimate-panel active">
        <div class="ep-h">
          <span class="ep-tag active">ESTIMATE WORKBENCH</span>
          <span class="ep-sub">Two soft-coded services need rates. Open one to pick the aggregation method — your pick locks across both.</span>
        </div>
        <div class="ep-soft-list">
          ${softCodedServices().map(s => `
            <button class="soft-svc-card ${state.inspectingId === s.id ? 'inspecting' : ''}" data-action="inspect" data-id="${s.id}">
              <span class="ssc-code"><code>${escape(s.code)}</code></span>
              <span class="ssc-label">${escape(s.label)}</span>
              <span class="ssc-cta">${state.inspectingId === s.id ? 'Inspecting →' : 'Open claim history →'}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `
  }
  return `
    <section class="estimate-panel done">
      <div class="ep-h">
        <span class="ep-tag done">ESTIMATE WORKBENCH</span>
        <span class="ep-sub">Median per payer locked across soft-coded rows. CMP → ${money(16)}. IV saline → ${money(6)}.</span>
      </div>
      ${renderRecap('estimate')}
    </section>
  `
}

function renderInspector(): string {
  if (!state.resolvedIssues.has('classify')) return ''
  if (state.appliedAggregationId !== null) return ''
  if (!state.inspectingId) return ''
  const s = services.find(x => x.id === state.inspectingId)
  if (!s || s.kind !== 'soft') return ''
  return `
    <section class="inspector-panel">
      <div class="ip-h">
        <span class="ip-tag">CLAIM HISTORY · ${escape(s.code)} — ${escape(s.label)}</span>
        <span class="ip-sub">12-month sample. CDM line says ${money(s.cdm.charge)}; payers actually paid the rates below.</span>
      </div>
      <table class="claim-history">
        <thead>
          <tr><th>Payer</th><th class="right">Negotiated rate</th><th class="right">Claim count (12 mo)</th></tr>
        </thead>
        <tbody>
          ${s.claims.map(c => `
            <tr>
              <td>${escape(c.payer)}</td>
              <td class="right">${money(c.rate)}</td>
              <td class="right">${c.count.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="ip-aggregations">
        <p class="ip-prompt">Pick the right aggregation. Locks across all soft-coded rows for this MRF batch.</p>
        <ul class="agg-list">
          ${cmpAggregations.map(a => renderAggregation(a)).join('')}
        </ul>
        ${state.transientFeedback && cmpAggregations.some(a => a.id === state.transientFeedback!.id)
          ? `<div class="feedback fb-${state.transientFeedback.kind}">${escape(state.transientFeedback.message)}</div>`
          : ''}
      </div>
    </section>
  `
}

function renderAggregation(a: AggregationOption): string {
  return `
    <li class="agg">
      <button class="agg-btn" data-action="apply-aggregation" data-id="${a.id}">
        <span class="agg-label">${escape(a.label)}</span>
      </button>
    </li>
  `
}

function renderPublishPanel(): string {
  const ready = state.resolvedIssues.has('classify') && state.resolvedIssues.has('estimate')
  const done = state.resolvedIssues.has('reconcile')
  const cls = !ready ? 'idle' : (done ? 'done' : 'active')
  return `
    <section class="publish-panel ${cls}">
      <div class="pp-h">
        <span class="pp-tag">${done ? 'MRF PUBLISHED' : 'PUBLISH MRF BATCH'}</span>
        <span class="pp-sub">${done
          ? 'Four rows submitted. Schema validates. CMS deadline cleared.'
          : !ready
            ? 'Locked until classification + estimation are both done.'
            : 'Review the four rows. Hard-coded → CDM rate; soft-coded → median per payer. Click publish.'}</span>
      </div>
      ${ready ? `
        <table class="mrf-preview">
          <thead>
            <tr>
              <th>Code</th>
              <th>Service</th>
              <th>Source</th>
              <th class="right">Published rate</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td><code>${escape(s.code)}</code></td>
                <td>${escape(s.label)}</td>
                <td>${s.kind === 'hard' ? 'CDM (fixed)' : 'Claim history (median per payer)'}</td>
                <td class="right">${money(s.correctRate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      ${done ? renderRecap('reconcile') : ''}
    </section>
  `
}

function renderRecap(issueId: string): string {
  const issue = issues.find(i => i.id === issueId)
  if (!issue) return ''
  return `
    <div class="recap">
      <div class="recap-h">RECAP · ${issue.verb.toUpperCase()}</div>
      <p>${escape(issue.recap)}</p>
    </div>
  `
}

function renderChecklist(): string {
  const allDone = issues.every(i => state.resolvedIssues.has(i.id))
  return `
    <section class="checklist">
      <div class="checklist-h">MRF DELIVERABLE · 3 issues to resolve</div>
      <ul>
        ${issues.map(i => {
          const done = state.resolvedIssues.has(i.id)
          return `
            <li class="${done ? 'done' : ''}">
              <span class="check">${done ? '✓' : '○'}</span>
              <div class="issue-body">
                <div class="issue-label">${escape(i.label)}</div>
              </div>
            </li>
          `
        }).join('')}
      </ul>
      ${state.failedAttempts > 0 ? `<p class="fail-counter">Wrong picks so far: ${state.failedAttempts}.</p>` : ''}
      <button class="btn submit ${allDone ? '' : 'disabled'}" data-action="submit" ${allDone ? '' : 'disabled'}>
        Submit MRF batch · 4 rows
      </button>
    </section>
  `
}

function renderTermPopover(): string {
  if (!state.openTermId) return ''
  const entry = glossary[state.openTermId]
  if (!entry) return ''
  return `
    <div class="term-popover-backdrop" data-action="close-term">
      <div class="term-popover">
        <div class="term-popover-h">
          <span class="term-popover-name">${escape(entry.term)}</span>
          <button class="term-popover-close" data-action="close-term" aria-label="Close">×</button>
        </div>
        <p>${escape(entry.plain)}</p>
      </div>
    </div>
  `
}

function renderVictory(): string {
  return `
    <section class="victory">
      <div class="register waiting-room">MRF PUBLISHED</div>
      <h2>Four rows shipped. CMS deadline cleared.</h2>
      <p>
        Hard-coded rows pulled from the chargemaster. Soft-coded rows
        pulled from the median per-payer rate across twelve months of
        claims. Schema validator returned clean. The price-transparency
        page on the public site refreshes overnight.
      </p>
      <p class="muted">
        The trick wasn't the math — it was knowing which source to
        use. The CDM looks authoritative because it <em>is</em>, just
        not for soft-coded services. Most hospitals publish CDM
        across the board because that's the default; that's also
        why most ${term('MRF')} files are technically compliant and
        practically useless. Yours isn't.
      </p>
      <div class="register hospital">HOSPITAL · later that morning</div>
      <p>
        Theo drops the CMS clearance letter on your desk. "Audit
        passes. They'll check us again next quarter; same drill,
        new rows." He slides you the next docket. "${escape("Aetna's")} GFE
        rules just changed; we're going to need to publish good-faith
        estimates against this MRF. Different file, same source-of-
        truth puzzle."
      </p>
      <button class="btn primary" data-action="reset">Run it again</button>
      <a class="back-link inline" href="./prototypes.html">← back to catalog</a>
    </section>
  `
}

function renderDesignNotes(): string {
  return `
    <section class="design-notes" id="design-notes">
      <h2>Design notes</h2>
      <div class="notes-grid">
        <div>
          <h3>What this Case tests</h3>
          <ul>
            <li><strong>Three new verbs:</strong> MAP (classify),
            ESTIMATE (pick the right statistic), RECONCILE (submit).
            All three feed each other in sequence — gating the
            second on the first prevents the player from publishing
            the wrong source.</li>
            <li><strong>The chargemaster is not the truth.</strong>
            For soft-coded services, the CDM is fiction; the truth
            lives in the claim history. Knowing which is which is
            the entire puzzle.</li>
            <li><strong>The deliverable is regulatory,</strong> not
            a claim packet. First Case where the output is a file
            CMS reads, not a payer reads.</li>
            <li><strong>Median per payer beats mean.</strong>
            Charge-weighted means skew toward the high-volume
            payers; mode collapses without repeats; max overstates;
            CDM is what got Mercy flagged in the first place.</li>
          </ul>
        </div>
        <div>
          <h3>Sibling shape</h3>
          <ul>
            <li>Builds toward <strong>GFE Oracle</strong> @ L8 —
            same source-of-truth puzzle, different deliverable
            (Good Faith Estimate to a self-pay patient, not the
            published MRF).</li>
            <li>Reuses the queue-of-services pattern from
            <a href="./swarm-prototype.html">Swarm</a>; reuses the
            apply/reject decision lattice from
            <a href="./case-rate-specter-prototype.html">Case Rate Specter</a>.</li>
            <li>The classification-then-estimate gate is reusable
            for any "pick the source, then pick the value" Case.</li>
          </ul>
        </div>
      </div>
      <p class="notes-cta">
        See the <a href="./prototypes.html">Case Prototypes catalog</a>
        for the full set.
      </p>
    </section>
  `
}

// ===== State mutations =====

function dismissBriefing() { state.briefingDone = true; state.briefingOpen = false }
function showBriefing() { state.briefingOpen = true }
function closeBriefing() { state.briefingOpen = false }
function openTerm(termId: string) { state.openTermId = termId }
function closeTerm() { state.openTermId = null }

function classifyService(id: string, kind: ServiceKind) {
  const s = services.find(x => x.id === id)
  if (!s) return
  const ss = state.serviceStates[id]
  state.transientFeedback = null
  if (s.kind === kind) {
    ss.classification = kind
    ss.lastWrong = null
    state.transientFeedback = { id, message: s.kindReason, kind: 'good' }
    if (isClassifyDone()) state.resolvedIssues.add('classify')
  } else {
    state.failedAttempts++
    ss.lastWrong = kind
    state.transientFeedback = { id, message: s.kindReason, kind: 'bad' }
  }
}

function resetClassification(id: string) {
  const ss = state.serviceStates[id]
  if (!ss) return
  ss.classification = null
  ss.lastWrong = null
  state.resolvedIssues.delete('classify')
  // If estimation was done it's only valid contingent on classification —
  // re-resolution rebuilds the gate when player re-classifies.
  state.resolvedIssues.delete('estimate')
  state.resolvedIssues.delete('reconcile')
  state.transientFeedback = null
}

function inspect(id: string) {
  state.inspectingId = state.inspectingId === id ? null : id
  state.transientFeedback = null
}

function applyAggregation(id: string) {
  const a = cmpAggregations.find(x => x.id === id)
  if (!a) return
  state.transientFeedback = null
  if (a.correct) {
    state.appliedAggregationId = id
    state.resolvedIssues.add('estimate')
    state.transientFeedback = { id, message: a.feedback, kind: 'good' }
    state.inspectingId = null
  } else {
    state.failedAttempts++
    state.transientFeedback = { id, message: a.feedback, kind: 'bad' }
  }
}

function attemptSubmit() {
  if (state.resolvedIssues.has('classify') && state.resolvedIssues.has('estimate')) {
    state.resolvedIssues.add('reconcile')
    state.packetSubmitted = true
  }
}

function reset() {
  state.briefingDone = false
  state.briefingOpen = false
  for (const id in state.serviceStates) {
    state.serviceStates[id] = { classification: null, lastWrong: null }
  }
  state.inspectingId = null
  state.appliedAggregationId = null
  state.transientFeedback = null
  state.resolvedIssues = new Set()
  state.failedAttempts = 0
  state.packetSubmitted = false
  state.openTermId = null
}

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('briefing-popover-backdrop')) {
    closeBriefing(); rerender(); return
  }
  if (target.classList.contains('term-popover-backdrop')) {
    closeTerm(); rerender(); return
  }
  const el = target.closest('[data-action]') as HTMLElement | null
  if (!el) return
  const action = el.dataset.action
  switch (action) {
    case 'classify':
      if (el.dataset.id && el.dataset.kind) classifyService(el.dataset.id, el.dataset.kind as ServiceKind)
      break
    case 'reset-classification':
      if (el.dataset.id) resetClassification(el.dataset.id)
      break
    case 'inspect':
      if (el.dataset.id) inspect(el.dataset.id)
      break
    case 'apply-aggregation':
      if (el.dataset.id) applyAggregation(el.dataset.id)
      break
    case 'submit': attemptSubmit(); break
    case 'reset': reset(); break
    case 'dismiss-briefing': dismissBriefing(); break
    case 'show-briefing': showBriefing(); break
    case 'close-briefing': closeBriefing(); break
    case 'open-term': if (el.dataset.term) openTerm(el.dataset.term); break
    case 'close-term': closeTerm(); break
    default: return
  }
  rerender()
}

// ===== Per-prototype CSS =====

const css = districtVars('billing') + BASE_CSS + `
  /* Classify panel */
  .classify-panel { background: var(--panel); border: 1px solid #232a36; border-left: 4px solid var(--accent); border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .classify-panel.done { border-left-color: var(--good); }
  .cp-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .cp-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
  .cp-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .svc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .svc-table th, .svc-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #232a36; vertical-align: middle; }
  .svc-table th { font-size: 10.5px; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  .svc-table th.right, .svc-table td.right { text-align: right; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .muted-cell { color: var(--ink-dim); font-size: 12px; }
  .svc-row.classified.hard td { background: rgba(126, 226, 193, 0.04); }
  .svc-row.classified.soft td { background: rgba(177, 139, 214, 0.04); }
  .classify-cell { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .kind-badge { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 3px; font-weight: 700; }
  .kind-badge.hard { background: rgba(126, 226, 193, 0.15); color: var(--good); border: 1px solid #2c5547; }
  .kind-badge.soft { background: rgba(177, 139, 214, 0.15); color: #c8b6e0; border: 1px solid #3a324a; }
  .btn.small { padding: 4px 10px; font-size: 11.5px; }

  /* Estimate panel */
  .estimate-panel { background: var(--panel); border: 1px solid #232a36; border-left: 4px solid var(--accent-2); border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .estimate-panel.locked { opacity: 0.55; border-left-color: #2a3142; }
  .estimate-panel.done   { border-left-color: var(--good); }
  .ep-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .ep-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
  .ep-tag.idle { color: var(--ink-dim); }
  .ep-tag.active { color: var(--accent-2); }
  .ep-tag.done { color: var(--good); }
  .ep-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .ep-soft-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; }
  .soft-svc-card { background: var(--panel-2); border: 1px solid #2a3142; border-radius: 5px; color: var(--ink); cursor: pointer; padding: 12px 14px; text-align: left; display: flex; flex-direction: column; gap: 4px; font: inherit; transition: all 0.15s; }
  .soft-svc-card:hover, .soft-svc-card.inspecting { border-color: var(--accent-2); background: #232b3a; }
  .ssc-code { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; color: var(--accent-2); }
  .ssc-label { font-size: 13px; color: var(--ink); }
  .ssc-cta { font-size: 11px; color: var(--ink-dim); }

  /* Inspector panel */
  .inspector-panel { background: var(--panel); border: 1px solid #232a36; border-left: 4px solid #c8b6e0; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .ip-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .ip-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #c8b6e0; }
  .ip-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .claim-history { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 14px; }
  .claim-history th, .claim-history td { text-align: left; padding: 6px 10px; border-bottom: 1px dashed #232a36; }
  .claim-history th { font-size: 10.5px; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .claim-history th.right, .claim-history td.right { text-align: right; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .ip-prompt { font-size: 12px; color: var(--ink-dim); margin: 0 0 8px; font-style: italic; }
  .agg-list { list-style: none; padding-left: 0; margin: 0; }
  .agg { margin-bottom: 6px; }
  .agg-btn { width: 100%; background: var(--panel-2); border: 1px solid #2a3142; border-radius: 5px; color: var(--ink); cursor: pointer; padding: 9px 14px; text-align: left; font: inherit; transition: all 0.15s; }
  .agg-btn:hover { border-color: #c8b6e0; background: #232b3a; }
  .agg-label { font-size: 13px; }

  /* Publish panel */
  .publish-panel { background: var(--panel); border: 1px solid #232a36; border-left-width: 4px; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .publish-panel.idle   { border-left-color: #2a3142; opacity: 0.55; }
  .publish-panel.active { border-left-color: var(--accent-2); }
  .publish-panel.done   { border-left-color: var(--good); background: linear-gradient(180deg, rgba(126, 226, 193, 0.04), transparent); }
  .pp-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .pp-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
  .publish-panel.idle   .pp-tag { color: var(--ink-dim); }
  .publish-panel.active .pp-tag { color: var(--accent-2); }
  .publish-panel.done   .pp-tag { color: var(--good); }
  .pp-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .mrf-preview { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .mrf-preview th, .mrf-preview td { text-align: left; padding: 6px 10px; border-bottom: 1px dashed #232a36; }
  .mrf-preview th { font-size: 10.5px; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .mrf-preview th.right, .mrf-preview td.right { text-align: right; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }

  /* Recap uses good-color since success-feedback. */
  .recap { background: rgba(126, 226, 193, 0.06); border-color: #2c5547; }
  .recap-h { color: var(--good); }
`

// ===== Mount =====

function rerender() {
  const root = document.getElementById('prototype-root')
  if (root) root.innerHTML = render()
}

function mount() {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  rerender()
  document.body.addEventListener('click', handleClick)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      let changed = false
      if (state.openTermId) { closeTerm(); changed = true }
      if (state.briefingOpen) { closeBriefing(); changed = true }
      if (changed) rerender()
    }
  })
}

mount()
