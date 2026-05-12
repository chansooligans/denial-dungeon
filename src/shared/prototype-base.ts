// Shared design tokens + base CSS + helpers for the encounter
// prototypes. Each prototype's main.ts builds its final stylesheet
// as `districtVars(district) + BASE_CSS + customCss`, so the only
// per-prototype CSS that ships is the prototype-specific UI
// (workbench, builder, clock, queue, ERA panel, etc.).
//
// District colors are the canonical four from
// `src/scenes/WaitingRoomScene.ts`. Each prototype is pinned to
// one district; see /prototypes.html for the catalog.

// BASE_CSS lives in a sibling .css file for proper syntax
// highlighting + diffability. Vite's `?raw` import returns its
// contents as a string so we can keep the same template-string
// injection pattern (prototypes do `<style>${BASE_CSS}…</style>`).
import baseCssRaw from './prototype-base.css?raw'

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
 * Embedded-mode helpers — let the standalone prototype pages double
 * as in-game encounters when mounted in an iframe by
 * PrototypeIframeScene.
 *
 * The runtime game loads each catalog prototype via
 * `<iframe src="/<case>-prototype.html?embedded=1">`. The prototype
 * detects the flag, hides its dev chrome (back-link, design notes),
 * and on case-victory posts a `case-completed` message back up to
 * the parent window so the scene can mark the encounter defeated
 * and transition out.
 */
export function isEmbedded(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('embedded') === '1'
  } catch {
    return false
  }
}

// Tag the document body with .embedded at module load so the chrome-
// suppression CSS rules in BASE_CSS take effect without each
// prototype having to wire it manually. Runs once, idempotent.
if (typeof document !== 'undefined' && isEmbedded()) {
  if (document.body) {
    document.body.classList.add('embedded')
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('embedded')
    }, { once: true })
  }
}

/** Post a `case-completed` message to the parent window. No-op
 *  unless the prototype is running inside an iframe in embedded mode.
 *  Call this in the prototype at the same site where
 *  `state.packetSubmitted = true` flips (i.e. the moment the player
 *  wins). */
export function notifyParentVictory(caseId: string): void {
  if (!isEmbedded()) return
  try {
    window.parent.postMessage({ type: 'case-completed', caseId }, '*')
  } catch {
    // postMessage shouldn't throw, but if it does we don't want to
    // break the prototype's own victory flow.
  }
}

/**
 * Per-Case post-victory recap. Each Case authors its own recap data
 * (key concepts the player learned + external links to the
 * authoritative sources for further reading) and calls
 * `renderRecap(recap)` from inside its `renderVictory` function.
 *
 * The recap is appended to the victory section so the player gets
 * the win moment first, then the post-mortem. Keep `keyConcepts` to
 * 3-5 bullet points and `resources` to 3-5 links — anything more
 * starts to feel like homework.
 *
 * Resource links should point to authoritative sources: CFR/USC
 * regulations, CMS / HHS / HRSA guidance, MLN articles, AMA / AHA
 * professional pages. Avoid blogs, vendor marketing, and stale
 * white papers — players are busy and we owe them the canonical
 * source.
 */
export interface CaseRecap {
  /** One-sentence framing of what the player just did, in their voice. */
  oneLineRecap: string
  /** 3-5 concept summaries — the doctrine takeaways. */
  keyConcepts: { term: string; gist: string }[]
  /**
   * Authored external resources. Retained in the data files for
   * reference / future reuse, but no longer rendered in the recap
   * page — players were better served by an "ask an AI assistant"
   * prompt that pulls the recap context with them than by a static
   * list of URLs that age and rot. Optional going forward.
   */
  resources?: { title: string; url: string; note: string }[]
}

/**
 * Build a prompt that takes the player's recap context to an AI
 * assistant. We don't link to a fixed URL list anymore — the
 * landscape moves, and a one-shot list of CMS / HHS pages doesn't
 * actually answer "but what does this mean for my situation?"
 *
 * The prompt embeds: the one-line recap, the key concepts (term +
 * gist), and a request for examples + authoritative source pointers.
 * URL-encoded into the assistant's `?q=` query parameter.
 */
function buildAiPromptUrl(provider: 'claude' | 'chatgpt', recap: CaseRecap): string {
  const lines: string[] = []
  lines.push("I just played through a case in an educational game about the US healthcare revenue cycle.")
  lines.push("")
  lines.push(`The case in one line: ${recap.oneLineRecap}`)
  lines.push("")
  lines.push("Concepts I want to go deeper on:")
  for (const c of recap.keyConcepts) {
    lines.push(`- ${c.term}: ${c.gist}`)
  }
  lines.push("")
  lines.push(
    "Can you explain each concept in more depth — real-world examples, common pitfalls, " +
    "and pointers to authoritative sources (CFR / USC / CMS / HHS / payer policy)?"
  )
  const prompt = lines.join("\n")
  const base = provider === 'claude'
    ? 'https://claude.ai/new?q='
    : 'https://chatgpt.com/?q='
  return base + encodeURIComponent(prompt)
}

export function renderCaseRecap(recap: CaseRecap): string {
  const claudeUrl = buildAiPromptUrl('claude', recap)
  const chatgptUrl = buildAiPromptUrl('chatgpt', recap)
  return `
    <section class="recap-page">
      <div class="recap-h">
        <span class="recap-tag">RECAP · WHAT YOU LEARNED</span>
      </div>
      <p class="recap-lede">${escape(recap.oneLineRecap)}</p>

      <div class="recap-grid">
        <div class="recap-block">
          <h3>Key concepts</h3>
          <ul class="recap-concepts">
            ${recap.keyConcepts.map(c => `
              <li><strong>${escape(c.term)}.</strong> ${escape(c.gist)}</li>
            `).join('')}
          </ul>
        </div>

        <div class="recap-block">
          <h3>Go deeper</h3>
          <p class="recap-go-deeper-blurb">
            Open this recap in an AI assistant — it'll arrive with the case
            context attached and can give you examples, pitfalls, and
            source pointers tuned to whatever you want to ask next.
          </p>
          <div class="recap-go-deeper-actions">
            <a href="${claudeUrl}" target="_blank" rel="noopener noreferrer"
               class="recap-ai-btn recap-ai-claude">Ask Claude ↗</a>
            <a href="${chatgptUrl}" target="_blank" rel="noopener noreferrer"
               class="recap-ai-btn recap-ai-chatgpt">Ask ChatGPT ↗</a>
          </div>
        </div>
      </div>
    </section>
  `
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
export const BASE_CSS = baseCssRaw
