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
  /** Hero color (CSS var or hex). */
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
    accent: '#7ee2c1',
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
    accent: '#b18bd6',
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
    accent: '#9fcfb5',
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
    accent: '#ef9bb0',
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
    accent: '#a3c5ff',
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
        workbench + citation builder</em>); differ in verb-space
        and rhythm.
      </p>
      <p class="meta">
        ${prototypes.filter(p => p.status === 'shipped').length} shipped ·
        ${prototypes.filter(p => p.status === 'planned').length} planned
      </p>
    </header>
  `
}

function renderCard(p: Prototype): string {
  const isShipped = p.status === 'shipped'
  return `
    <article class="card ${isShipped ? 'shipped' : 'planned'}">
      <div class="card-accent" style="background: ${p.accent};"></div>
      <div class="card-body">
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
  }
  .card-body { padding: 16px 18px; flex: 1; }
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
