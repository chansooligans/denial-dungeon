// Shared design tokens + base CSS + helpers for the encounter
// prototypes. Each prototype's main.ts builds its final stylesheet
// as `districtVars(district) + BASE_CSS + customCss`, so the only
// per-prototype CSS that ships is the prototype-specific UI
// (workbench, builder, clock, queue, ERA panel, etc.).
//
// District colors are the canonical four from
// `src/scenes/WaitingRoomScene.ts`. Each prototype is pinned to
// one district; see /prototypes.html for the catalog.

export type District = 'eligibility' | 'coding' | 'billing' | 'appeals'

export const DISTRICT_COLORS: Record<District, { accent: string; accentHover: string }> = {
  eligibility: { accent: '#7ee2c1', accentHover: '#a8efd4' },
  coding:      { accent: '#f0a868', accentHover: '#f5c190' },
  billing:     { accent: '#ef5b7b', accentHover: '#f57a92' },
  appeals:     { accent: '#b18bd6', accentHover: '#d2b3eb' },
}

/**
 * Per-prototype :root override that sets the district accent +
 * its hover shade. Injected before BASE_CSS so the cascade
 * resolves correctly.
 */
export function districtVars(district: District): string {
  const { accent, accentHover } = DISTRICT_COLORS[district]
  return `
    :root {
      --accent: ${accent};
      --accent-hover: ${accentHover};
    }
  `
}

/** HTML-escape user-facing text for safe insertion into innerHTML. */
export function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Universal CSS shared by every encounter prototype: the page
 * chrome, two-register flip (hospital warm / waiting-room
 * lavender), Dana briefing + popover, term glossary popover,
 * paper-style claim form, amend modal pattern, button family,
 * feedback / recap / checklist, and the design-notes + victory
 * regions at the bottom.
 *
 * Per-prototype CSS (workbench layouts, queue tables, clocks,
 * fog overlays, etc.) is appended *after* this string so it
 * can override anything here cleanly.
 *
 * Color tokens follow the game's design system:
 *   --bg / --panel / --panel-2 — background tiers
 *   --ink / --ink-dim          — body text
 *   --accent / --accent-hover  — district color (set per-prototype)
 *   --accent-2                 — Dana / hospital warmth (always #f0a868)
 *   --bad / --good             — error / success (universal)
 *   --paper                    — claim form paper background
 */
export const BASE_CSS = `
  :root {
    --bg: #0a0d12;
    --panel: #161b24;
    --panel-2: #1d2330;
    --ink: #d8dee9;
    --ink-dim: #8a93a3;
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
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(126, 226, 193, 0.04), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(177, 139, 214, 0.04), transparent 50%);
    z-index: 0;
    animation: flicker 7s infinite;
  }
  @keyframes flicker {
    0%, 95%, 100% { opacity: 1; }
    96% { opacity: 0.85; } 97% { opacity: 1; }
    98% { opacity: 0.7;  } 99% { opacity: 1; }
  }
  #prototype-root { position: relative; z-index: 1; }
  a { color: var(--accent); }
  h1, h2, h3 { color: var(--ink); margin: 0 0 8px; }
  h1 { font-size: 24px; letter-spacing: -0.01em; }
  h2 { font-size: 18px; }
  h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); }
  code { background: #0a0d12; padding: 1px 6px; border-radius: 4px; font-size: 0.92em; }
  ul, ol { margin: 0; padding-left: 22px; }
  em { font-style: italic; }

  /* Page header */
  .page-h { margin-bottom: 22px; }
  .title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .header-actions { display: flex; align-items: baseline; gap: 14px; }
  .lede { color: var(--ink-dim); margin: 6px 0 0; max-width: 800px; }
  .muted { color: var(--ink-dim); font-weight: 400; font-size: 16px; }
  .back-link { font-size: 13px; }
  .recall-btn {
    font: inherit; font-size: 12px;
    background: rgba(240, 168, 104, 0.1); color: var(--accent-2);
    border: 1px solid #4a3a2a; padding: 5px 12px; border-radius: 14px;
    cursor: pointer; letter-spacing: 0.02em;
  }
  .recall-btn:hover { background: rgba(240, 168, 104, 0.2); border-color: var(--accent-2); }

  /* Two-register flip — hospital warm orange / waiting-room lavender. */
  .hospital-intro { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 18px 22px; margin-bottom: 22px; }
  .hospital-intro p { margin: 8px 0; }
  .register { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; padding: 2px 10px; border-radius: 3px; display: inline-block; }
  .register.hospital { background: rgba(240, 168, 104, 0.12); color: var(--accent-2); border: 1px solid #4a3a2a; }
  .register.waiting-room { background: rgba(177, 139, 214, 0.12); color: #c8b6e0; border: 1px solid #3a324a; }
  .register-flip {
    margin: 16px 0; padding: 12px 16px;
    border-left: 3px solid #c8b6e0; background: rgba(177, 139, 214, 0.05);
    font-size: 13.5px; overflow: hidden;
  }
  .ripple { width: 100%; height: 2px; margin-bottom: 8px; background: linear-gradient(90deg, transparent, #c8b6e0, transparent); animation: ripple 4s infinite ease-in-out; }
  @keyframes ripple {
    0%, 100% { transform: translateX(-100%); opacity: 0; }
    50% { transform: translateX(0); opacity: 0.6; }
  }

  /* Dana's briefing — inline pre-dismiss, popover after. */
  .briefing {
    background: linear-gradient(180deg, rgba(240, 168, 104, 0.06), transparent);
    border: 1px solid #4a3a2a; border-left-width: 4px;
    border-radius: 8px; padding: 20px 24px; margin-bottom: 22px;
  }
  .briefing-h { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
  .briefing-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-2); }
  .briefing-sub { font-size: 12px; color: var(--ink-dim); font-style: italic; }
  .briefing-body p { margin: 10px 0; }
  .briefing-body ul { margin: 10px 0; padding-left: 22px; }
  .briefing-body li { margin: 6px 0; }
  .briefing-sign { color: var(--ink-dim); font-style: italic; margin-top: 14px; }

  .briefing-popover-backdrop {
    position: fixed; inset: 0; background: rgba(10, 13, 18, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 20px; overflow-y: auto;
  }
  .briefing-popover {
    background: var(--panel);
    border: 1px solid #4a3a2a; border-left-width: 4px;
    border-radius: 8px; padding: 24px 28px 20px; max-width: 640px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    background-image: linear-gradient(180deg, rgba(240, 168, 104, 0.06), transparent);
    margin: auto; position: relative;
  }
  .briefing-popover-close {
    position: absolute; top: 8px; right: 12px;
    background: transparent; border: none; color: var(--ink-dim);
    font-size: 28px; cursor: pointer; line-height: 1; padding: 4px 10px;
  }
  .briefing-popover-close:hover { color: var(--ink); }
  .briefing-popover .btn.ghost { margin-top: 14px; }

  /* Term glossary — underlined dotted, popover on click. */
  .term {
    color: var(--accent);
    text-decoration: underline dotted;
    text-underline-offset: 2px;
    cursor: help; position: relative;
  }
  .term:hover { color: var(--accent-hover); }
  .term-icon {
    display: inline-block; vertical-align: super;
    font-size: 9px; margin-left: 2px;
    background: var(--accent); color: #0a0d12;
    width: 12px; height: 12px; border-radius: 50%;
    text-align: center; line-height: 12px; font-weight: 700;
  }
  .term-popover-backdrop {
    position: fixed; inset: 0; background: rgba(10, 13, 18, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 20px;
  }
  .term-popover {
    background: var(--panel); border: 1px solid var(--accent);
    border-radius: 8px; padding: 20px 24px; max-width: 520px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
  .term-popover-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .term-popover-name { font-weight: 700; color: var(--accent); }
  .term-popover-close {
    background: transparent; border: none; color: var(--ink-dim);
    font-size: 24px; cursor: pointer; line-height: 1; padding: 0 8px;
  }
  .term-popover-close:hover { color: var(--ink); }
  .term-popover p { margin: 0; line-height: 1.6; }

  /* Paper-style claim form (CMS-1500). */
  .claim {
    background: var(--paper); color: #1c1c1c;
    border-radius: 6px; padding: 14px 18px; margin-bottom: 22px;
    box-shadow: inset 0 0 0 1px #d6cfb8; font-size: 12.5px;
  }
  .claim-h {
    font-weight: 700; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: #5a4d2b; padding-bottom: 6px; border-bottom: 1px solid #c8bf9d; margin-bottom: 8px;
    display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  }
  .claim-h .term { color: #5a4d2b; }
  .claim-h .term-icon { background: #5a4d2b; color: var(--paper); }
  .claim-explainer {
    font-weight: 400; font-size: 10.5px; text-transform: none; letter-spacing: normal;
    color: #7a6b4d; font-style: italic;
  }
  .claim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; margin: 6px 0; }
  .claim-section { margin-top: 10px; }
  .claim-section-h { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a4d2b; margin-bottom: 4px; }
  .claim ul.dx { padding-left: 18px; margin: 4px 0; list-style: none; }
  .claim ul.dx li { margin: 2px 0; }
  .claim ul.dx .term { color: #1c1c1c; }
  .claim ul.dx .term-icon { background: #5a4d2b; color: var(--paper); }
  .claim table.lines { width: 100%; border-collapse: collapse; }
  .claim table.lines th, .claim table.lines td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #d6cfb8; vertical-align: middle; }
  .claim table.lines .term { color: #1c1c1c; }
  .claim table.lines .term-icon { background: #5a4d2b; color: var(--paper); }
  .claim .hi { background: var(--hi); box-shadow: inset 0 0 0 1px var(--hi-border); border-radius: 3px; }
  .claim .amended {
    background: rgba(126, 226, 193, 0.15);
    box-shadow: inset 0 0 0 1px var(--good);
    border-radius: 3px;
  }

  .claim-status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 8px; border-radius: 3px; margin-left: 10px; }
  .claim-status.disputed { background: rgba(239, 91, 123, 0.15); color: var(--bad); border: 1px solid var(--bad); }
  .claim-status.amended  { background: rgba(126, 226, 193, 0.15); color: var(--good); border: 1px solid var(--good); }

  .mod-missing { color: var(--bad); font-style: italic; font-weight: 600; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .mod-applied { color: #1a6e52; font-weight: 700; background: rgba(126, 226, 193, 0.3); padding: 2px 8px; border-radius: 3px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .dx-arrow { color: var(--bad); font-weight: 700; margin-left: 6px; font-size: 14px; opacity: 0.7; }

  /* Claim with margin-note annotations (right-side callout). */
  .claim-with-annotations { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 22px; }
  .claim-with-annotations .claim { flex: 1; margin-bottom: 0; min-width: 0; }
  .claim-annotations { width: 220px; flex-shrink: 0; padding-top: 100px; display: flex; flex-direction: column; gap: 10px; }
  @media (max-width: 880px) {
    .claim-with-annotations { flex-direction: column; gap: 12px; }
    .claim-annotations { width: 100%; padding-top: 0; }
  }

  /* Margin amend callout — pulses to draw attention. */
  .amend-callout {
    display: flex; align-items: flex-start; gap: 10px; width: 100%;
    padding: 12px 14px; font: inherit; text-align: left;
    background: linear-gradient(180deg, rgba(239, 91, 123, 0.12), rgba(239, 91, 123, 0.04));
    border: 2px solid var(--bad); border-radius: 8px; cursor: pointer; color: var(--ink);
    box-shadow: 0 0 0 0 rgba(239, 91, 123, 0.18);
    animation: amend-pulse 4.5s ease-in-out infinite;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .amend-callout:hover:not(:disabled) {
    transform: translateX(-3px);
    box-shadow: 0 4px 16px rgba(239, 91, 123, 0.35);
    animation: none;
  }
  @keyframes amend-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 91, 123, 0.18); }
    50% { box-shadow: 0 0 0 6px rgba(239, 91, 123, 0); }
  }
  .amend-callout-arrow { font-size: 22px; color: var(--bad); font-weight: 700; line-height: 1; flex-shrink: 0; margin-top: 2px; }
  .amend-callout-body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .amend-callout-main { font-size: 13px; font-weight: 700; color: var(--bad); letter-spacing: 0.02em; }
  .amend-callout-sub  { font-size: 11.5px; color: var(--ink-dim); font-style: italic; line-height: 1.4; }

  /* Amend modal — picker for "fix one field" actions. */
  .amend-modal-backdrop {
    position: fixed; inset: 0; background: rgba(10, 13, 18, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 20px; overflow-y: auto;
  }
  .amend-modal {
    background: var(--panel);
    border: 1px solid var(--accent); border-left-width: 4px;
    border-radius: 8px; padding: 24px 28px 20px; max-width: 640px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    position: relative; margin: auto;
  }
  .amend-modal-close {
    position: absolute; top: 8px; right: 12px;
    background: transparent; border: none; color: var(--ink-dim);
    font-size: 28px; cursor: pointer; line-height: 1; padding: 4px 10px;
  }
  .amend-modal-close:hover { color: var(--ink); }
  .amend-modal-h { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .amend-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
  .amend-sub { font-size: 13px; color: var(--ink-dim); }
  .amend-context {
    background: var(--panel-2); padding: 10px 14px; border-radius: 5px;
    font-size: 13px; margin-bottom: 14px; border-left: 3px solid var(--accent); line-height: 1.55;
  }
  .amend-context strong { color: var(--accent); }
  .amend-options { list-style: none; padding-left: 0; margin: 0; }
  .amend-option {
    padding: 12px 14px; margin: 6px 0; background: var(--panel-2);
    border-radius: 5px; border-left: 3px solid transparent;
    cursor: pointer; transition: all 0.15s;
  }
  .amend-option:hover:not(.current) { background: #232b3a; border-left-color: var(--accent); }
  .amend-option.current { opacity: 0.55; cursor: not-allowed; }
  .amend-option.rejected { border-left-color: var(--bad); background: rgba(239, 91, 123, 0.08); }
  .amend-option-h { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .amend-option code { font-weight: 700; color: var(--ink); }
  .amend-option-label { color: var(--ink); flex: 1; }
  .amend-option-badge { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 3px; }
  .amend-option-badge.current { background: rgba(239, 91, 123, 0.12); color: var(--bad); border: 1px solid #4a2a32; }
  .amend-option-fb {
    margin-top: 8px; padding-top: 8px;
    border-top: 1px dashed rgba(239, 91, 123, 0.3);
    font-size: 12px; color: #f3a4b6; line-height: 1.45;
  }
  .amend-hint-text { font-size: 12px; color: var(--ink-dim); margin-top: 14px; font-style: italic; }

  /* Buttons */
  .btn {
    font: inherit; padding: 8px 18px; border-radius: 4px;
    cursor: pointer; border: 1px solid transparent;
    font-size: 13px; letter-spacing: 0.04em;
  }
  .btn.primary { background: var(--accent); color: #0a0d12; font-weight: 600; }
  .btn.primary:hover:not(.disabled):not(:disabled) { background: var(--accent-hover); }
  .btn.ghost { background: transparent; color: var(--ink-dim); border-color: #2a3142; }
  .btn.ghost:hover:not(.disabled):not(:disabled) { color: var(--ink); border-color: var(--ink-dim); }
  .btn.submit { background: var(--accent-2); color: #0a0d12; font-weight: 700; padding: 12px 24px; margin-top: 14px; }
  .btn.submit:hover:not(.disabled):not(:disabled) { background: #f7c08a; }
  .btn.disabled, .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Feedback / recap */
  .feedback {
    margin-top: 10px; padding: 10px 14px; border-radius: 4px;
    font-size: 13px; white-space: pre-line; line-height: 1.55;
  }
  .fb-good    { background: rgba(126, 226, 193, 0.10); border-left: 3px solid var(--good); color: var(--good); }
  .fb-bad     { background: rgba(239, 91, 123, 0.08); border-left: 3px solid var(--bad);  color: #f3a4b6; }
  .fb-neutral { background: var(--panel-2);            border-left: 3px solid var(--ink-dim); color: var(--ink); }

  .recap {
    margin-top: 12px; padding: 12px 14px;
    background: rgba(240, 168, 104, 0.06);
    border: 1px solid #4a3a2a; border-radius: 5px;
  }
  .recap-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-2); margin-bottom: 4px; font-weight: 600; }
  .recap p { margin: 0; font-size: 13.5px; line-height: 1.5; }

  /* Issue checklist + submit button. */
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
  .fail-counter { margin-top: 10px; font-size: 12px; color: var(--ink-dim); font-style: italic; }

  /* Design notes (bottom of every prototype). */
  .design-notes { margin-top: 60px; padding: 24px; background: var(--panel); border: 1px solid #232a36; border-radius: 8px; }
  .notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }
  @media (max-width: 880px) { .notes-grid { grid-template-columns: 1fr; } }
  .notes-grid h3 { margin-bottom: 8px; }
  .notes-grid ul { padding-left: 18px; }
  .notes-grid li { font-size: 13px; margin: 6px 0; }
  .notes-cta { margin-top: 18px; font-size: 13px; color: var(--ink-dim); }

  /* Victory screen. */
  .victory { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 32px 28px; margin: 22px 0 60px; text-align: center; }
  .victory h2 { font-size: 26px; margin-bottom: 16px; }
  .victory p { max-width: 560px; margin: 12px auto; }
  .victory .register { margin-top: 20px; }
  .victory .btn.primary { margin-top: 24px; }
  .victory .back-link.inline { display: block; margin-top: 16px; font-size: 12px; }
`
