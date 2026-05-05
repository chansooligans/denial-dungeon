// Battle catalog — a static, framework-free page that lists every
// encounter in the game alongside its linked PatientCase and the
// pedagogy it carries. Deploys to /denial-dungeon/battles.html on
// GitHub Pages and is also useful as a design surface for drafting
// puzzle reframes outside the engine.

import { ENCOUNTERS } from '../content/enemies'
import { CASES } from '../content/cases'
import { TOOLS } from '../content/abilities'
import type {
  Encounter,
  PatientCase,
  CMS1500Data,
  UB04Data,
  BattleMechanic,
  Wing,
} from '../types'

const MECHANIC_BLURB: Record<BattleMechanic, string> = {
  simple: 'HP attrition with faction effectiveness — the baseline fight.',
  none: 'HP attrition with faction effectiveness — the baseline fight.',
  investigation: 'Case-file fact-finding. Investigate, Lookup, Document, Decide. Win when relevant facts ≥ threshold.',
  timed: 'HP plus a Days-Remaining countdown. Enemy damage escalates each turn; out of days = auto-loss.',
  block: 'Every odd turn the gate is shut and tools do 0 damage. A specific tool opens it permanently.',
  mirror: 'Same tool used twice in a row deals 0 damage and kicks back. Vary your approach.',
  multiHead: 'Multiple HP pools, each with its own rootCause. Super-effective is computed against the active head.',
  blind: 'Tool accuracy reduced until a specific tool clears the obstruction.',
  spawn: 'Source HP plus minions that spawn on a timer. One tool sweeps the swarm; another patches upstream and stops further spawns.',
  audit: 'Boss HP and damage scale with run-long auditRisk. Shadow tools heal the boss. Documentation tools are super-effective.',
}

const WING_BLURB: Record<Wing, string> = {
  eligibility: 'Eligibility — 270/271, COB, plan basics',
  coding: 'Coding — ICD-10, CPT, modifiers, CDI',
  billing: 'Billing — 837, scrubber, clearinghouse, 277CA',
  appeals: 'Appeals — medical necessity, prior auth, timely filing',
  reconsideration: 'Reconsideration — contract / fee schedule disputes',
  patient_services: 'Patient Services — NSA, estimates, cost share',
  miracles: 'Miracles — endgame / surreal',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderCMS1500(claim: CMS1500Data, highlighted: string[]): string {
  const isHi = (box: string) => highlighted.includes(box)
  const cls = (box: string) => isHi(box) ? ' hi' : ''
  const lines = claim.serviceLines
    .map((sl, i) => {
      const n = i + 1
      const cpt = `${sl.cpt.code}${sl.cpt.label ? ' — ' + sl.cpt.label : ''}${sl.modifier ? ' (mod ' + sl.modifier + ')' : ''}`
      return `
        <tr>
          <td class="${cls('24A-' + n)}">${escapeHtml(sl.dos)}</td>
          <td class="${cls('24B-' + n)}">${escapeHtml(sl.pos)}</td>
          <td class="${cls('24D-' + n)}">${escapeHtml(cpt)}</td>
          <td class="${cls('24E-' + n)}">${escapeHtml(sl.dxPointer)}</td>
          <td class="${cls('24F-' + n)}">${escapeHtml(sl.charges)}</td>
        </tr>`
    })
    .join('')
  const dx = claim.diagnoses
    .map((d, i) => {
      const letter = String.fromCharCode(65 + i)
      const box = '21' + letter
      return `<li class="${cls(box)}"><b>${letter}.</b> ${escapeHtml(d.code)}${d.label ? ' — ' + escapeHtml(d.label) : ''}</li>`
    })
    .join('')
  return `
    <div class="claim cms1500">
      <div class="claim-h">CMS-1500 · ${escapeHtml(claim.claimId)}</div>
      <div class="claim-grid">
        <div class="${cls('1')}"><b>Box 1 · Coverage:</b> ${escapeHtml(claim.insuranceType ?? '—')}</div>
        <div class="${cls('1a')}"><b>1a · Insured ID:</b> ${escapeHtml(claim.insured.id)}</div>
        <div class="${cls('2')}"><b>2 · Patient:</b> ${escapeHtml(claim.patient.name)} (${escapeHtml(claim.patient.dob)}${claim.patient.sex ? ', ' + claim.patient.sex : ''})</div>
        <div class="${cls('4')}"><b>4 · Insured:</b> ${escapeHtml(claim.insured.name ?? claim.patient.name)}${claim.insured.group ? ' · grp ' + escapeHtml(claim.insured.group) : ''}</div>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 21 — Diagnoses</div>
        <ul class="dx">${dx}</ul>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 24 — Service Lines</div>
        <table class="lines">
          <thead><tr><th>24A · DOS</th><th>24B · POS</th><th>24D · CPT / mod</th><th>24E · DxPtr</th><th>24F · Charges</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
      </div>
      <div class="claim-grid">
        <div class="${cls('31')}"><b>31 · Provider:</b> ${escapeHtml(claim.provider.name)}${claim.provider.npi ? ' · NPI ' + escapeHtml(claim.provider.npi) : ''}</div>
      </div>
    </div>`
}

function renderUB04(claim: UB04Data, highlighted: string[]): string {
  const isHi = (box: string) => highlighted.includes(box)
  const cls = (box: string) => isHi(box) ? ' hi' : ''
  const lines = claim.serviceLines
    .map((sl, i) => {
      const n = i + 1
      return `
        <tr>
          <td class="${cls('42-' + n)}">${escapeHtml(sl.revCode)}</td>
          <td class="${cls('43-' + n)}">${escapeHtml(sl.description)}</td>
          <td class="${cls('44-' + n)}">${escapeHtml(sl.hcpcs ?? '')}</td>
          <td class="${cls('45-' + n)}">${escapeHtml(sl.serviceDate ?? '')}</td>
          <td class="${cls('46-' + n)}">${escapeHtml(sl.units ?? '')}</td>
          <td class="${cls('47-' + n)}">${escapeHtml(sl.totalCharges)}</td>
        </tr>`
    })
    .join('')
  const dx = claim.diagnoses
    .map((d, i) => {
      const box = i === 0 ? '67' : '67' + String.fromCharCode(64 + i)
      return `<li class="${cls(box)}"><b>${box}.</b> ${escapeHtml(d.code)}${d.label ? ' — ' + escapeHtml(d.label) : ''}</li>`
    })
    .join('')
  return `
    <div class="claim ub04">
      <div class="claim-h">UB-04 · ${escapeHtml(claim.claimId)}</div>
      <div class="claim-grid">
        <div class="${cls('4')}"><b>4 · Type of Bill:</b> ${escapeHtml(claim.typeOfBill)}</div>
        <div class="${cls('14')}"><b>14 · Admission:</b> ${escapeHtml(claim.admissionType ?? '—')}</div>
        <div class="${cls('6')}"><b>6 · Statement Period:</b> ${claim.statementPeriod ? escapeHtml(claim.statementPeriod.from + ' → ' + claim.statementPeriod.through) : '—'}</div>
        <div><b>Patient:</b> ${escapeHtml(claim.patient.name)} (${escapeHtml(claim.patient.dob)}${claim.patient.sex ? ', ' + claim.patient.sex : ''})</div>
        <div><b>Insured:</b> ${escapeHtml(claim.insured.name ?? claim.patient.name)} · ID ${escapeHtml(claim.insured.id)}${claim.insured.group ? ' · grp ' + escapeHtml(claim.insured.group) : ''}</div>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 67 — Diagnoses (principal first)</div>
        <ul class="dx">${dx}</ul>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Boxes 42–47 — Service Lines</div>
        <table class="lines">
          <thead><tr><th>42 · Rev</th><th>43 · Desc</th><th>44 · HCPCS</th><th>45 · Date</th><th>46 · Units</th><th>47 · Charges</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
      </div>
      <div class="claim-grid">
        <div class="${cls('76')}"><b>76 · Attending:</b> ${escapeHtml(claim.attendingProvider.name)}${claim.attendingProvider.npi ? ' · NPI ' + escapeHtml(claim.attendingProvider.npi) : ''}</div>
        <div class="${cls('80')}"><b>80 · DRG:</b> ${escapeHtml(claim.drg ?? '—')}</div>
      </div>
    </div>`
}

function renderClaim(c: PatientCase | undefined, highlighted: string[]): string {
  if (!c?.claim) return ''
  return c.claim.type === 'cms1500' ? renderCMS1500(c.claim, highlighted) : renderUB04(c.claim, highlighted)
}

function renderCase(c: PatientCase | undefined): string {
  if (!c) return ''
  const errors = (c.errors ?? [])
    .map(e => `
      <li>
        <div class="err-field">${escapeHtml(e.field)}</div>
        <div class="err-fix"><span class="bad">${escapeHtml(e.currentValue || '(blank)')}</span> → <span class="good">${escapeHtml(e.correctValue)}</span></div>
        <div class="err-why">${escapeHtml(e.explanation)}</div>
      </li>`)
    .join('')
  return `
    <div class="case">
      <div class="case-h">Form-bridge · ${escapeHtml(c.id)}</div>
      <div class="case-meta">
        <b>${escapeHtml(c.patientName)}</b> · ${c.age} · ${escapeHtml(c.insurance)}
        <br />${escapeHtml(c.diagnosis)} (${escapeHtml(c.diagnosisCode)}) · ${escapeHtml(c.procedure)} (${escapeHtml(c.procedureCode)})
      </div>
      ${errors ? `<div class="errs"><div class="errs-h">Pre-fix errors (catch in FormScene → full-HP buff)</div><ul>${errors}</ul></div>` : ''}
    </div>`
}

function renderToolEffects(enc: Encounter): string {
  const fx = enc.toolEffects
  if (!fx || Object.keys(fx).length === 0) return ''
  const rows = Object.entries(fx)
    .map(([toolId, effects]) => {
      const tool = TOOLS[toolId]
      const label = tool ? tool.name : toolId
      const items = effects
        .map(e => {
          const sym = e.kind === 'check' ? '✓' : e.kind === 'stamp' ? '🟥' : '✎'
          return `<span class="fx fx-${e.kind}">${sym} <code>${escapeHtml(e.box)}</code> ${e.value ? '· ' + escapeHtml(e.value) : ''}</span>`
        })
        .join(' ')
      return `<tr><td>${escapeHtml(label)}</td><td>${items}</td></tr>`
    })
    .join('')
  return `
    <div class="effects">
      <div class="effects-h">Tool effects on the form</div>
      <table><tbody>${rows}</tbody></table>
    </div>`
}

function renderEncounter(enc: Encounter): string {
  const c = enc.caseId ? CASES[enc.caseId] : undefined
  const mech = (enc.mechanic ?? 'simple') as BattleMechanic
  const wingPill = enc.wing ? `<span class="pill wing-${enc.wing}">${escapeHtml(WING_BLURB[enc.wing])}</span>` : ''
  const carcPill = enc.carcCode ? `<span class="pill carc">${escapeHtml(enc.carcCode)}</span>` : ''
  const lvPill = `<span class="pill lv">L${enc.level}</span>`
  const archPill = enc.archetype ? `<span class="pill arch">${escapeHtml(enc.archetype)}</span>` : ''
  return `
    <article class="enc" id="${escapeHtml(enc.id)}">
      <header>
        <h2>${escapeHtml(enc.title)}</h2>
        <div class="pills">${lvPill}${carcPill}${archPill}${wingPill}<span class="pill mech">${escapeHtml(mech)}</span></div>
      </header>
      <p class="desc">${escapeHtml(enc.description)}</p>

      <div class="grid2">
        <div>
          <div class="field"><b>Surface symptom:</b> ${escapeHtml(enc.surfaceSymptom)}</div>
          <div class="field"><b>Root cause faction:</b> ${escapeHtml(enc.rootCause)}</div>
          <div class="field"><b>Watchpoint:</b> ${escapeHtml(enc.watchpoint)}</div>
          <div class="field"><b>Correct tools:</b> ${(enc.correctTools ?? []).map(id => `<code>${escapeHtml(TOOLS[id]?.name ?? id)}</code>`).join(', ') || '—'}</div>
          ${enc.unlocksOnDefeat?.length ? `<div class="field"><b>Unlocks on defeat:</b> ${enc.unlocksOnDefeat.map(id => `<code>${escapeHtml(TOOLS[id]?.name ?? id)}</code>`).join(', ')}</div>` : ''}
          ${enc.cashRecovered ? `<div class="field"><b>Cash recovered:</b> $${enc.cashRecovered.toLocaleString()}</div>` : ''}

          <div class="mech-blurb"><b>Mechanic — <code>${escapeHtml(mech)}</code>:</b> ${escapeHtml(MECHANIC_BLURB[mech])}</div>

          ${enc.payerNote ? `<blockquote class="payer-note"><b>Payer note (835/letter):</b><br />${escapeHtml(enc.payerNote)}</blockquote>` : ''}

          ${renderToolEffects(enc)}
        </div>
        <div>
          ${renderClaim(c, enc.highlightedBoxes ?? [])}
          ${renderCase(c)}
        </div>
      </div>
    </article>`
}

function render(): string {
  const all = Object.values(ENCOUNTERS).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
  const byMech = new Map<BattleMechanic, Encounter[]>()
  for (const enc of all) {
    const m = (enc.mechanic ?? 'simple') as BattleMechanic
    if (!byMech.has(m)) byMech.set(m, [])
    byMech.get(m)!.push(enc)
  }
  const tocItems = all
    .map(e => `<li><a href="#${escapeHtml(e.id)}">L${e.level} · ${escapeHtml(e.title)}</a> <span class="muted">${escapeHtml(((e.mechanic ?? 'simple') as string))}</span></li>`)
    .join('')

  const sections = Array.from(byMech.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mech, list]) => `
      <section class="mech-group">
        <h2 class="mech-group-h">${escapeHtml(mech)} <span class="muted">— ${escapeHtml(MECHANIC_BLURB[mech])}</span></h2>
        ${list.map(renderEncounter).join('')}
      </section>`)
    .join('')

  return `
    <header class="page-h">
      <h1>Denial Dungeon · Battle Catalog</h1>
      <p class="lede">Every encounter in the game — its mechanic, payer note, claim form, and the revenue-cycle workflow it teaches. <a href="./">Back to the game →</a></p>
      <p class="meta">${all.length} encounters · ${byMech.size} mechanics</p>
    </header>

    <nav class="toc">
      <h2>Index</h2>
      <ol>${tocItems}</ol>
    </nav>

    ${sections}

    <footer class="page-f">
      <p>Drafts and design notes live in <code>reference/journal/</code>. Source for each encounter: <code>src/content/enemies.ts</code>; cases in <code>src/content/cases.ts</code>.</p>
    </footer>`
}

const css = `
  :root {
    --bg: #0e1116;
    --panel: #161b24;
    --panel-2: #1d2330;
    --ink: #d8dee9;
    --ink-dim: #8a93a3;
    --accent: #7ee2c1;
    --accent-2: #f0a868;
    --bad: #ef5b7b;
    --good: #7ee2c1;
    --hi: rgba(239, 91, 123, 0.22);
    --hi-border: #ef5b7b;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    padding: 32px 20px 80px;
    max-width: 1180px; margin: 0 auto;
  }
  a { color: var(--accent); }
  h1, h2, h3 { color: var(--ink); margin: 0 0 8px; }
  h1 { font-size: 28px; letter-spacing: -0.01em; }
  h2 { font-size: 20px; }
  code { background: #0a0d12; padding: 1px 6px; border-radius: 4px; font-size: 0.92em; }
  blockquote { margin: 0; }
  ul, ol { margin: 0; padding-left: 22px; }

  .page-h { margin-bottom: 28px; }
  .lede { color: var(--ink-dim); margin: 6px 0 4px; }
  .meta { color: var(--ink-dim); font-size: 12px; margin: 0; }
  .page-f { margin-top: 60px; color: var(--ink-dim); font-size: 12px; }

  .toc { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 14px 18px 14px 32px; margin: 18px 0 36px; }
  .toc h2 { margin: 0 0 6px; font-size: 14px; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .toc ol { columns: 2; column-gap: 28px; padding-left: 18px; }
  .toc li { margin: 2px 0; break-inside: avoid; }
  .toc .muted { color: var(--ink-dim); font-size: 11.5px; margin-left: 6px; }

  .mech-group { margin: 36px 0 12px; }
  .mech-group-h { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-2); padding-bottom: 6px; border-bottom: 1px solid #232a36; }
  .mech-group-h .muted { text-transform: none; letter-spacing: 0; color: var(--ink-dim); font-weight: 400; font-size: 13px; }

  .enc { background: var(--panel); border: 1px solid #232a36; border-radius: 10px; padding: 18px 20px; margin: 14px 0; }
  .enc header h2 { font-size: 18px; margin-bottom: 4px; }
  .pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .pill {
    font-size: 11px; padding: 2px 8px; border-radius: 999px;
    background: var(--panel-2); border: 1px solid #2a3142; color: var(--ink-dim);
  }
  .pill.lv { color: var(--accent); border-color: #314637; }
  .pill.carc { color: var(--accent-2); border-color: #4a3a2a; }
  .pill.arch { color: #c8b6e0; border-color: #3a324a; }
  .pill.mech { color: #a3c5ff; border-color: #2c3a55; font-family: monospace; }
  .desc { color: var(--ink); margin: 12px 0 14px; font-size: 14px; }
  .grid2 { display: grid; grid-template-columns: 1.05fr 1fr; gap: 22px; }
  @media (max-width: 880px) { .grid2 { grid-template-columns: 1fr; } }
  .field { margin: 4px 0; font-size: 13.5px; }
  .field code { font-size: 12.5px; }
  .mech-blurb { margin: 12px 0; padding: 10px 12px; background: var(--panel-2); border-left: 3px solid #2c3a55; border-radius: 4px; font-size: 13px; }
  .payer-note { margin: 12px 0; padding: 10px 14px; background: rgba(239, 91, 123, 0.08); border-left: 3px solid var(--bad); border-radius: 4px; font-size: 13px; }

  .effects { margin-top: 12px; }
  .effects-h { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim); margin-bottom: 4px; }
  .effects table { border-collapse: collapse; width: 100%; }
  .effects td { padding: 3px 8px 3px 0; font-size: 12.5px; vertical-align: top; }
  .effects td:first-child { color: var(--ink-dim); white-space: nowrap; }
  .fx { display: inline-block; margin-right: 10px; }

  .claim { background: #f5f1e6; color: #1c1c1c; border-radius: 6px; padding: 12px 14px; font-size: 12px; line-height: 1.45; box-shadow: inset 0 0 0 1px #d6cfb8; }
  .claim-h { font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #5a4d2b; border-bottom: 1px solid #c8bf9d; padding-bottom: 4px; margin-bottom: 8px; }
  .claim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; margin: 6px 0; }
  .claim-grid > div { font-size: 12px; }
  .claim-section { margin-top: 10px; }
  .claim-section-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a4d2b; margin-bottom: 4px; }
  .claim ul.dx { padding-left: 18px; margin: 4px 0; }
  .claim ul.dx li { margin: 1px 0; }
  .claim table.lines { width: 100%; border-collapse: collapse; }
  .claim table.lines th, .claim table.lines td {
    text-align: left; font-size: 11.5px; padding: 3px 4px;
    border-bottom: 1px solid #d6cfb8;
  }
  .claim table.lines th { color: #5a4d2b; font-weight: 600; }
  .claim .hi {
    background: var(--hi);
    box-shadow: inset 0 0 0 1px var(--hi-border);
    border-radius: 3px;
  }

  .case { background: var(--panel-2); border: 1px solid #2a3142; border-radius: 8px; padding: 12px 14px; margin-top: 12px; font-size: 13px; }
  .case-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 4px; }
  .case-meta { color: var(--ink); margin-bottom: 8px; }
  .errs-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim); margin: 4px 0; }
  .errs ul { list-style: none; padding-left: 0; }
  .errs li { padding: 6px 0; border-top: 1px dashed #2a3142; }
  .err-field { font-weight: 600; color: var(--ink); }
  .err-fix { font-size: 12.5px; margin: 2px 0; }
  .err-fix .bad { color: var(--bad); text-decoration: line-through; }
  .err-fix .good { color: var(--good); }
  .err-why { font-size: 12px; color: var(--ink-dim); }

  .muted { color: var(--ink-dim); }
`

function mount() {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const root = document.getElementById('catalog')
  if (root) root.innerHTML = render()
}

mount()
