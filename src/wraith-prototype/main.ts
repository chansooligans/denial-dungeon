// Wraith @ L4 — first-sketch prototype.
//
// A standalone playable single-encounter sketch. Imports real case
// data from src/content/cases.ts so the encounter is grounded; the
// rest is hand-authored as a *first* answer to "what does a battle
// look like with no HP, no tools-as-damage, no multiple choice?"
//
// Key design choices being demonstrated:
//   - Verb space is INSPECT + CITE + SUBMIT, not attack/defend.
//   - Player builds a defense packet by connecting (payer phrase ↔
//     chart fact ↔ LCD clause) into citations. Each valid citation
//     resolves an issue.
//   - Distractors exist; selecting them yields informative feedback,
//     not damage.
//   - The Wraith is a presence, not an enemy. She "becomes more
//     readable" as the packet builds.
//   - No HP. No turn timer. No damage.
//
// Design notes panel at the top of the page makes the placeholder
// vs intentional split explicit so reviewers know what to react to.

import { CASES } from '../content/cases'

interface PayerPhrase {
  id: string
  text: string
  /** Issue this phrase belongs to. */
  issueId: string
}

interface ChartFact {
  id: string
  text: string
  /** Which issue this fact addresses (null = distractor). */
  issueId: string | null
  /** A line of feedback if used as a distractor (clarifies why). */
  distractorReason?: string
}

interface LcdClause {
  id: string
  text: string
  issueId: string
}

interface Issue {
  id: string
  label: string
  /** Short description of what resolving this gets you. */
  whatItDoes: string
}

const issues: Issue[] = [
  {
    id: 'specificity',
    label: 'Address diagnosis specificity (I50.9 → I50.42)',
    whatItDoes: 'Replaces the unspecified dx with one that supports the LCD.',
  },
  {
    id: 'criterion',
    label: 'Cite an alternative LCD criterion',
    whatItDoes: 'LCD allows creatinine > 2.5 instead of LVEF<35%.',
  },
  {
    id: 'symptomatology',
    label: 'Document supporting symptomatology',
    whatItDoes: 'LCD requires "documented symptomatology" alongside labs.',
  },
]

const payerPhrases: PayerPhrase[] = [
  {
    id: 'unspec-dx',
    text: 'I50.9 (heart failure, unspecified)',
    issueId: 'specificity',
  },
  {
    id: 'lvef',
    text: 'without supporting evidence of LVEF<35%',
    issueId: 'criterion',
  },
  {
    id: 'no-evidence',
    text: 'absent supporting documentation',
    issueId: 'symptomatology',
  },
]

const chartFacts: ChartFact[] = [
  {
    id: 'systolic',
    text: 'Echo report on file: documented systolic dysfunction',
    issueId: 'specificity',
  },
  {
    id: 'creat',
    text: 'Labs (3 mo prior): creatinine 2.8',
    issueId: 'criterion',
  },
  {
    id: 'sx',
    text: 'Documented fatigue, edema, declining GFR',
    issueId: 'symptomatology',
  },
  {
    id: 'ckd',
    text: 'Patient has chronic kidney disease, stage 3',
    issueId: 'criterion',
  },
  {
    id: 'tuesday',
    text: 'Procedure performed at 9:00 AM Tuesday',
    issueId: null,
    distractorReason: 'Time of procedure is not relevant to medical-necessity criteria.',
  },
  {
    id: 'zone',
    text: 'Patient lives in service-area Zone 2',
    issueId: null,
    distractorReason: 'Geography is not part of LCD L33526.',
  },
  {
    id: 'referrer',
    text: 'Referring provider is in-network',
    issueId: null,
    distractorReason: 'Network status doesn\'t address medical necessity.',
  },
]

const lcdClauses: LcdClause[] = [
  {
    id: 'specificity-rule',
    text: 'Coverage requires a specific cardiac dx (I50.x with severity), not unspecified heart failure.',
    issueId: 'specificity',
  },
  {
    id: 'creat-alt',
    text: 'Alternative criterion: creatinine > 2.5 mg/dL with documented symptomatology.',
    issueId: 'criterion',
  },
  {
    id: 'sx-required',
    text: 'Documented symptomatology required for coverage when LVEF data not on file.',
    issueId: 'symptomatology',
  },
]

// === Runtime state ===

interface SelectionState {
  payerId: string | null
  chartId: string | null
  lcdId: string | null
}

const state = {
  selection: { payerId: null, chartId: null, lcdId: null } as SelectionState,
  resolvedIssues: new Set<string>(),
  citationCount: 0,
  failedAttempts: 0,
  feedback: '' as string,
  feedbackKind: 'neutral' as 'neutral' | 'good' | 'bad',
  packetSubmitted: false,
}

// === Rendering ===

const wraithCase = CASES.case_wraith_walker

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function render(): string {
  if (state.packetSubmitted) return renderVictory()
  return `
    ${renderHeader()}
    ${renderHospitalIntro()}
    ${renderClaim()}
    ${renderWorkbench()}
    ${renderCitationBuilder()}
    ${renderChecklist()}
    ${renderWraith()}
    ${renderDesignNotes()}
  `
}

function renderHeader(): string {
  return `
    <header class="page-h">
      <div class="title-row">
        <h1>Wraith <span class="muted">@ L4 — first-sketch prototype</span></h1>
        <a class="back-link" href="./">← back to game</a>
      </div>
      <p class="lede">
        A redesign sketch of the Medical Necessity Wraith encounter
        (CO-50). Drops HP, tools-as-damage, and multiple choice.
        First answer to "what does a battle look like in this game."
        See the <a href="#design-notes">design notes</a> for what's
        intentional vs placeholder.
      </p>
    </header>
  `
}

function renderHospitalIntro(): string {
  return `
    <section class="hospital-intro">
      <div class="register hospital">HOSPITAL · earlier today</div>
      <p>
        Mrs. Walker's daughter called this morning. Her mother's
        echocardiogram came back denied — CO-50, "not medically
        necessary." She's 67 and her cardiologist is worried.
        Martinez, the CDI specialist, is on vacation. The case
        is on your desk.
      </p>
      <p>
        You walk to the CDI workroom to read the chart. You pull
        the file, sit down, open it &mdash;
      </p>
      <div class="register-flip">
        <div class="ripple"></div>
        <em>— and the floor ripples. The fluorescent above flickers
        once. You're somewhere else.</em>
      </div>
      <div class="register waiting-room">WAITING ROOM · now</div>
    </section>
  `
}

function renderClaim(): string {
  const claim = wraithCase.claim
  if (!claim || claim.type !== 'cms1500') return ''
  return `
    <section class="claim">
      <div class="claim-h">CMS-1500 · ${escape(claim.claimId)}</div>
      <div class="claim-grid">
        <div><b>Patient:</b> ${escape(claim.patient.name)} · ${escape(claim.patient.dob)}</div>
        <div><b>Insurer:</b> ${escape(claim.insured.name ?? '')} · ${escape(claim.insured.id)}</div>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 21 · Diagnoses (DISPUTED)</div>
        <ul class="dx">
          ${claim.diagnoses.map((d, i) => {
            const letter = String.fromCharCode(65 + i)
            return `<li class="hi"><b>${letter}.</b> ${escape(d.code)}${d.label ? ' — ' + escape(d.label) : ''}</li>`
          }).join('')}
        </ul>
      </div>
      <div class="claim-section">
        <div class="claim-section-h">Box 24 · Service Lines</div>
        <table class="lines">
          <thead><tr><th>DOS</th><th>POS</th><th>CPT</th><th>Charges</th></tr></thead>
          <tbody>
            ${claim.serviceLines.map(sl => `
              <tr class="hi">
                <td>${escape(sl.dos)}</td>
                <td>${escape(sl.pos)}</td>
                <td>${escape(sl.cpt.code)}${sl.cpt.label ? ' — ' + escape(sl.cpt.label) : ''}</td>
                <td>${escape(sl.charges)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderWorkbench(): string {
  return `
    <section class="workbench">
      <div class="col col-payer">
        <div class="col-h">
          <span class="col-tag">PAYER NOTE</span>
          <span class="col-sub">Click a phrase to select it.</span>
        </div>
        <p class="col-prose">
          ${payerPhrases.map(p => phraseSpan(p, 'payer')).join(' ')}
          The claim is denied per LCD L33526.
        </p>
      </div>
      <div class="col col-chart">
        <div class="col-h">
          <span class="col-tag">CHART (Walker, A.)</span>
          <span class="col-sub">Click a fact to cite it.</span>
        </div>
        <ul class="facts">
          ${chartFacts.map(f => `
            <li class="fact ${state.selection.chartId === f.id ? 'selected' : ''}"
                data-action="select-chart" data-id="${f.id}">
              ${escape(f.text)}
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="col col-lcd">
        <div class="col-h">
          <span class="col-tag">LCD L33526</span>
          <span class="col-sub">Click a clause to back the citation.</span>
        </div>
        <ul class="clauses">
          ${lcdClauses.map(c => `
            <li class="clause ${state.selection.lcdId === c.id ? 'selected' : ''}"
                data-action="select-lcd" data-id="${c.id}">
              ${escape(c.text)}
            </li>
          `).join('')}
        </ul>
      </div>
    </section>
  `
}

function phraseSpan(p: PayerPhrase, _kind: string): string {
  const sel = state.selection.payerId === p.id ? 'selected' : ''
  return `<span class="phrase ${sel}" data-action="select-payer" data-id="${p.id}">${escape(p.text)}</span>`
}

function renderCitationBuilder(): string {
  const sel = state.selection
  const payerLabel = sel.payerId
    ? payerPhrases.find(p => p.id === sel.payerId)?.text
    : null
  const chartLabel = sel.chartId
    ? chartFacts.find(f => f.id === sel.chartId)?.text
    : null
  const lcdLabel = sel.lcdId
    ? lcdClauses.find(c => c.id === sel.lcdId)?.text
    : null
  const ready = !!(sel.payerId && sel.chartId && sel.lcdId)
  const fbClass = state.feedback ? `fb-${state.feedbackKind}` : ''
  return `
    <section class="builder">
      <div class="builder-h">Citation builder</div>
      <div class="builder-row">
        <div class="slot ${sel.payerId ? 'filled' : ''}">
          <div class="slot-label">PAYER ASSERTS</div>
          <div class="slot-text">${payerLabel ? '"' + escape(payerLabel) + '"' : '<span class="placeholder">Click a payer phrase</span>'}</div>
        </div>
        <div class="connector">cited by</div>
        <div class="slot ${sel.chartId ? 'filled' : ''}">
          <div class="slot-label">CHART FACT</div>
          <div class="slot-text">${chartLabel ? escape(chartLabel) : '<span class="placeholder">Click a chart fact</span>'}</div>
        </div>
        <div class="connector">per</div>
        <div class="slot ${sel.lcdId ? 'filled' : ''}">
          <div class="slot-label">LCD CLAUSE</div>
          <div class="slot-text">${lcdLabel ? escape(lcdLabel) : '<span class="placeholder">Click an LCD clause</span>'}</div>
        </div>
      </div>
      <div class="builder-actions">
        <button class="btn primary ${ready ? '' : 'disabled'}" ${ready ? '' : 'disabled'} data-action="cite">CITE</button>
        <button class="btn ghost" data-action="clear">Clear</button>
      </div>
      ${state.feedback ? `<div class="feedback ${fbClass}">${escape(state.feedback)}</div>` : ''}
    </section>
  `
}

function renderChecklist(): string {
  const allResolved = state.resolvedIssues.size === issues.length
  return `
    <section class="checklist">
      <div class="checklist-h">Defense packet — ${state.resolvedIssues.size} of ${issues.length} issues addressed</div>
      <ul>
        ${issues.map(i => {
          const done = state.resolvedIssues.has(i.id)
          return `
            <li class="${done ? 'done' : ''}">
              <span class="check">${done ? '✓' : '○'}</span>
              <div class="issue-body">
                <div class="issue-label">${escape(i.label)}</div>
                <div class="issue-sub">${escape(i.whatItDoes)}</div>
              </div>
            </li>
          `
        }).join('')}
      </ul>
      <button class="btn submit ${allResolved ? '' : 'disabled'}"
              ${allResolved ? '' : 'disabled'}
              data-action="submit">
        SUBMIT DEFENSE PACKET
      </button>
      ${state.failedAttempts > 0 ? `<div class="fail-counter">Failed citations this session: ${state.failedAttempts}. (No penalty — informative only.)</div>` : ''}
    </section>
  `
}

function renderWraith(): string {
  // She "becomes more readable" as issues resolve. We model this
  // with opacity + a CSS filter that goes from blurry to crisp.
  const total = issues.length
  const resolved = state.resolvedIssues.size
  const ratio = resolved / total
  const opacity = 0.25 + ratio * 0.6 // 0.25 → 0.85
  const blur = 6 - ratio * 5 // 6px → 1px
  return `
    <aside class="wraith">
      <div class="wraith-svg" style="opacity: ${opacity.toFixed(2)}; filter: blur(${blur.toFixed(1)}px);">
        ${wraithSvg()}
      </div>
      <div class="wraith-line">
        ${ratio === 0 ? '<em>The Wraith. She is not done yet, and neither are you.</em>' : ''}
        ${ratio > 0 && ratio < 1 ? '<em>She watches as the packet builds. Her edges are easier to read now.</em>' : ''}
        ${ratio === 1 ? '<em>She is fully here. Whatever you do next, she will accept it as final.</em>' : ''}
      </div>
    </aside>
  `
}

function wraithSvg(): string {
  // Quick figure made of CMS-1500-shaped fragments. Just enough to
  // suggest "person made of half-finished forms."
  return `
    <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" aria-label="Medical Necessity Wraith">
      <defs>
        <linearGradient id="paper" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#f5f1e6" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#a8967a" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="35" rx="22" ry="28" fill="url(#paper)"/>
      <rect x="35" y="60" width="50" height="80" fill="url(#paper)" rx="6"/>
      <line x1="38" y1="72" x2="80" y2="72" stroke="#5a4d2b" stroke-width="0.8" opacity="0.5"/>
      <line x1="38" y1="80" x2="76" y2="80" stroke="#5a4d2b" stroke-width="0.8" opacity="0.5"/>
      <line x1="38" y1="88" x2="80" y2="88" stroke="#5a4d2b" stroke-width="0.8" opacity="0.5"/>
      <line x1="38" y1="96" x2="72" y2="96" stroke="#5a4d2b" stroke-width="0.8" opacity="0.5"/>
      <line x1="38" y1="104" x2="80" y2="104" stroke="#5a4d2b" stroke-width="0.8" opacity="0.5"/>
      <ellipse cx="50" cy="38" rx="3" ry="4" fill="#1a1a1a" opacity="0.6"/>
      <ellipse cx="70" cy="38" rx="3" ry="4" fill="#1a1a1a" opacity="0.6"/>
      <path d="M 50 50 Q 60 53 70 50" fill="none" stroke="#1a1a1a" stroke-width="0.8" opacity="0.5"/>
      <line x1="20" y1="80" x2="35" y2="100" stroke="#a8967a" stroke-width="2" opacity="0.4"/>
      <line x1="100" y1="80" x2="85" y2="100" stroke="#a8967a" stroke-width="2" opacity="0.4"/>
    </svg>
  `
}

function renderVictory(): string {
  return `
    ${renderHeader()}
    <section class="victory">
      <h2>The packet submits.</h2>
      <p class="register hospital">Hospital, the next morning.</p>
      <p>
        Walker's appeal is approved. The TTE is covered. Her
        daughter calls back to say thank you. You don't tell her
        about the room you fell into.
      </p>
      <p class="register waiting-room">Waiting Room.</p>
      <p>
        The Wraith is not where she was. The chair where she sat is
        empty. There are still <em>so many</em> chairs.
      </p>
      <button class="btn primary" data-action="reset">Run it again</button>
      <a class="back-link inline" href="./">← back to game</a>
    </section>
  `
}

function renderDesignNotes(): string {
  return `
    <section class="design-notes" id="design-notes">
      <h2>Design notes — what's intentional vs placeholder</h2>
      <div class="notes-grid">
        <div>
          <h3>Intentional</h3>
          <ul>
            <li><b>No HP.</b> The Wraith doesn't take damage. She becomes more *readable* as the packet builds.</li>
            <li><b>No "tools" buttons.</b> The verbs are <em>select payer phrase / chart fact / LCD clause</em>, then <em>cite</em>, then <em>submit</em>. Nothing is a damage ability.</li>
            <li><b>No multiple choice.</b> Connections are drawn freely from real text, not picked from A/B/C.</li>
            <li><b>Distractors give feedback, not damage.</b> Pick "patient lives in Zone 2" and the citation builder tells you why it doesn't follow. No HP loss.</li>
            <li><b>The case data is real.</b> Imported from <code>src/content/cases.ts</code> — Walker, the dx, the LCD reference. The encounter is grounded in the existing form-bridge case.</li>
            <li><b>Heavy → light register flip.</b> Hospital intro carries the patient weight (Walker's daughter, Martinez on vacation). Waiting Room is the catharsis where the player gets to <em>do something</em>.</li>
            <li><b>The dreamlike fall.</b> The Hospital intro ends with "the floor ripples"; the Waiting Room begins immediately. No menu, no "descend" button.</li>
          </ul>
        </div>
        <div>
          <h3>Placeholder / first-draft</h3>
          <ul>
            <li><b>Three issues, three citations.</b> Number is arbitrary; could be 2 or 4. We picked three because the LCD has three natural criteria.</li>
            <li><b>Distractors are obvious.</b> "Tuesday at 9am" is too easy. Real distractors should look more like signals.</li>
            <li><b>No time pressure.</b> Filing window not modeled. Open question — should it be?</li>
            <li><b>Form-bridge buff not wired.</b> Pre-fixing the dx in FormScene would presumably auto-resolve issue 1 ("specificity"). Demo doesn't simulate this yet.</li>
            <li><b>The Wraith art is a sketch.</b> SVG figure. Real implementation should be evocative; this is just enough to show the "becomes readable" effect.</li>
            <li><b>No surreal humor.</b> The Wraith doesn't speak. Real version probably has lines that are <em>funny</em> in the Reaper-with-numbered-ticket way. See <a href="./reference/narrative/tone.md">narrative/tone.md</a>.</li>
            <li><b>No shortcut paths.</b> Player can't fabricate or upcode. Probably should be possible (with audit-risk cost) per the existing shadow-tool econ.</li>
            <li><b>Submit is final.</b> Player can't walk away and come back. Open question — should they be able to?</li>
          </ul>
        </div>
      </div>
      <p class="notes-cta">
        Open <code>src/wraith-prototype/main.ts</code> to see the
        encounter data and interaction logic. The full design
        process lives at <a href="./reference/puzzles/wraith-redesign.md">reference/puzzles/wraith-redesign.md</a>.
      </p>
    </section>
  `
}

// === Interactions ===

function findFact(id: string) { return chartFacts.find(f => f.id === id) }
function findPayer(id: string) { return payerPhrases.find(p => p.id === id) }
function findLcd(id: string) { return lcdClauses.find(c => c.id === id) }

function setFeedback(text: string, kind: 'good' | 'bad' | 'neutral' = 'neutral') {
  state.feedback = text
  state.feedbackKind = kind
}

function clearSelection() {
  state.selection = { payerId: null, chartId: null, lcdId: null }
}

function attemptCite() {
  const sel = state.selection
  if (!sel.payerId || !sel.chartId || !sel.lcdId) return

  const payer = findPayer(sel.payerId)!
  const chart = findFact(sel.chartId)!
  const lcd = findLcd(sel.lcdId)!

  // Distractor on chart fact?
  if (chart.issueId === null) {
    state.failedAttempts += 1
    setFeedback(
      `That fact doesn't follow. ${chart.distractorReason ?? ''} Try another.`,
      'bad'
    )
    return
  }

  // All three address the same issue?
  if (
    payer.issueId === chart.issueId &&
    chart.issueId === lcd.issueId
  ) {
    if (state.resolvedIssues.has(chart.issueId)) {
      setFeedback(
        'Already cited. Try a different issue — there are still gaps in the packet.',
        'neutral'
      )
      return
    }
    state.resolvedIssues.add(chart.issueId)
    state.citationCount += 1
    const issue = issues.find(i => i.id === chart.issueId)!
    setFeedback(
      `Citation accepted. Issue addressed: ${issue.label}.`,
      'good'
    )
    clearSelection()
    return
  }

  // Mismatch — three pieces don't address the same issue.
  state.failedAttempts += 1
  setFeedback(
    'Those three pieces don\'t address the same issue. The chart fact and the LCD clause should answer the payer\'s assertion, not three different ones.',
    'bad'
  )
}

function attemptSubmit() {
  if (state.resolvedIssues.size < issues.length) return
  state.packetSubmitted = true
}

function reset() {
  state.selection = { payerId: null, chartId: null, lcdId: null }
  state.resolvedIssues = new Set()
  state.citationCount = 0
  state.failedAttempts = 0
  state.feedback = ''
  state.feedbackKind = 'neutral'
  state.packetSubmitted = false
}

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const el = target.closest('[data-action]') as HTMLElement | null
  if (!el) return
  const action = el.dataset.action
  const id = el.dataset.id

  switch (action) {
    case 'select-payer':
      state.selection.payerId = id ?? null
      setFeedback('')
      break
    case 'select-chart':
      state.selection.chartId = id ?? null
      setFeedback('')
      break
    case 'select-lcd':
      state.selection.lcdId = id ?? null
      setFeedback('')
      break
    case 'cite':
      attemptCite()
      break
    case 'clear':
      clearSelection()
      setFeedback('')
      break
    case 'submit':
      attemptSubmit()
      break
    case 'reset':
      reset()
      break
    default:
      return
  }

  rerender()
}

// === Mount ===

const css = `
  :root {
    --bg: #0a0d12;
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
    --paper: #f5f1e6;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    padding: 28px 20px 80px;
    max-width: 1180px; margin: 0 auto;
    position: relative;
  }

  /* Subtle Waiting-Room atmosphere */
  body::before {
    content: "";
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(126, 226, 193, 0.04), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(177, 139, 214, 0.04), transparent 50%);
    z-index: 0;
    animation: flicker 7s infinite;
  }
  @keyframes flicker {
    0%, 95%, 100% { opacity: 1; }
    96% { opacity: 0.85; }
    97% { opacity: 1; }
    98% { opacity: 0.7; }
    99% { opacity: 1; }
  }
  #prototype-root { position: relative; z-index: 1; }

  a { color: var(--accent); }
  h1, h2, h3 { color: var(--ink); margin: 0 0 8px; }
  h1 { font-size: 24px; letter-spacing: -0.01em; }
  h2 { font-size: 18px; }
  h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); }
  code { background: #0a0d12; padding: 1px 6px; border-radius: 4px; font-size: 0.92em; }
  ul, ol { margin: 0; padding-left: 22px; }

  .page-h { margin-bottom: 22px; }
  .title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  .lede { color: var(--ink-dim); margin: 6px 0 0; max-width: 800px; }
  .muted { color: var(--ink-dim); font-weight: 400; font-size: 16px; }
  .back-link { font-size: 13px; }

  .hospital-intro { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 18px 22px; margin-bottom: 22px; }
  .hospital-intro p { margin: 8px 0; }
  .register { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; padding: 2px 10px; border-radius: 3px; display: inline-block; }
  .register.hospital { background: rgba(240, 168, 104, 0.12); color: var(--accent-2); border: 1px solid #4a3a2a; }
  .register.waiting-room { background: rgba(177, 139, 214, 0.12); color: #c8b6e0; border: 1px solid #3a324a; }
  .register-flip { margin: 16px 0; padding: 12px 16px; border-left: 3px solid #c8b6e0; background: rgba(177, 139, 214, 0.05); font-size: 13.5px; }
  .ripple {
    width: 100%; height: 2px; margin-bottom: 8px;
    background: linear-gradient(90deg, transparent, #c8b6e0, transparent);
    animation: ripple 4s infinite ease-in-out;
  }
  @keyframes ripple {
    0%, 100% { transform: translateX(-100%); opacity: 0; }
    50% { transform: translateX(0); opacity: 0.6; }
  }

  .claim { background: var(--paper); color: #1c1c1c; border-radius: 6px; padding: 14px 18px; margin-bottom: 22px; box-shadow: inset 0 0 0 1px #d6cfb8; font-size: 12.5px; }
  .claim-h { font-weight: 700; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #5a4d2b; padding-bottom: 6px; border-bottom: 1px solid #c8bf9d; margin-bottom: 8px; }
  .claim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; margin: 6px 0; }
  .claim-section { margin-top: 10px; }
  .claim-section-h { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a4d2b; margin-bottom: 4px; }
  .claim ul.dx { padding-left: 18px; margin: 4px 0; list-style: none; }
  .claim ul.dx li { margin: 2px 0; }
  .claim table.lines { width: 100%; border-collapse: collapse; }
  .claim table.lines th, .claim table.lines td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #d6cfb8; }
  .claim .hi { background: var(--hi); box-shadow: inset 0 0 0 1px var(--hi-border); border-radius: 3px; }

  .workbench { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 22px; }
  @media (max-width: 980px) { .workbench { grid-template-columns: 1fr; } }
  .col { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 14px 16px; }
  .col-h { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
  .col-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .col-payer .col-tag { color: var(--bad); }
  .col-chart .col-tag { color: var(--accent); }
  .col-lcd .col-tag { color: #a3c5ff; }
  .col-sub { font-size: 11.5px; color: var(--ink-dim); }
  .col-prose { font-size: 13.5px; line-height: 1.6; margin: 0; }
  .phrase {
    cursor: pointer;
    background: rgba(239, 91, 123, 0.12);
    border-bottom: 1px dashed var(--bad);
    padding: 1px 4px;
    border-radius: 2px;
    transition: background 0.15s;
  }
  .phrase:hover { background: rgba(239, 91, 123, 0.25); }
  .phrase.selected { background: rgba(239, 91, 123, 0.45); border-bottom-style: solid; color: #fff; }
  .facts, .clauses { list-style: none; padding-left: 0; margin: 0; }
  .fact, .clause {
    padding: 8px 10px;
    margin: 4px 0;
    background: var(--panel-2);
    border-radius: 5px;
    border-left: 3px solid transparent;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }
  .fact:hover, .clause:hover { background: #232b3a; }
  .fact.selected { border-left-color: var(--accent); background: rgba(126, 226, 193, 0.1); }
  .clause.selected { border-left-color: #a3c5ff; background: rgba(163, 197, 255, 0.08); }

  .builder { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .builder-h { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); margin-bottom: 10px; }
  .builder-row { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 10px; align-items: stretch; }
  @media (max-width: 980px) { .builder-row { grid-template-columns: 1fr; } .connector { text-align: center; padding: 4px 0; } }
  .slot {
    padding: 10px 12px;
    background: var(--panel-2);
    border: 1px dashed #2a3142;
    border-radius: 5px;
    min-height: 60px;
  }
  .slot.filled { border-style: solid; border-color: #3a4658; }
  .slot-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); margin-bottom: 4px; }
  .slot-text { font-size: 13px; }
  .placeholder { color: var(--ink-dim); font-style: italic; }
  .connector { color: var(--ink-dim); font-size: 12px; align-self: center; padding: 0 6px; font-style: italic; }

  .builder-actions { margin-top: 12px; display: flex; gap: 10px; }
  .btn {
    font: inherit;
    padding: 8px 18px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
    font-size: 13px;
    letter-spacing: 0.04em;
  }
  .btn.primary { background: var(--accent); color: #0a0d12; font-weight: 600; }
  .btn.primary:hover:not(.disabled) { background: #a8efd4; }
  .btn.ghost { background: transparent; color: var(--ink-dim); border-color: #2a3142; }
  .btn.ghost:hover { color: var(--ink); border-color: var(--ink-dim); }
  .btn.submit { background: var(--accent-2); color: #0a0d12; font-weight: 700; padding: 12px 24px; margin-top: 14px; }
  .btn.submit:hover:not(.disabled) { background: #f7c08a; }
  .btn.disabled { opacity: 0.4; cursor: not-allowed; }

  .feedback { margin-top: 10px; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
  .fb-good { background: rgba(126, 226, 193, 0.1); border-left: 3px solid var(--good); color: var(--good); }
  .fb-bad { background: rgba(239, 91, 123, 0.08); border-left: 3px solid var(--bad); color: #f3a4b6; }
  .fb-neutral { background: var(--panel-2); border-left: 3px solid var(--ink-dim); color: var(--ink); }

  .checklist { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .checklist-h { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); margin-bottom: 10px; }
  .checklist ul { list-style: none; padding-left: 0; margin: 0; }
  .checklist li { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #232a36; }
  .checklist li:last-child { border-bottom: none; }
  .checklist li.done { opacity: 0.55; }
  .checklist li.done .issue-label { text-decoration: line-through; }
  .check { font-size: 18px; color: var(--accent); width: 20px; flex-shrink: 0; }
  .issue-body { flex: 1; }
  .issue-label { font-size: 13.5px; }
  .issue-sub { font-size: 12px; color: var(--ink-dim); margin-top: 2px; }
  .fail-counter { margin-top: 10px; font-size: 12px; color: var(--ink-dim); font-style: italic; }

  .wraith {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 140px;
    z-index: 5;
    text-align: center;
    pointer-events: none;
  }
  .wraith-svg {
    transition: opacity 0.6s, filter 0.6s;
  }
  .wraith-svg svg { width: 100%; height: auto; }
  .wraith-line {
    margin-top: 8px;
    font-size: 11.5px;
    color: var(--ink-dim);
    line-height: 1.4;
  }

  .design-notes { margin-top: 60px; padding: 24px; background: var(--panel); border: 1px solid #232a36; border-radius: 8px; }
  .notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }
  @media (max-width: 880px) { .notes-grid { grid-template-columns: 1fr; } }
  .notes-grid h3 { margin-bottom: 8px; }
  .notes-grid ul { padding-left: 18px; }
  .notes-grid li { font-size: 13px; margin: 6px 0; }
  .notes-cta { margin-top: 18px; font-size: 13px; color: var(--ink-dim); }

  .victory { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 32px 28px; margin: 22px 0 60px; text-align: center; }
  .victory h2 { font-size: 26px; margin-bottom: 16px; }
  .victory p { max-width: 520px; margin: 12px auto; }
  .victory .register { margin-top: 20px; }
  .victory .btn.primary { margin-top: 24px; }
  .victory .back-link.inline { display: block; margin-top: 16px; font-size: 12px; }
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
}

mount()
