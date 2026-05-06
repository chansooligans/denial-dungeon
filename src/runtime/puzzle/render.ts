// Render the puzzle UI from a PuzzleSpec + runtime state. Pure HTML
// string output; the scene mounts it into a div, attaches a single
// click delegate, and re-renders on state change.
//
// Reuses BASE_CSS from src/shared/prototype-base.ts so the runtime
// puzzle reads visually identical to the standalone HTML prototypes.
// District accent comes from districtVars(spec.district).

import { escape } from '../../shared/prototype-base'
import type {
  PuzzleSpec,
  PuzzlePayerPhrase,
} from './types'

/** State the scene maintains across renders. */
export interface PuzzleState {
  /** True until the player dismisses Dana's briefing. */
  briefingDone: boolean
  /** Currently picked payer phrase (citation builder slot). */
  selectedPayerId: string | null
  /** Currently picked chart fact. */
  selectedChartId: string | null
  /** Currently picked policy clause. */
  selectedPolicyId: string | null
  /** Set of resolved issue ids. */
  resolvedIssues: Set<string>
  /** Modifier currently amended onto the claim line, keyed by amendSlot.issueId. */
  amendedFields: Record<string, string>
  /** Which amend modal is open (slot.issueId), null = closed. */
  amendOpen: string | null
  /** Per-amend last-rejected pick, for rendering inline rejection feedback. */
  amendFeedback: { id: string; message: string } | null
  /** Builder-level feedback message + tone. */
  feedback: string
  feedbackKind: 'good' | 'bad' | 'neutral'
  /** "What you just did" recap. */
  lastRecap: string
  /** Wrong-pick counter (for the fail-counter UI line). */
  failedAttempts: number
  /** Once true, render the victory screen instead of the encounter. */
  packetSubmitted: boolean
}

export function makeInitialState(spec: PuzzleSpec): PuzzleState {
  return {
    briefingDone: false,
    selectedPayerId: null,
    selectedChartId: null,
    selectedPolicyId: null,
    resolvedIssues: new Set(),
    amendedFields: Object.fromEntries(
      spec.amendSlots.map(slot => {
        const current = slot.options.find(o => o.support === 'current')
        return [slot.issueId, current?.id ?? '—']
      })
    ),
    amendOpen: null,
    amendFeedback: null,
    feedback: '',
    feedbackKind: 'neutral',
    lastRecap: '',
    failedAttempts: 0,
    packetSubmitted: false,
  }
}

export function render(spec: PuzzleSpec, state: PuzzleState): string {
  if (state.packetSubmitted) {
    return renderVictory(spec)
  }
  return [
    renderHeader(spec),
    renderHospitalIntro(spec),
    state.briefingDone ? '' : renderBriefingInline(spec),
    state.briefingDone ? renderClaim(spec, state) : '',
    state.briefingDone && spec.amendSlots.length > 0 ? renderAmendCallouts(spec, state) : '',
    state.briefingDone ? renderWorkbench(spec, state) : '',
    state.briefingDone ? renderCitationBuilder(spec, state) : '',
    state.briefingDone ? renderChecklist(spec, state) : '',
    renderAmendModal(spec, state),
  ].join('')
}

function renderHeader(spec: PuzzleSpec): string {
  return `
    <header class="page-h">
      <div class="title-row">
        <h1>${escape(spec.title)} <span class="muted">@ runtime — encounter</span></h1>
        <button class="back-link" data-action="flee">⏎ Leave</button>
      </div>
    </header>
  `
}

function renderHospitalIntro(spec: PuzzleSpec): string {
  return `
    <section class="hospital-intro">
      <div class="register hospital">HOSPITAL · this morning</div>
      ${spec.hospitalIntro.map(p => `<p>${p}</p>`).join('')}
      <div class="register-flip">
        <div class="ripple"></div>
        <em>— and somewhere in the building, a door you've never used opens. The hum of the fluorescents shifts. You're somewhere else.</em>
      </div>
      <div class="register waiting-room">WAITING ROOM · now</div>
    </section>
  `
}

function renderBriefingInline(spec: PuzzleSpec): string {
  return `
    <section class="briefing">
      <div class="briefing-h">
        <span class="briefing-tag">DANA, IN YOUR EAR</span>
        <span class="briefing-sub">A new shape. Listen up.</span>
      </div>
      <div class="briefing-body">
        ${spec.briefing.paragraphs.map(p => `<p>${p}</p>`).join('')}
        <ul>${spec.briefing.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        <p class="briefing-sign">${escape(spec.briefing.signoff)}</p>
      </div>
      <button class="btn primary" data-action="dismiss-briefing">
        Got it — start the encounter
      </button>
    </section>
  `
}

function renderClaim(spec: PuzzleSpec, state: PuzzleState): string {
  const claim = spec.claim
  const modifierResolved = state.resolvedIssues.has('modifier')
  return `
    <section class="claim">
      <div class="claim-h">
        CMS-1500 · ${escape(claim.claimId)}
        <span class="claim-explainer">(this is the bill the doctor's office sent to insurance)</span>
      </div>
      <div class="claim-grid">
        <div><b>Patient:</b> ${escape(claim.patientName)} · ${escape(claim.patientDob)}</div>
        <div><b>Insurer:</b> ${escape(claim.insurer)} · ${escape(claim.insuredId)}</div>
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
      <div class="claim-section service-section">
        <div class="claim-section-h">
          Box 24 · Service Lines
          ${modifierResolved
            ? '<span class="claim-status amended">AMENDED</span>'
            : '<span class="claim-status disputed">DISPUTED</span>'}
        </div>
        <table class="lines">
          <thead><tr><th>DOS</th><th>POS</th><th>CPT</th><th>Modifier</th><th>Charges</th></tr></thead>
          <tbody>
            ${claim.serviceLines.map((line, i) => {
              const isDisputed = line.disputed && !modifierResolved
              const isAmended = line.disputed && modifierResolved
              const mod = i === 0 ? state.amendedFields['modifier'] ?? '—' : line.modifier ?? '—'
              return `
                <tr class="${isAmended ? 'amended' : isDisputed ? 'hi' : ''}">
                  <td>${escape(line.dos)}</td>
                  <td>${escape(line.pos)}</td>
                  <td>${escape(line.cptCode)}${line.cptLabel ? ' — ' + escape(line.cptLabel) : ''}</td>
                  <td class="modifier-cell">
                    ${isAmended
                      ? `<span class="mod-applied">${escape(mod)}</span>`
                      : isDisputed
                        ? `<span class="mod-missing">${mod === '—' ? 'no modifier' : 'mod ' + escape(mod)}</span>`
                        : escape(mod)}
                  </td>
                  <td>${escape(line.charges)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderAmendCallouts(spec: PuzzleSpec, state: PuzzleState): string {
  const callouts = spec.amendSlots
    .filter(slot => !state.resolvedIssues.has(slot.issueId))
    .map(slot => `
      <button class="amend-callout" data-action="open-amend" data-slot="${escape(slot.issueId)}">
        <span class="amend-callout-arrow" aria-hidden="true">↧</span>
        <span class="amend-callout-body">
          <span class="amend-callout-main">✎ Amend · ${escape(slot.fieldLabel)}</span>
          <span class="amend-callout-sub">${escape(slot.contextLine)}</span>
        </span>
      </button>
    `).join('')
  if (!callouts) return ''
  return `<div class="amend-callouts-row">${callouts}</div>`
}

function renderWorkbench(spec: PuzzleSpec, state: PuzzleState): string {
  return `
    <section class="workbench">
      <div class="col col-payer">
        <div class="col-h">
          <span class="col-tag">PAYER NOTE</span>
          <span class="col-sub">The denial. Click a red phrase to select.</span>
        </div>
        <p class="col-prose">${renderPayerProse(spec, state)}</p>
      </div>
      <div class="col col-chart">
        <div class="col-h">
          <span class="col-tag">${escape(spec.chartHeader ?? 'Chart')}</span>
          <span class="col-sub">What the doctor wrote. Click a fact to cite it.</span>
        </div>
        <ul class="facts">
          ${spec.chartFacts.map(f => `
            <li class="fact ${state.selectedChartId === f.id ? 'selected' : ''}"
                data-action="select-chart" data-id="${escape(f.id)}">
              <div class="fact-plain">${escape(f.plain)}</div>
              <div class="fact-technical"><span class="src">from chart:</span> ${escape(f.technical)}</div>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="col col-policy">
        <div class="col-h">
          <span class="col-tag">${escape(spec.policyHeader ?? 'Policy')}</span>
          <span class="col-sub">Coding rules. Click a clause to back a citation.</span>
        </div>
        <ul class="clauses">
          ${spec.policyClauses.map(c => `
            <li class="clause ${state.selectedPolicyId === c.id ? 'selected' : ''}"
                data-action="select-policy" data-id="${escape(c.id)}">
              <div class="clause-plain">${escape(c.plain)}</div>
              <div class="clause-technical"><span class="src">${escape(c.source ?? 'policy')}:</span> ${escape(c.technical)}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    </section>
  `
}

function renderPayerProse(spec: PuzzleSpec, state: PuzzleState): string {
  // Substitute {{phrase:id}} placeholders with clickable spans.
  return spec.payerProse.replace(/\{\{phrase:([^}]+)\}\}/g, (_m, id) => {
    const phrase = spec.payerPhrases.find(p => p.id === id)
    if (!phrase) return ''
    return phraseSpan(phrase, state)
  })
}

function phraseSpan(p: PuzzlePayerPhrase, state: PuzzleState): string {
  const sel = state.selectedPayerId === p.id ? 'selected' : ''
  const resolved = state.resolvedIssues.has(p.issueId) ? 'resolved' : ''
  return `<span class="phrase ${sel} ${resolved}" data-action="select-payer" data-id="${escape(p.id)}">${escape(p.text)}</span>`
}

function renderCitationBuilder(spec: PuzzleSpec, state: PuzzleState): string {
  const payer = state.selectedPayerId ? spec.payerPhrases.find(p => p.id === state.selectedPayerId) : null
  const chart = state.selectedChartId ? spec.chartFacts.find(f => f.id === state.selectedChartId) : null
  const policy = state.selectedPolicyId ? spec.policyClauses.find(c => c.id === state.selectedPolicyId) : null
  const ready = !!(payer && chart && policy)
  const fbClass = state.feedback ? `fb-${state.feedbackKind}` : ''
  return `
    <section class="builder">
      <div class="builder-h">Citation builder</div>
      <div class="builder-row">
        <div class="slot ${payer ? 'filled' : ''}">
          <div class="slot-label">PAYER ASSERTS</div>
          <div class="slot-text">${payer ? '"' + escape(payer.text) + '"' : '<span class="placeholder">Click a payer phrase</span>'}</div>
        </div>
        <div class="connector">cited by</div>
        <div class="slot ${chart ? 'filled' : ''}">
          <div class="slot-label">CHART FACT</div>
          <div class="slot-text">${chart ? escape(chart.plain) : '<span class="placeholder">Click a chart fact</span>'}</div>
        </div>
        <div class="connector">per</div>
        <div class="slot ${policy ? 'filled' : ''}">
          <div class="slot-label">POLICY CLAUSE</div>
          <div class="slot-text">${policy ? escape(policy.plain) : '<span class="placeholder">Click a policy clause</span>'}</div>
        </div>
      </div>
      <div class="builder-actions">
        <button class="btn primary ${ready ? '' : 'disabled'}"
                ${ready ? '' : 'disabled'}
                data-action="cite">CITE</button>
        <button class="btn ghost" data-action="clear">Clear</button>
      </div>
      ${state.feedback ? `<div class="feedback ${fbClass}">${escape(state.feedback)}</div>` : ''}
      ${state.lastRecap ? `
        <div class="recap">
          <div class="recap-h">What you just did</div>
          <p>${escape(state.lastRecap)}</p>
        </div>
      ` : ''}
    </section>
  `
}

function renderChecklist(spec: PuzzleSpec, state: PuzzleState): string {
  const all = state.resolvedIssues.size === spec.issues.length
  return `
    <section class="checklist">
      <div class="checklist-h">Defense packet — ${state.resolvedIssues.size} of ${spec.issues.length} issues addressed</div>
      <ul>
        ${spec.issues.map(i => {
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
      <button class="btn submit ${all ? '' : 'disabled'}"
              ${all ? '' : 'disabled'}
              data-action="submit">${escape(spec.submitLabel)}</button>
      ${state.failedAttempts > 0 ? `<div class="fail-counter">Wrong picks so far: ${state.failedAttempts}.</div>` : ''}
    </section>
  `
}

function renderAmendModal(spec: PuzzleSpec, state: PuzzleState): string {
  if (!state.amendOpen) return ''
  const slot = spec.amendSlots.find(s => s.issueId === state.amendOpen)
  if (!slot) return ''
  return `
    <div class="amend-modal-backdrop" data-action="close-amend-backdrop">
      <div class="amend-modal" data-action="amend-modal-stop">
        <button class="amend-modal-close" data-action="close-amend" aria-label="Close">×</button>
        <div class="amend-modal-h">
          <span class="amend-tag">AMEND ${escape(slot.fieldLabel.toUpperCase())}</span>
          <span class="amend-sub">Pick the value that matches the chart.</span>
        </div>
        <div class="amend-context">
          <strong>The chart says:</strong> ${escape(slot.contextLine)}
        </div>
        <ul class="amend-options">
          ${slot.options.map(opt => {
            const fb = state.amendFeedback?.id === opt.id ? state.amendFeedback : null
            const isCurrent = opt.support === 'current'
            return `
              <li class="amend-option ${isCurrent ? 'current' : ''} ${fb ? 'rejected' : ''}"
                  ${isCurrent ? '' : `data-action="pick-amend" data-id="${escape(opt.id)}"`}>
                <div class="amend-option-h">
                  <code>${escape(opt.id)}</code>
                  <span class="amend-option-label">${escape(opt.label)}</span>
                  ${isCurrent ? '<span class="amend-option-badge current">currently on line</span>' : ''}
                </div>
                ${fb ? `<div class="amend-option-fb">${escape(fb.message)}</div>` : ''}
              </li>
            `
          }).join('')}
        </ul>
        <p class="amend-hint-text">
          The chart is the source of truth. Wrong picks give feedback (no penalty).
        </p>
      </div>
    </div>
  `
}

function renderVictory(spec: PuzzleSpec): string {
  return `
    <section class="victory">
      <h2>${escape(spec.victory.headline)}</h2>
      <p class="register hospital">Hospital, the next morning.</p>
      ${spec.victory.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}
      <button class="btn primary" data-action="finish">Return to the Waiting Room</button>
    </section>
  `
}
