// Prototype catalog — index page for the encounter-redesign
// prototypes. Replaces the older battles.html catalog.
//
// Each prototype is a standalone single-encounter sketch testing
// what battles look like in this game once HP / tools-as-damage /
// multiple choice are off the table. They share a framework
// (Hospital intro → dreamlike fall → claim form + workbench +
// builder) but each tunes the verb-space to the encounter.
//
// New prototypes get added to PROTOTYPES below; the page renders
// itself from that list.

interface Prototype {
  id: string
  title: string
  subtitle: string
  archetype: string
  carc: string
  level: number
  status: 'shipped' | 'planned'
  /** What the verb-space looks like for this encounter. */
  verbs: string
  /** What this prototype tests beyond the wraith. */
  testing: string
  /** Path to the prototype's HTML page. */
  href?: string
  /**
   * Curriculum district — matches the four district markers in
   * `src/scenes/WaitingRoomScene.ts`. 'release-valve' is the
   * special fifth category for restorative, non-combat
   * encounters (the Lighthouse). The accent below should
   * be the district's canonical color.
   */
  district: 'eligibility' | 'coding' | 'billing' | 'appeals' | 'release-valve'
  /** District accent — pinned to one of five canonical colors. */
  accent: string
}

const prototypes: Prototype[] = [
  {
    id: 'wraith',
    title: 'Medical Necessity Wraith',
    subtitle: '@ L4 — first-sketch prototype',
    archetype: 'Wraith',
    carc: 'CO-50',
    level: 4,
    status: 'shipped',
    verbs: 'CITE-dominant + AMEND',
    testing: 'The base framework. No HP, no tools-as-damage, no multiple choice. Player builds citations from chart + policy against payer phrases; resolves three issues; submits a defense packet.',
    href: './wraith-prototype.html',
    district: 'coding',
    accent: '#f0a868',
  },
  {
    id: 'bundle',
    title: 'Bundling Beast',
    subtitle: '@ L4 — sibling prototype',
    archetype: 'Bundle',
    carc: 'CO-97',
    level: 4,
    status: 'shipped',
    verbs: 'AMEND-dominant + CITE',
    testing: 'Quick surgical fixes. Modifier 25 on Box 24 (not dx in Box 21). Different field, different rhythm — proves the framework holds for "fix and resubmit" encounters as well as protracted appeals.',
    href: './bundle-prototype.html',
    district: 'coding',
    accent: '#f0a868',
  },
  {
    id: 'reaper',
    title: 'Timely Filing Reaper',
    subtitle: '@ L7 — third-sibling prototype',
    archetype: 'Reaper',
    carc: 'CO-29',
    level: 7,
    status: 'shipped',
    verbs: 'TIME PRESSURE + CITE + AMEND',
    testing: 'A real countdown. The appeal window is 14 days; every action burns 1–4 of them; running out closes the file. Tests whether pressure reads as urgency rather than punishment when costs are visible up front.',
    href: './reaper-prototype.html',
    district: 'appeals',
    accent: '#b18bd6',
  },
  {
    id: 'swarm',
    title: 'CO-16 Sprite Swarm',
    subtitle: '@ L2 — seventh-sibling prototype',
    archetype: 'Swarm',
    carc: 'CO-16',
    level: 2,
    status: 'shipped',
    verbs: 'BATCH + sweep + patch upstream',
    testing: 'New verb: BATCH. Eighteen weekend CO-16 rejections, fourteen sharing one root cause (a misconfigured NPI on a provider profile). Fix the cluster as a group, sweep the outliers individually (one is a clearinghouse false positive — correct move is "no action"), then file an EHR ticket so the same 14 claims don\'t come back next Monday. First prototype that operates on a queue, not a single claim.',
    href: './swarm-prototype.html',
    district: 'eligibility',
    accent: '#7ee2c1',
  },
  {
    id: 'fog',
    title: 'Eligibility Fog',
    subtitle: '@ L2 — fifth-sibling prototype',
    archetype: 'Fog',
    carc: 'pre-submit',
    level: 2,
    status: 'shipped',
    verbs: 'REVEAL + AMEND',
    testing: 'New verb: REVEAL. Discrepant claim fields are literally fogged over until you run a 270 inquiry; the 271 response burns the fog off and reveals which fields differ from what the payer actually has on file. First prototype where the fight happens upstream — before submit, not after denial.',
    href: './fog-prototype.html',
    district: 'eligibility',
    accent: '#7ee2c1',
  },
  {
    id: 'specter',
    title: 'Underpayment Specter',
    subtitle: '@ L7 — eighth-sibling prototype',
    archetype: 'Specter',
    carc: 'CO-45 (hidden)',
    level: 7,
    status: 'shipped',
    verbs: 'VARIANCE + APPEAL',
    testing: 'New verb: VARIANCE. The 835 ERA arrived showing four claims paid; one hides a $28 underpayment because the payer\'s fee table was never updated for the 2026 contract. Verify each claim line-by-line against the contract, flag the underpayment, file the appeal with the right shortfall + reason. First prototype where the input is a successful payment, not a denial.',
    href: './specter-prototype.html',
    district: 'billing',
    accent: '#ef5b7b',
  },
  {
    id: 'audit-boss',
    title: 'The Quarterly Audit',
    subtitle: '@ L10 — twelfth-sibling prototype · the finale',
    archetype: 'Audit Boss',
    carc: 'RAC defense',
    level: 10,
    status: 'shipped',
    verbs: 'RECEIPT + AMEND',
    testing: 'The finale. Different shape from every prior encounter — this is a *defense* of work already done. The auditor walks in with three findings on Margaret Holloway\'s UB-04. For each, the player chooses RECEIPT (defend with chart evidence) or AMEND (concede + recoupment). Two of the findings are defensible; one is a real billing error best conceded fast. Total exposure is $11,970; a clean run lands at $340 recouped.',
    href: './audit-boss-prototype.html',
    district: 'appeals',
    accent: '#b18bd6',
  },
  {
    id: 'surprise-bill',
    title: 'Surprise Bill Specter',
    subtitle: '@ L8 — eleventh-sibling prototype',
    archetype: 'Specter',
    carc: 'NSA-protected',
    level: 8,
    status: 'shipped',
    verbs: 'CLASSIFY + CALCULATE + DISPUTE',
    testing: 'Patient-facing fight (companion to Lighthouse\'s patient-facing kindness). $4,200 OON balance bill from a contracted radiologist who read the patient\'s in-network ER scan; under the No Surprises Act that bill is prohibited. Three sequential gates: classify the scenario, calculate true patient cost-share, file the protective statement + initiate IDR. Each wrong pick names a real-world failure mode the law was passed to prevent.',
    href: './surprise-bill-prototype.html',
    district: 'billing',
    accent: '#ef5b7b',
  },
  {
    id: 'lighthouse',
    title: 'Charity Lighthouse',
    subtitle: '@ L8 — tenth-sibling prototype',
    archetype: 'Lighthouse',
    carc: 'patient-facing',
    level: 8,
    status: 'shipped',
    verbs: 'LISTEN + SCREEN + RELEASE',
    testing: 'First prototype that isn\'t a fight. Patient-facing, not payer-facing. A patient with a $87,420 bill she can\'t pay; verbs are LISTEN (pick the right follow-up question, not paternalism), SCREEN (FPL math + tier), RELEASE (file as charity care, not bad debt). Sits outside the four-district verb-space — the Lighthouse is restorative; it doesn\'t disappear when the encounter resolves.',
    href: './lighthouse-prototype.html',
    district: 'release-valve',
    accent: '#e8c074',
  },
  {
    id: 'doppelganger',
    title: 'Duplicate Claim Doppelgänger',
    subtitle: '@ L6 — ninth-sibling prototype',
    archetype: 'Doppelgänger',
    carc: 'CO-18',
    level: 6,
    status: 'shipped',
    verbs: 'REPLACE + CONFIRM',
    testing: 'New verb: REPLACE. A claim came back denied for a transposed subscriber ID; the biller fixed it and resubmitted as a fresh 837 instead of a frequency-7 replacement; now both claims are flagged duplicate. Resolution: set Box 22 to frequency 7 + reference the original ICN. First version-control encounter — the puzzle isn\'t what\'s on the claim, it\'s how the claim relates to other claims that already exist.',
    href: './doppelganger-prototype.html',
    district: 'billing',
    accent: '#ef5b7b',
  },
  {
    id: 'hydra',
    title: 'Coordination Hydra',
    subtitle: '@ L9 — sixth-sibling prototype',
    archetype: 'Hydra',
    carc: 'OA-23',
    level: 9,
    status: 'shipped',
    verbs: 'SEQUENCE + SUBMIT',
    testing: 'New verb: SEQUENCE. Three payers (BCBS Federal / Medicare / Medicaid), one claim. Fix the COB chain in the right order — primary, secondary, tertiary — then adjudicate each tier in turn with a running balance. First prototype with multiple sub-claims and per-tier 835 line items.',
    href: './hydra-prototype.html',
    district: 'billing',
    accent: '#ef5b7b',
  },
  {
    id: 'gatekeeper',
    title: 'Prior Auth Gatekeeper',
    subtitle: '@ L3 — fourth-sibling prototype',
    archetype: 'Gatekeeper',
    carc: 'CO-197',
    level: 3,
    status: 'shipped',
    verbs: 'REQUEST + AMEND',
    testing: 'New verb: REQUEST. File a retroactive 278; wait for the response; transcribe the auth number to Box 23. The citation builder is gone — replaced by a real 278 form (locked CPT + dx, picker for clinical rationale) and a response panel that animates back from the payer. Process, not argument.',
    href: './gatekeeper-prototype.html',
    district: 'eligibility',
    accent: '#7ee2c1',
  },
]

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHeader(): string {
  return `
    <header class="page-h">
      <div class="title-row">
        <h1>The Waiting Room · Prototype Catalog</h1>
        <a class="back-link" href="./">← back to game</a>
      </div>
      <p class="lede">
        Encounter-redesign prototypes. Each one is a single
        playable sketch testing what battles look like in this
        game without HP, without tools-as-damage, and without
        multiple choice. Share a framework
        (<em>Hospital intro → dreamlike fall → claim form +
        middle work + checklist</em>); differ in verb-space
        and rhythm.
      </p>
      <p class="meta">
        ${prototypes.filter(p => p.status === 'shipped').length} shipped ·
        ${prototypes.filter(p => p.status === 'planned').length} planned
      </p>
    </header>
  `
}

function renderDistrictKey(): string {
  const districts: Array<{ key: Prototype['district']; label: string; color: string; gloss: string }> = [
    { key: 'eligibility',   label: 'Eligibility',   color: '#7ee2c1', gloss: 'who is covered, by what, with what number' },
    { key: 'coding',        label: 'Coding',        color: '#f0a868', gloss: 'what was done, in what document, with what code' },
    { key: 'billing',       label: 'Billing',       color: '#ef5b7b', gloss: 'how it adjudicates and how it gets paid' },
    { key: 'appeals',       label: 'Appeals',       color: '#b18bd6', gloss: 'how denials get unwound' },
    { key: 'release-valve', label: 'Release valve', color: '#e8c074', gloss: 'patient-facing kindness — restorative, not combative' },
  ]
  return `
    <section class="district-key">
      <div class="dk-h">
        <span class="dk-tag">DISTRICT KEY</span>
        <span class="dk-sub">Four Waiting Room districts plus a special fifth category for restorative, non-combat encounters.</span>
      </div>
      <div class="dk-row">
        ${districts.map(d => {
          const count = prototypes.filter(p => p.district === d.key).length
          return `
            <div class="dk-item" style="--dk-color: ${d.color};">
              <span class="dk-swatch"></span>
              <div class="dk-text">
                <span class="dk-name">${escape(d.label.toUpperCase())}</span>
                <span class="dk-gloss">${escape(d.gloss)}</span>
                <span class="dk-count">${count} prototype${count === 1 ? '' : 's'}</span>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

function renderCard(p: Prototype): string {
  const isShipped = p.status === 'shipped'
  return `
    <article class="card ${isShipped ? 'shipped' : 'planned'}" style="--card-accent: ${p.accent};">
      <div class="card-accent"></div>
      <div class="card-body">
        <div class="card-district">${p.district === 'release-valve' ? 'RELEASE VALVE' : p.district.toUpperCase() + ' · DISTRICT'}</div>
        <div class="card-pills">
          <span class="pill carc">${escape(p.carc)}</span>
          <span class="pill level">L${p.level}</span>
          <span class="pill verbs">${escape(p.verbs)}</span>
          <span class="pill status ${p.status}">${p.status}</span>
        </div>
        <h2 class="card-title">${escape(p.title)}</h2>
        <p class="card-subtitle">${escape(p.subtitle)}</p>
        <p class="card-testing"><strong>Tests:</strong> ${escape(p.testing)}</p>
        ${p.href
          ? `<a class="card-cta" href="${p.href}">Open prototype →</a>`
          : '<span class="card-cta disabled">Not yet built</span>'}
      </div>
    </article>
  `
}

function renderFramework(): string {
  return `
    <section class="framework">
      <h2>The framework these prototypes share</h2>
      <ol>
        <li>
          <strong>Hospital intro.</strong> Warm, slow,
          human-scaled. A patient or doctor brings the player a
          stuck claim. Heavy emotional weight lives here.
        </li>
        <li>
          <strong>The dreamlike fall.</strong> The world ripples;
          the fluorescent flickers; the player is somewhere else.
          Not a button. Not a menu. The Waiting Room <em>takes</em>
          them.
        </li>
        <li>
          <strong>Claim form as playing field.</strong> The
          CMS-1500 sits at the top. Disputed boxes are flagged
          DISPUTED. Margin callouts point at fixable rows.
        </li>
        <li>
          <strong>Workbench: payer note + chart + reference doc.</strong>
          Three columns of pieces the player connects. Plain-
          English first; technical (chart language, policy
          quotes) below as a smaller reference.
        </li>
        <li>
          <strong>Citation builder.</strong> Three slots — payer
          asserts / chart cites / per policy. CITE when ready.
        </li>
        <li>
          <strong>Defense packet checklist.</strong> Issues to
          resolve. AMEND for fields you can fix; CITE for
          arguments you have to make.
        </li>
        <li>
          <strong>Submit.</strong> "Submit Defense Packet" or
          "Submit Corrected Claim" depending on what the
          encounter asks for.
        </li>
      </ol>
      <p class="framework-cta">
        Each prototype tunes <em>what's in</em> each part to the
        encounter. The shape stays the same; the rhythm doesn't.
        That's the framework working.
      </p>
    </section>
  `
}

function renderFooter(): string {
  return `
    <footer class="page-f">
      <p>
        Prototype source lives in
        <code>src/wraith-prototype/</code>,
        <code>src/bundle-prototype/</code>, etc.
        Design notes for each encounter live in
        <a href="https://github.com/chansooligans/the-waiting-room/tree/main/reference/puzzles">reference/puzzles/</a>;
        the curriculum spine is in
        <a href="https://github.com/chansooligans/the-waiting-room/tree/main/reference/curriculum">reference/curriculum/</a>.
      </p>
    </footer>
  `
}

function render(): string {
  return `
    ${renderHeader()}
    ${renderDistrictKey()}
    <section class="cards">
      ${prototypes.map(renderCard).join('')}
    </section>
    ${renderFramework()}
    ${renderFooter()}
  `
}

const css = `
  :root {
    --bg: #0a0d12; --panel: #161b24; --panel-2: #1d2330;
    --ink: #d8dee9; --ink-dim: #8a93a3;
    --accent: #7ee2c1; --accent-2: #f0a868;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    padding: 32px 20px 80px;
    max-width: 1180px; margin: 0 auto;
    position: relative;
  }
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(126, 226, 193, 0.04), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(177, 139, 214, 0.04), transparent 50%);
    z-index: 0;
  }
  #catalog-root { position: relative; z-index: 1; }

  a { color: var(--accent); }
  h1, h2, h3 { color: var(--ink); margin: 0 0 8px; }
  h1 { font-size: 28px; letter-spacing: -0.01em; }
  h2 { font-size: 20px; }
  code { background: #0a0d12; padding: 1px 6px; border-radius: 4px; font-size: 0.92em; }

  .page-h { margin-bottom: 28px; }
  .title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .lede { color: var(--ink-dim); margin: 6px 0 4px; max-width: 800px; }
  .meta { color: var(--ink-dim); font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; }
  .back-link { font-size: 13px; }

  .district-key {
    background: var(--panel);
    border: 1px solid #232a36;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 22px;
  }
  .dk-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .dk-tag {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--ink-dim);
  }
  .dk-sub { font-size: 12.5px; color: var(--ink-dim); font-style: italic; line-height: 1.5; }
  .dk-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
  @media (max-width: 880px) { .dk-row { grid-template-columns: repeat(2, 1fr); } }
  .dk-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px;
    background: var(--panel-2);
    border-left: 3px solid var(--dk-color);
    border-radius: 4px;
  }
  .dk-swatch {
    width: 12px; height: 12px;
    background: var(--dk-color);
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 3px;
  }
  .dk-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .dk-name {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--dk-color);
  }
  .dk-gloss { font-size: 12px; color: var(--ink); line-height: 1.4; }
  .dk-count { font-size: 10.5px; color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
    margin-bottom: 48px;
  }
  .card {
    display: flex;
    background: var(--panel);
    border: 1px solid #232a36;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
  }
  .card.shipped:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
  .card.planned { opacity: 0.6; }
  .card-accent {
    width: 6px;
    flex-shrink: 0;
    background: var(--card-accent);
  }
  .card-body { padding: 16px 18px; flex: 1; }
  .card-district {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--card-accent);
    margin-bottom: 6px;
  }
  .card-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .pill {
    font-size: 10.5px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--panel-2);
    border: 1px solid #2a3142;
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .pill.carc { color: #f3a4b6; border-color: #4a2a32; }
  .pill.level { color: var(--accent); border-color: #2c5547; }
  .pill.verbs { color: #a3c5ff; border-color: #2c3a55; font-family: ui-monospace, monospace; text-transform: none; letter-spacing: normal; font-size: 10px; }
  .pill.status.shipped { color: var(--accent); border-color: #2c5547; }
  .pill.status.planned { color: var(--ink-dim); }
  .card-title { font-size: 18px; margin-bottom: 4px; }
  .card-subtitle { color: var(--ink-dim); font-size: 12.5px; margin: 0 0 10px; font-style: italic; }
  .card-testing {
    color: var(--ink);
    font-size: 13px;
    line-height: 1.55;
    margin: 10px 0 12px;
  }
  .card-cta {
    display: inline-block;
    padding: 6px 14px;
    background: var(--accent);
    color: #0a0d12;
    border-radius: 4px;
    text-decoration: none;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    transition: background 0.15s;
  }
  .card-cta:hover { background: #a8efd4; }
  .card-cta.disabled {
    background: var(--panel-2);
    color: var(--ink-dim);
    cursor: not-allowed;
    border: 1px dashed #2a3142;
  }

  .framework {
    background: var(--panel);
    border: 1px solid #232a36;
    border-radius: 10px;
    padding: 24px 28px;
    margin-bottom: 36px;
  }
  .framework h2 { margin-bottom: 14px; }
  .framework ol { padding-left: 24px; }
  .framework li {
    font-size: 13.5px;
    line-height: 1.6;
    margin: 8px 0;
  }
  .framework strong { color: var(--accent); }
  .framework-cta {
    margin-top: 16px;
    padding: 12px 14px;
    background: rgba(126, 226, 193, 0.06);
    border-left: 3px solid var(--accent);
    font-size: 13px;
    color: var(--ink);
    border-radius: 3px;
  }

  .page-f { color: var(--ink-dim); font-size: 12.5px; margin-top: 60px; }
  .page-f p { margin: 0; }
`

function mount() {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  const root = document.getElementById('catalog-root')
  if (root) root.innerHTML = render()
}

mount()
