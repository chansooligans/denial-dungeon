// Hydra @ L9 — first-sketch prototype (OA-23 / COB).
//
// Sibling to wraith / bundle / reaper / gatekeeper / fog. Same
// shape (Hospital intro → dreamlike fall → Waiting Room →
// claim form + middle work + checklist), tuned to a
// multi-payer verb-space:
//
//   - SEQUENCE is the new verb. Three payers (BCBS Federal,
//     Medicare Part B, Medicaid). The COB chain on file is
//     wrong; the player has to fix the order, then adjudicate
//     each payer in turn. Each step's 835 reduces the patient
//     responsibility for the next step.
//   - Wrong order = retraction. Try to submit Medicare first
//     when employer coverage exists, and Medicare's automated
//     COB scrub kicks it back; the chain has to be redone.
//
// Demonstrates: the framework holds even when the encounter
// has *multiple sub-claims* and a running balance. Same
// hospital intro / register flip / Dana voice / claim /
// checklist / submit shape — different middle (a sequential
// adjudication chain instead of a citation builder).

import { CASES } from '../content/cases'
import { BASE_CSS, districtVars, escape } from '../shared/prototype-base'

interface Payer {
  id: 'bcbs' | 'medicare' | 'medicaid'
  name: string
  abbrev: string
  /** What this payer is in the *correct* order. */
  correctRole: 'primary' | 'secondary' | 'tertiary'
  reasonForRole: string
  /** Adjudication output. Numbers in dollars (no cents kept simple). */
  willPay: number
  willAdjust: number
}

interface Issue {
  id: string
  label: string
  recap: string
  verb: 'sequence' | 'submit'
}

interface GlossaryEntry {
  term: string
  plain: string
}

const TOTAL_CHARGE = 1250

const payers: Record<string, Payer> = {
  bcbs: {
    id: 'bcbs',
    name: 'BCBS Federal',
    abbrev: 'BCBS-FED',
    correctRole: 'primary',
    reasonForRole: "Adaeze is still employed; her employer's group plan is primary by Medicare Secondary Payer rules (working past 65).",
    willPay: 850,
    willAdjust: 200,
  },
  medicare: {
    id: 'medicare',
    name: 'Medicare Part B',
    abbrev: 'MCR-B',
    correctRole: 'secondary',
    reasonForRole: "Medicare drops to secondary because BCBS Federal is the active employer plan. Medicare will pick up most of what BCBS left as patient responsibility.",
    willPay: 160,
    willAdjust: 0,
  },
  medicaid: {
    id: 'medicaid',
    name: 'Medicaid',
    abbrev: 'MCD',
    correctRole: 'tertiary',
    reasonForRole: "Medicaid is the payer of last resort by federal law. It picks up whatever's left after primary and secondary have paid.",
    willPay: 40,
    willAdjust: 0,
  },
}

const correctOrder: Array<'bcbs' | 'medicare' | 'medicaid'> = ['bcbs', 'medicare', 'medicaid']

const issues: Issue[] = [
  {
    id: 'reorder',
    label: 'Fix the COB chain — primary, secondary, tertiary in the correct order.',
    recap: "You moved BCBS Federal to primary. Adaeze is still working, so her employer's group plan pays first by Medicare Secondary Payer rules. Medicare drops to secondary; Medicaid stays at the bottom of the stack as payer of last resort.",
    verb: 'sequence',
  },
  {
    id: 'adjudicate-primary',
    label: 'Adjudicate the primary claim — BCBS Federal.',
    recap: "BCBS Federal paid $850 and applied a $200 contractual adjustment. $200 of patient responsibility carries to Medicare next.",
    verb: 'submit',
  },
  {
    id: 'adjudicate-secondary',
    label: 'Adjudicate the secondary claim — Medicare Part B.',
    recap: "Medicare picked up $160 of the $200 BCBS left. $40 carries to Medicaid as the final tier.",
    verb: 'submit',
  },
  {
    id: 'adjudicate-tertiary',
    label: 'Adjudicate the tertiary claim — Medicaid.',
    recap: "Medicaid covered the final $40. Total patient responsibility: $0. The Hydra is done.",
    verb: 'submit',
  },
]

const glossary: Record<string, GlossaryEntry> = {
  'OA-23': {
    term: 'OA-23 (prior payer adjustment)',
    plain: "A CARC (Claim Adjustment Reason Code) used on a secondary or tertiary claim to indicate that a prior payer already adjudicated. It's the bookkeeping mark that says 'this isn't a denial — it's the next payer in the chain accounting for what the previous one already paid.' The Hydra's heads use it on each other.",
  },
  'COB': {
    term: 'COB (coordination of benefits)',
    plain: "The contractual rules that decide which insurance pays first when a patient has more than one. The chain is *contractual*, not optional — the order is set by federal/state rules and the patient's employment status, not by the patient's preference. Wrong order means retractions.",
  },
  'Medicare Secondary Payer': {
    term: 'Medicare Secondary Payer (MSP)',
    plain: "The federal rules that say when Medicare pays second to other insurance. Most common case: a working-aged Medicare beneficiary (65+) who's still employed at a company with 20+ employees — the employer's group plan is primary, Medicare is secondary. Get this wrong and Medicare will retract.",
  },
  '835': {
    term: '835 (electronic remittance advice)',
    plain: "The X12 EDI transaction the payer sends back after adjudicating a claim. Carries the verdict: how much paid, how much adjusted (contractual write-off), how much is patient responsibility, and which CARC/RARC codes apply. The 835 from the primary payer is what you attach to the secondary submission.",
  },
  'CMS-1500': {
    term: 'CMS-1500',
    plain: "The standard claim form for outpatient services. This encounter cares about the COB block (Boxes 9-11d) — where the order of payers is recorded.",
  },
  'tertiary': {
    term: 'Tertiary',
    plain: "The third payer in a COB chain. Less common than primary + secondary but real — typical scenarios are commercial primary + Medicare secondary + Medicaid tertiary, or, for kids, two parents' plans plus Medicaid. Medicaid is almost always tertiary when it's in the chain at all (payer of last resort).",
  },
  'payer of last resort': {
    term: 'Payer of last resort',
    plain: "Medicaid's federal status: it pays only after every other source has paid what it's going to pay. Required by federal Medicaid law (42 USC 1396a(a)(25)). If the COB chain has Medicaid in it, Medicaid is at the bottom — period.",
  },
  'retraction': {
    term: 'Retraction',
    plain: "When a payer claws back money it already paid because something downstream told it not to pay. Most COB-related retractions happen when a secondary payer realizes a primary should have paid first; the secondary takes its money back, and the provider has to redo the chain in the right order.",
  },
}

// === Runtime state ===

interface RemittanceLine {
  payer: string
  paid: number
  adjusted: number
  patientResp: number
  /** Running balance to the next tier. */
  carryForward: number
}

const state = {
  briefingDone: false,
  briefingOpen: false,
  /** The current ordering the player has assembled (or the original wrong one). */
  currentOrder: ['medicare', 'bcbs', 'medicaid'] as Array<'bcbs' | 'medicare' | 'medicaid'>,
  /** True once the player has locked in a correct ordering. */
  orderLocked: false,
  /** Adjudication progress: 0 = none, 1 = primary done, 2 = sec done, 3 = ter done. */
  adjudicated: 0,
  remittances: [] as RemittanceLine[],
  /** Running balance carried into the next adjudication step. */
  runningBalance: TOTAL_CHARGE,
  failedAttempts: 0,
  feedback: '' as string,
  feedbackKind: 'neutral' as 'neutral' | 'good' | 'bad',
  lastRecap: '' as string,
  resolvedIssues: new Set<string>(),
  packetSubmitted: false,
  openTermId: null as string | null,
}

const hydraCase = CASES.case_hydra_okwu

// === Rendering ===

function term(termId: string, displayText?: string): string {
  const entry = glossary[termId]
  const text = displayText ?? termId
  if (!entry) return escape(text)
  return `<span class="term" data-action="open-term" data-term="${termId}">${escape(text)}<span class="term-icon">?</span></span>`
}

function money(n: number): string {
  return '$' + n.toLocaleString()
}

function render(): string {
  if (state.packetSubmitted) {
    return renderHeader() + renderVictory() + renderTermPopover() + renderBriefingPopover()
  }
  return `
    ${renderHeader()}
    ${renderHospitalIntro()}
    ${!state.briefingDone ? renderBriefingInline() : `
      ${renderClaim()}
      ${renderCobPanel()}
      ${renderAdjudicationChain()}
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
        <h1>Hydra <span class="muted">@ L9 — first-sketch prototype</span></h1>
        <div class="header-actions">
          ${recallBtn}
          <a class="back-link" href="./">← back to game</a>
        </div>
      </div>
      ${state.briefingDone ? '' : `
        <p class="lede">
          A sixth prototype, sibling to the others. This one is
          SEQUENCE-dominant: three payers, three heads, one
          claim. Fix the ${term('COB')} order, then adjudicate
          each tier in turn — the primary 835 feeds the
          secondary, the secondary feeds the tertiary. Wrong
          order = ${term('retraction')}. See the
          <a href="#design-notes">design notes</a> for what this
          prototype is testing.
        </p>
      `}
    </header>
  `
}

function renderHospitalIntro(): string {
  return `
    <section class="hospital-intro">
      <div class="register hospital">HOSPITAL · this morning</div>
      <p>
        The ${term('COB')} analyst — her name's Bola — drops a chart on
        your desk. "Mrs. Okwu's dialysis claim. $1,250.
        Bouncing for two months. Three insurance cards on
        file: BCBS Federal through her job, Medicare since she
        turned 65, Medicaid because of the kidney disease.
        Whoever set up the ${term('COB')} at registration listed Medicare
        primary. Now everybody's pointing at everybody else."
      </p>
      <p>
        You spread the three cards out. They look like an
        argument. Adaeze is still working — she runs a small
        catering company — so by Medicare's own rules, her
        employer plan is supposed to pay first. The chain on
        file has it backwards.
      </p>
      <div class="register-flip">
        <div class="ripple"></div>
        <em>— and somewhere down the corridor, you hear three
        voices talking over each other. Polite-sounding. None
        of them listening. The fluorescents fragment into
        colors. You're somewhere else.</em>
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
      <span class="briefing-sub">${state.briefingDone ? 'Re-reading her note.' : "Different shape from the others. Listen up."}</span>
    </div>
    <div class="briefing-body">
      <p>
        "This one is the Hydra. ${term('OA-23')}. Three payers,
        three heads. They don't fight you — they fight
        <em>each other</em>, and the patient is in the middle.
        Your job is to hand them the right contract chain so
        they line up instead of clawing back."
      </p>
      <p>
        "The rules are contractual. Not optional. ${term('Medicare Secondary Payer', 'MSP')}
        says: working past 65 with employer coverage =
        employer plan first. ${term('payer of last resort', 'Medicaid law')}
        says: Medicaid pays last, period. So the chain
        Adaeze's claim needs is BCBS Federal → Medicare Part B
        → Medicaid. The chain on file is wrong."
      </p>
      <p>
        "Four issues, in order:"
      </p>
      <ul>
        <li>
          <strong>Fix the COB chain.</strong> Three slots —
          primary, secondary, ${term('tertiary')}. Pick the
          right payer for each. <em>This is the new verb:
          SEQUENCE.</em>
        </li>
        <li>
          <strong>Submit primary.</strong> BCBS Federal
          adjudicates first. They'll pay most of it, contractual-
          adjust some of it, kick a chunk to the next payer as
          patient responsibility.
        </li>
        <li>
          <strong>Submit secondary.</strong> Medicare picks up
          most of what BCBS left, attaches their ${term('835')}
          to the chain.
        </li>
        <li>
          <strong>Submit tertiary.</strong> Medicaid takes the
          final remainder. By federal law, they're always last.
        </li>
      </ul>
      <p>
        "Try to submit out of order, you'll get a
        ${term('retraction')}. Medicare's COB scrub catches it
        on day one. Don't waste the round-trip — set the chain,
        then walk it forward."
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

function renderClaim(): string {
  const claim = hydraCase.claim
  if (!claim || claim.type !== 'cms1500') return ''
  return `
    <section class="claim">
      <div class="claim-h">
        ${term('CMS-1500')} · ${escape(claim.claimId)}
        <span class="claim-explainer">(hemodialysis · single service line · three insurances on file)</span>
      </div>
      <div class="claim-grid">
        <div><b>Patient:</b> ${escape(claim.patient.name)} · ${escape(claim.patient.dob)}</div>
        <div><b>Total charge:</b> ${money(TOTAL_CHARGE)}</div>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 21 · Diagnoses</div>
        <ul class="dx">
          ${claim.diagnoses.map((d, i) => {
            const letter = String.fromCharCode(65 + i)
            return `<li><b>${letter}.</b> ${escape(d.code)}${d.label ? ' — ' + escape(d.label) : ''}</li>`
          }).join('')}
        </ul>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 24 · Service Lines</div>
        <table class="lines">
          <thead><tr><th>DOS</th><th>POS</th><th>CPT</th><th>Charges</th></tr></thead>
          <tbody>
            ${claim.serviceLines.map(line => `
              <tr>
                <td>${escape(line.dos)}</td>
                <td>${escape(line.pos)}</td>
                <td>${escape(line.cpt.code)}${line.cpt.label ? ' — ' + escape(line.cpt.label) : ''}</td>
                <td>${escape(line.charges)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

const ROLES: Array<{ key: 'primary' | 'secondary' | 'tertiary'; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'tertiary', label: 'Tertiary' },
]

function payerListForPicker(roleKey: 'primary' | 'secondary' | 'tertiary'): Array<'bcbs' | 'medicare' | 'medicaid'> {
  const idx = ROLES.findIndex(r => r.key === roleKey)
  // Filter to payers not already chosen for an earlier slot.
  const earlier = state.currentOrder.slice(0, idx)
  return (Object.keys(payers) as Array<'bcbs' | 'medicare' | 'medicaid'>).filter(p => !earlier.includes(p))
}

function renderCobPanel(): string {
  const cls = state.orderLocked ? 'locked' : 'editing'
  const isCorrect = state.currentOrder.every((p, i) => p === correctOrder[i])
  return `
    <section class="cob-panel ${cls}">
      <div class="cob-h">
        <span class="cob-tag">${term('COB')} CHAIN</span>
        <span class="cob-sub">${state.orderLocked
          ? 'Locked in. Adjudicate the chain below.'
          : "Pick the payer for each tier. The contract chain is contractual, not optional."}</span>
      </div>
      <div class="cob-row">
        ${ROLES.map((role, i) => {
          const chosen = state.currentOrder[i]
          const payer = payers[chosen]
          const matches = correctOrder[i] === chosen
          return `
            <div class="cob-slot ${state.orderLocked ? (matches ? 'correct' : 'wrong') : ''}">
              <div class="cob-slot-h">
                <span class="cob-role">${escape(role.label)}</span>
                ${state.orderLocked
                  ? matches
                    ? '<span class="cob-status ok">✓</span>'
                    : '<span class="cob-status no">✗</span>'
                  : ''}
              </div>
              ${state.orderLocked
                ? `<div class="cob-payer">${escape(payer.name)}</div>
                   <div class="cob-reason">${escape(payer.reasonForRole)}</div>`
                : `<select class="cob-select" data-action="cob-select" data-role="${role.key}">
                    ${payerListForPicker(role.key).map(pid => `
                      <option value="${pid}" ${pid === chosen ? 'selected' : ''}>${escape(payers[pid].name)}</option>
                    `).join('')}
                  </select>`}
            </div>
          `
        }).join('')}
      </div>
      ${state.orderLocked ? '' : `
        <div class="cob-actions">
          <button class="btn primary ${isCorrect ? '' : ''}"
                  data-action="lock-cob">
            ${isCorrect ? 'Lock in COB chain' : 'Try this order'}
          </button>
        </div>
      `}
    </section>
  `
}

function renderAdjudicationChain(): string {
  if (!state.orderLocked) {
    return `
      <section class="chain-panel idle">
        <div class="chain-h">
          <span class="chain-tag">ADJUDICATION CHAIN</span>
          <span class="chain-sub">Lock the COB chain above to begin.</span>
        </div>
      </section>
    `
  }
  // For each step show: label, status, payer info, RA summary if done.
  return `
    <section class="chain-panel active">
      <div class="chain-h">
        <span class="chain-tag">ADJUDICATION CHAIN</span>
        <span class="chain-sub">Walk it forward. Running balance: ${money(state.runningBalance)} of ${money(TOTAL_CHARGE)}.</span>
      </div>
      ${ROLES.map((role, i) => {
        const payer = payers[state.currentOrder[i]]
        const status = state.adjudicated > i ? 'done' : state.adjudicated === i ? 'active' : 'pending'
        const remit = state.remittances[i]
        return `
          <div class="chain-step ${status}">
            <div class="step-h">
              <span class="step-num">${i + 1}</span>
              <span class="step-role">${escape(role.label.toUpperCase())}</span>
              <span class="step-payer">${escape(payer.name)}</span>
              <span class="step-status">${status === 'done' ? '✓ Adjudicated' : status === 'active' ? '⏵ Ready' : '○ Pending'}</span>
            </div>
            ${status === 'active' ? `
              <div class="step-body">
                <div class="step-prelude">
                  Submitting ${i === 0 ? 'the original 837' : `with the prior ${term('835')}` + (i === 2 ? 's' : '') + ' attached'}.
                  ${i === 0 ? `Charge: ${money(TOTAL_CHARGE)}.` : `Carry-forward balance: ${money(state.runningBalance)}.`}
                </div>
                <button class="btn primary" data-action="adjudicate" data-tier="${i}">
                  Submit to ${escape(payer.abbrev)}
                </button>
              </div>
            ` : ''}
            ${status === 'done' && remit ? `
              <div class="step-body">
                <table class="ra-table">
                  <tr><td class="ra-label">Paid by ${escape(payer.abbrev)}</td><td class="ra-value pay">${money(remit.paid)}</td></tr>
                  ${remit.adjusted > 0 ? `<tr><td class="ra-label">Contractual adjustment</td><td class="ra-value adj">${money(remit.adjusted)}</td></tr>` : ''}
                  <tr><td class="ra-label">Carries to next tier</td><td class="ra-value carry">${money(remit.carryForward)}</td></tr>
                </table>
              </div>
            ` : ''}
          </div>
        `
      }).join('')}
    </section>
  `
}

function renderChecklist(): string {
  const allResolved = state.resolvedIssues.size === issues.length
  return `
    <section class="checklist">
      <div class="checklist-h">Hydra checklist — ${state.resolvedIssues.size} of ${issues.length} steps complete</div>
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
      <button class="btn submit ${allResolved ? '' : 'disabled'}"
              ${allResolved ? '' : 'disabled'}
              data-action="submit">
        FINALIZE — PATIENT RESPONSIBILITY ${money(state.runningBalance)}
      </button>
      ${state.failedAttempts > 0 ? `<div class="fail-counter">Wrong moves so far: ${state.failedAttempts}.</div>` : ''}
      ${state.feedback ? `<div class="feedback fb-${state.feedbackKind}">${escape(state.feedback)}</div>` : ''}
      ${state.lastRecap ? `
        <div class="recap">
          <div class="recap-h">What you just did</div>
          <p>${escape(state.lastRecap)}</p>
        </div>
      ` : ''}
    </section>
  `
}

function renderVictory(): string {
  return `
    <section class="victory">
      <h2>The three heads stop arguing.</h2>
      <p class="register hospital">Hospital, the next morning.</p>
      <p>
        Bola sticks her head in to say the COB chain landed
        clean. BCBS paid ${money(payers.bcbs.willPay)},
        Medicare picked up ${money(payers.medicare.willPay)},
        Medicaid covered the final ${money(payers.medicaid.willPay)}.
        Adaeze owes <strong>$0</strong>. The dialysis claim
        joins the closed pile.
      </p>
      <p class="register waiting-room">Waiting Room.</p>
      <p>
        The Hydra's three heads are no longer talking over each
        other. Standing in a row instead, like they were always
        meant to: BCBS, Medicare, Medicaid. The contract chain
        — primary to last resort — written in the air above
        them and slowly, quietly fading.
      </p>
      <button class="btn primary" data-action="reset">Run it again</button>
      <a class="back-link inline" href="./">← back to game</a>
    </section>
  `
}

function renderTermPopover(): string {
  if (!state.openTermId) return ''
  const entry = glossary[state.openTermId]
  if (!entry) return ''
  return `
    <div class="term-popover-backdrop">
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

function renderDesignNotes(): string {
  return `
    <section class="design-notes" id="design-notes">
      <h2>Design notes — what this prototype tests</h2>
      <div class="notes-grid">
        <div>
          <h3>What's different from the others</h3>
          <ul>
            <li><b>SEQUENCE is the new verb.</b> Three payers, ordered. Picking the order is the first action; walking the chain forward through three adjudications is the rest of the encounter.</li>
            <li><b>Multiple sub-claims.</b> First prototype where one ClaimSheet generates three separate payer round-trips. Each step is a discrete adjudication with its own 835 line items.</li>
            <li><b>Running balance.</b> Patient responsibility decreases as each payer pays. The number changes from $1,250 to $0 across the encounter — the player can watch the chain do its job.</li>
            <li><b>Real COB rules taught inline.</b> Why BCBS is primary, why Medicaid is last, why Medicare drops to secondary — each shown in the slot's reason text after lock-in. No standalone glossary dump.</li>
            <li><b>Wrong-order soft-fail.</b> If the player locks in a wrong order, the chain still tries to adjudicate but each payer kicks back with an OA-22 / OA-23. Player has to re-edit the chain. (In this first sketch we do an early validation in attemptLock; later versions could let the chain fail mid-walk for more drama.)</li>
            <li><b>Latest-curriculum mood.</b> L9 — by this point the player has seen Dana's signoff shrink from "— Dana" to "— D." The Hydra is one of the last fights before the L10 audit.</li>
          </ul>
        </div>
        <div>
          <h3>What this prototype proves (or tries to)</h3>
          <ul>
            <li>The framework absorbs a multi-step adjudication chain without breaking — same hospital intro, fall, claim, checklist; only the middle changed.</li>
            <li>Running balances + per-step 835 summaries can substitute for "HP bars" while teaching far more about real RCM mechanics.</li>
            <li>Picking-from-dropdowns is a viable substitute for drag-and-drop on a sequence puzzle (simpler to implement, accessible by default).</li>
            <li>"OA-23 cascading" reads as a sequence of friendly-but-bureaucratic handoffs rather than as a denial fight.</li>
            <li>Dana's voice scales to the most administratively complex encounter in the curriculum without losing the in-your-ear register.</li>
          </ul>
        </div>
      </div>
      <p class="notes-cta">
        Side-by-side comparison: open
        <a href="./fog-prototype.html">Fog</a> for the upstream
        cousin (REVEAL → AMEND), or
        <a href="./reaper-prototype.html">Reaper</a> for the
        time-pressure verb pivot. SEQUENCE is the most
        structurally different yet — same shape, very different
        rhythm.
      </p>
    </section>
  `
}

// === Interactions ===

function setFeedback(text: string, kind: 'good' | 'bad' | 'neutral' = 'neutral') {
  state.feedback = text
  state.feedbackKind = kind
}

function cobSelect(role: 'primary' | 'secondary' | 'tertiary', payerId: 'bcbs' | 'medicare' | 'medicaid') {
  const idx = ROLES.findIndex(r => r.key === role)
  const next = state.currentOrder.slice() as Array<'bcbs' | 'medicare' | 'medicaid'>
  // If the picked payer is already in another slot, swap.
  const existingIdx = next.indexOf(payerId)
  if (existingIdx !== -1 && existingIdx !== idx) {
    next[existingIdx] = next[idx]
  }
  next[idx] = payerId
  state.currentOrder = next
}

function lockCob() {
  if (state.orderLocked) return
  const isCorrect = state.currentOrder.every((p, i) => p === correctOrder[i])
  if (!isCorrect) {
    state.failedAttempts += 1
    // Identify which slot is the most diagnostic problem and explain.
    const wrong = state.currentOrder.findIndex((p, i) => p !== correctOrder[i])
    const got = payers[state.currentOrder[wrong]]
    const expected = payers[correctOrder[wrong]]
    setFeedback(
      `That's not contractual. You put ${got.name} as ${ROLES[wrong].label.toLowerCase()}, but ${expected.name} should be there. ${expected.reasonForRole}`,
      'bad'
    )
    state.lastRecap = ''
    return
  }
  state.orderLocked = true
  state.resolvedIssues.add('reorder')
  const issue = issues.find(i => i.id === 'reorder')!
  setFeedback("COB chain locked. Adjudicate from primary down.", 'good')
  state.lastRecap = issue.recap
}

function adjudicate(tier: number) {
  if (!state.orderLocked) return
  if (tier !== state.adjudicated) return
  const payer = payers[state.currentOrder[tier]]
  const balanceBefore = state.runningBalance
  const paid = Math.min(payer.willPay, balanceBefore)
  const adjusted = tier === 0 ? payer.willAdjust : 0
  const reduced = paid + adjusted
  const carry = Math.max(0, balanceBefore - reduced)
  const remit: RemittanceLine = {
    payer: payer.name,
    paid,
    adjusted,
    patientResp: carry,
    carryForward: carry,
  }
  state.remittances.push(remit)
  state.runningBalance = carry
  state.adjudicated += 1
  const issueId = tier === 0 ? 'adjudicate-primary' : tier === 1 ? 'adjudicate-secondary' : 'adjudicate-tertiary'
  state.resolvedIssues.add(issueId)
  const issue = issues.find(i => i.id === issueId)!
  setFeedback(
    `${payer.name} adjudicated. Paid ${money(paid)}${adjusted > 0 ? `, adjusted ${money(adjusted)}` : ''}. Carries ${money(carry)} forward.`,
    'good'
  )
  state.lastRecap = issue.recap
}

function attemptSubmit() {
  if (state.resolvedIssues.size < issues.length) return
  state.packetSubmitted = true
}

function reset() {
  state.briefingDone = false
  state.briefingOpen = false
  state.currentOrder = ['medicare', 'bcbs', 'medicaid']
  state.orderLocked = false
  state.adjudicated = 0
  state.remittances = []
  state.runningBalance = TOTAL_CHARGE
  state.failedAttempts = 0
  state.feedback = ''
  state.feedbackKind = 'neutral'
  state.lastRecap = ''
  state.resolvedIssues = new Set()
  state.packetSubmitted = false
}

function dismissBriefing() { state.briefingDone = true; state.briefingOpen = false }
function showBriefing() { state.briefingOpen = true }
function closeBriefing() { state.briefingOpen = false }
function openTerm(termId: string) { state.openTermId = termId }
function closeTerm() { state.openTermId = null }

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
    case 'lock-cob': lockCob(); break
    case 'adjudicate':
      if (el.dataset.tier) adjudicate(parseInt(el.dataset.tier, 10))
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

function handleChange(e: Event) {
  const target = e.target as HTMLElement
  const el = target.closest('[data-action]') as HTMLElement | null
  if (!el) return
  if (el.dataset.action === 'cob-select') {
    const role = el.dataset.role as 'primary' | 'secondary' | 'tertiary'
    const value = (el as HTMLSelectElement).value as 'bcbs' | 'medicare' | 'medicaid'
    cobSelect(role, value)
    rerender()
  }
}

// === Mount ===

// Hydra-specific CSS — COB panel, adjudication chain, RA table.
// Base styles via BASE_CSS.
const css = districtVars('billing') + BASE_CSS + `
  /* COB panel */
  .cob-panel {
    background: var(--panel); border: 1px solid #232a36; border-left-width: 4px;
    border-radius: 8px; padding: 18px 22px; margin-bottom: 22px;
    transition: border-color 0.3s;
  }
  .cob-panel.editing { border-left-color: var(--accent); }
  .cob-panel.locked { border-left-color: var(--good); background: linear-gradient(180deg, rgba(126, 226, 193, 0.04), transparent); }
  .cob-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .cob-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
  .cob-panel.locked .cob-tag { color: var(--good); }
  .cob-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .cob-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  @media (max-width: 880px) { .cob-row { grid-template-columns: 1fr; } }
  .cob-slot { padding: 12px 14px; background: var(--panel-2); border-radius: 6px; border: 1px solid #2a3142; display: flex; flex-direction: column; gap: 8px; min-height: 110px; }
  .cob-slot.correct { border-color: var(--good); background: rgba(126, 226, 193, 0.06); }
  .cob-slot.wrong { border-color: var(--bad); background: rgba(239, 91, 123, 0.06); }
  .cob-slot-h { display: flex; justify-content: space-between; align-items: center; }
  .cob-role { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-dim); }
  .cob-status { font-size: 14px; font-weight: 700; }
  .cob-status.ok { color: var(--good); }
  .cob-status.no { color: var(--bad); }
  .cob-select {
    font: inherit; padding: 7px 10px; border-radius: 4px;
    background: var(--panel); color: var(--ink); border: 1px solid #2a3142;
    cursor: pointer;
  }
  .cob-select:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  .cob-payer { font-size: 14px; font-weight: 600; color: var(--ink); }
  .cob-reason { font-size: 12px; color: var(--ink-dim); line-height: 1.45; }
  .cob-actions { display: flex; gap: 10px; }

  /* Adjudication chain */
  .chain-panel {
    background: var(--panel); border: 1px solid #232a36; border-left-width: 4px;
    border-radius: 8px; padding: 18px 22px; margin-bottom: 22px;
    transition: border-color 0.3s;
  }
  .chain-panel.idle { border-left-color: #2a3142; opacity: 0.6; }
  .chain-panel.active { border-left-color: var(--accent-2); }
  .chain-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .chain-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-2); }
  .chain-panel.idle .chain-tag { color: var(--ink-dim); }
  .chain-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }

  .chain-step { padding: 12px 14px; margin: 8px 0; background: var(--panel-2); border-radius: 6px; border-left: 3px solid #2a3142; transition: all 0.2s; }
  .chain-step.pending { opacity: 0.55; }
  .chain-step.active { border-left-color: var(--accent-2); background: rgba(240, 168, 104, 0.05); }
  .chain-step.done { border-left-color: var(--good); background: rgba(126, 226, 193, 0.04); }
  .step-h { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .step-num { background: var(--panel); color: var(--ink-dim); width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; border: 1px solid #2a3142; }
  .chain-step.active .step-num { color: var(--accent-2); border-color: var(--accent-2); }
  .chain-step.done .step-num { color: var(--good); border-color: var(--good); background: rgba(126, 226, 193, 0.1); }
  .step-role { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-dim); }
  .step-payer { font-size: 13.5px; font-weight: 600; color: var(--ink); flex: 1; }
  .step-status { font-size: 11px; color: var(--ink-dim); }
  .chain-step.active .step-status { color: var(--accent-2); }
  .chain-step.done .step-status { color: var(--good); }
  .step-body { margin-top: 10px; padding-left: 34px; }
  .step-prelude { font-size: 12.5px; color: var(--ink-dim); margin-bottom: 10px; line-height: 1.5; }

  .ra-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ra-table td { padding: 5px 8px; border-bottom: 1px dashed #232a36; }
  .ra-table tr:last-child td { border-bottom: none; }
  .ra-label { color: var(--ink-dim); }
  .ra-value { text-align: right; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-weight: 600; }
  .ra-value.pay { color: var(--good); }
  .ra-value.adj { color: var(--accent-2); }
  .ra-value.carry { color: var(--ink); }

  /* Recap uses Hydra coral instead of warm orange. */
  .recap { background: rgba(239, 155, 176, 0.06); border-color: #4a323a; }
  .recap-h { color: var(--accent); }
`

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
  document.body.addEventListener('change', handleChange)
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
