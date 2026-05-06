// PuzzleBattleScene — runtime port of the prototype-shape battles.
//
// Architecture: a Phaser scene that mounts an absolute-positioned
// HTML overlay div (sibling to the Phaser canvas, inside the #game
// container). The overlay's content is rendered from a PuzzleSpec
// + PuzzleState via `runtime/puzzle/render.ts`; clicks on the
// overlay are caught by a single delegate that updates state and
// re-renders. On submit, the scene marks the obstacle defeated,
// runs `checkLevelProgression`, and starts the caller scene
// (typically WaitingRoom).
//
// Encounters opt in by setting `puzzleSpecId` on their entry in
// `src/content/enemies.ts`. Encounters without a spec keep going
// through the legacy HP-based BattleScene.

import Phaser from 'phaser'
import { ENCOUNTERS } from '../content/enemies'
import {
  getState,
  saveGame,
  unlockCodex,
  unlockTool,
  updateResources,
  checkLevelProgression,
} from '../state'
import { BASE_CSS, districtVars } from '../shared/prototype-base'
import { getPuzzleSpec } from '../runtime/puzzle/specs'
import {
  makeInitialState,
  render,
  type PuzzleState,
} from '../runtime/puzzle/render'
import type { PuzzleSpec, PuzzleAmendOption } from '../runtime/puzzle/types'

const OVERLAY_ID = '__puzzle_overlay__'
const STYLE_ID = '__puzzle_style__'

interface InitData {
  encounterId?: string
  returnScene?: string
}

export class PuzzleBattleScene extends Phaser.Scene {
  private encounterId!: string
  private returnScene!: string
  private spec!: PuzzleSpec
  private puzzleState!: PuzzleState
  private overlay!: HTMLDivElement
  private styleTag!: HTMLStyleElement
  private clickHandler!: (e: MouseEvent) => void

  constructor() {
    super('PuzzleBattle')
  }

  init(data: InitData) {
    this.encounterId = data.encounterId ?? 'co_97'
    this.returnScene = data.returnScene ?? 'WaitingRoom'

    const enc = ENCOUNTERS[this.encounterId]
    if (!enc) throw new Error(`Unknown encounter: ${this.encounterId}`)
    if (!enc.puzzleSpecId) throw new Error(`Encounter ${this.encounterId} has no puzzleSpecId`)
    const spec = getPuzzleSpec(enc.puzzleSpecId)
    if (!spec) throw new Error(`Unknown puzzle spec: ${enc.puzzleSpecId}`)
    this.spec = spec
    this.puzzleState = makeInitialState(spec)
  }

  create() {
    // Black backdrop on the Phaser side — the canvas sits underneath the
    // HTML overlay and shouldn't show through. Keeping a Phaser scene
    // active (vs. fully relying on DOM) so we can use Phaser's input
    // suppression for the touch overlay + scene lifecycle hooks.
    this.cameras.main.setBackgroundColor(0x05070a)
    this.cameras.main.fadeIn(450, 0, 0, 0)

    this.installStyles()
    this.installOverlay()
    this.attachClickHandler()
    this.rerender()

    // Codex auto-unlock on sight (matches BattleScene behavior so the
    // codex still fills as the player encounters obstacles).
    const gs = getState()
    const enc = ENCOUNTERS[this.encounterId]
    if (!gs.obstaclesSeen.includes(enc.id)) {
      gs.obstaclesSeen.push(enc.id)
      unlockCodex(enc.codexOnSight ?? enc.id)
      saveGame()
    }

    // Cleanup on scene shutdown — the overlay is a global DOM node, so
    // it has to be removed explicitly when the scene leaves.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown())
  }

  private installStyles() {
    // Reuse BASE_CSS verbatim from prototype-base. Append district
    // accent vars at the top so var(--accent) resolves correctly.
    let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = STYLE_ID
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = districtVars(this.spec.district) + BASE_CSS + EXTRA_CSS
    this.styleTag = styleTag
  }

  private installOverlay() {
    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = OVERLAY_ID
      overlay.style.position = 'fixed'
      overlay.style.inset = '0'
      overlay.style.overflow = 'auto'
      overlay.style.zIndex = '500'
      // Match the prototype-base body padding so the layout reads the
      // same as the standalone HTML pages.
      overlay.style.padding = '28px 20px 80px'
      overlay.style.background = 'var(--bg)'
      overlay.style.color = 'var(--ink)'
      // Body-level reset things (font + box-sizing) come from BASE_CSS
      // through the descendant selectors; they're applied via the * +
      // body rules.
      overlay.style.font = '14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif'
      // Center column with max-width so it reads like the prototype.
      overlay.style.boxSizing = 'border-box'
      const game = document.getElementById('game')
      ;(game ?? document.body).appendChild(overlay)
    }
    this.overlay = overlay

    // Inner scroll-container so the max-width column is centered.
    overlay.innerHTML = '<div id="__puzzle_root__" style="max-width:1180px;margin:0 auto;"></div>'

    // DEV-only one-click solver, floating in the corner. Tree-shakes
    // out of prod via import.meta.env.DEV.
    if (import.meta.env.DEV) {
      const solveBtn = document.createElement('button')
      solveBtn.dataset.action = 'dev-solve'
      solveBtn.textContent = '🐛 SOLVE'
      solveBtn.title = 'DEV: auto-resolve every issue'
      solveBtn.style.cssText = `
        position: fixed;
        bottom: 12px;
        right: 12px;
        z-index: 600;
        background: rgba(14, 20, 32, 0.92);
        color: #f0a868;
        border: 1px solid #4a3a2a;
        border-radius: 999px;
        padding: 6px 12px;
        font: 700 11px/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        letter-spacing: 0.1em;
        cursor: pointer;
        opacity: 0.6;
      `
      solveBtn.addEventListener('mouseenter', () => (solveBtn.style.opacity = '1'))
      solveBtn.addEventListener('mouseleave', () => (solveBtn.style.opacity = '0.6'))
      overlay.appendChild(solveBtn)
    }
  }

  private attachClickHandler() {
    this.clickHandler = (e: MouseEvent) => this.handleClick(e)
    this.overlay.addEventListener('click', this.clickHandler)
  }

  private rerender() {
    const root = document.getElementById('__puzzle_root__')
    if (!root) return
    root.innerHTML = render(this.spec, this.puzzleState)
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    // Backdrop click closes amend modal (the inner modal stops propagation
    // by virtue of having data-action="amend-modal-stop", which falls into
    // the default branch and does nothing).
    if (target.classList.contains('amend-modal-backdrop')) {
      this.puzzleState.amendOpen = null
      this.puzzleState.amendFeedback = null
      this.rerender()
      return
    }
    const el = target.closest('[data-action]') as HTMLElement | null
    if (!el) return
    const action = el.dataset.action ?? ''
    const id = el.dataset.id ?? ''
    const slot = el.dataset.slot ?? ''
    switch (action) {
      case 'dismiss-briefing':
        this.puzzleState.briefingDone = true
        break
      case 'select-payer':
        this.puzzleState.selectedPayerId = id || null
        this.puzzleState.feedback = ''
        break
      case 'select-chart':
        this.puzzleState.selectedChartId = id || null
        this.puzzleState.feedback = ''
        break
      case 'select-policy':
        this.puzzleState.selectedPolicyId = id || null
        this.puzzleState.feedback = ''
        break
      case 'cite':
        this.attemptCite()
        break
      case 'clear':
        this.puzzleState.selectedPayerId = null
        this.puzzleState.selectedChartId = null
        this.puzzleState.selectedPolicyId = null
        this.puzzleState.feedback = ''
        this.puzzleState.lastRecap = ''
        break
      case 'open-amend':
        this.puzzleState.amendOpen = slot || null
        this.puzzleState.amendFeedback = null
        break
      case 'close-amend':
      case 'close-amend-backdrop':
        this.puzzleState.amendOpen = null
        this.puzzleState.amendFeedback = null
        break
      case 'amend-modal-stop':
        return // swallow click; don't re-render
      case 'pick-amend':
        this.attemptAmend(id)
        break
      case 'submit':
        this.submitPacket()
        return // submit triggers scene transition; no rerender needed
      case 'finish':
        this.finishToWaitingRoom(true)
        return
      case 'flee':
        this.finishToWaitingRoom(false)
        return
      case 'dev-solve':
        this.devSolveAll()
        break
      default:
        return
    }
    this.rerender()
  }

  private attemptCite() {
    const s = this.puzzleState
    const spec = this.spec
    if (!s.selectedPayerId || !s.selectedChartId || !s.selectedPolicyId) return

    const payer = spec.payerPhrases.find(p => p.id === s.selectedPayerId)!
    const chart = spec.chartFacts.find(f => f.id === s.selectedChartId)!
    const policy = spec.policyClauses.find(c => c.id === s.selectedPolicyId)!

    if (chart.issueId === null) {
      s.failedAttempts += 1
      this.setFeedback(
        `That fact doesn't follow. ${chart.distractorReason ?? ''} Try another.`,
        'bad'
      )
      s.lastRecap = ''
      return
    }
    if (policy.issueId === null) {
      s.failedAttempts += 1
      this.setFeedback(
        `That clause doesn't apply. ${policy.distractorReason ?? ''}`,
        'bad'
      )
      s.lastRecap = ''
      return
    }

    if (payer.issueId === chart.issueId && chart.issueId === policy.issueId) {
      const issue = spec.issues.find(i => i.id === chart.issueId)!
      if (issue.verb === 'amend') {
        s.failedAttempts += 1
        this.setFeedback(
          'These pieces line up — but this issue is solved by *amending* the claim, not arguing. Open the amend callout above.',
          'bad'
        )
        s.lastRecap = ''
        return
      }
      if (s.resolvedIssues.has(chart.issueId)) {
        this.setFeedback(
          'Already cited. Other issues still need work — check the checklist.',
          'neutral'
        )
        s.lastRecap = ''
        return
      }
      s.resolvedIssues.add(chart.issueId)
      this.setFeedback(`Citation accepted. Issue addressed: ${issue.label}`, 'good')
      s.lastRecap = issue.recap
      s.selectedPayerId = null
      s.selectedChartId = null
      s.selectedPolicyId = null
      return
    }

    s.failedAttempts += 1
    this.setFeedback(
      'Those three don\'t fit together yet. A citation works when all three pieces address the same issue.',
      'bad'
    )
    s.lastRecap = ''
  }

  private attemptAmend(optionId: string) {
    const s = this.puzzleState
    const spec = this.spec
    if (!s.amendOpen) return
    const slot = spec.amendSlots.find(sl => sl.issueId === s.amendOpen)
    if (!slot) return
    const opt: PuzzleAmendOption | undefined = slot.options.find(o => o.id === optionId)
    if (!opt) return
    if (opt.support === 'wrong' || opt.support === 'partial') {
      s.failedAttempts += 1
      s.amendFeedback = { id: opt.id, message: opt.feedback }
      return
    }
    // Correct (or 'current' — clicking 'current' is filtered in render so
    // it shouldn't fire, but treat defensively as a no-op).
    if (opt.support === 'current') return
    s.amendedFields[slot.issueId] = opt.id
    s.amendOpen = null
    s.amendFeedback = null
    if (!s.resolvedIssues.has(slot.issueId)) {
      s.resolvedIssues.add(slot.issueId)
      const issue = spec.issues.find(i => i.id === slot.issueId)!
      this.setFeedback(
        `Claim amended. ${slot.fieldLabel.split('·')[0].trim()} now ${opt.id}. Issue addressed.`,
        'good'
      )
      s.lastRecap = issue.recap
    }
  }

  private setFeedback(text: string, kind: 'good' | 'bad' | 'neutral' = 'neutral') {
    this.puzzleState.feedback = text
    this.puzzleState.feedbackKind = kind
  }

  /** DEV-only — resolve every issue and set amend fields to their correct
   *  option, so the player can SUBMIT immediately. Doesn't auto-submit so
   *  the victory screen is still a one-click test. */
  private devSolveAll() {
    if (!import.meta.env.DEV) return
    const s = this.puzzleState
    s.briefingDone = true
    for (const issue of this.spec.issues) {
      s.resolvedIssues.add(issue.id)
    }
    for (const slot of this.spec.amendSlots) {
      const correct = slot.options.find(o => o.support === 'correct')
      if (correct) s.amendedFields[slot.issueId] = correct.id
    }
    s.amendOpen = null
    s.amendFeedback = null
    s.feedback = 'DEV: all issues auto-resolved.'
    s.feedbackKind = 'good'
    s.lastRecap = ''
  }

  private submitPacket() {
    const s = this.puzzleState
    if (s.resolvedIssues.size < this.spec.issues.length) return
    s.packetSubmitted = true
    this.rerender()
  }

  private finishToWaitingRoom(won: boolean) {
    const gs = getState()
    if (won) {
      const enc = ENCOUNTERS[this.encounterId]
      if (!gs.defeatedObstacles.includes(this.encounterId)) {
        gs.defeatedObstacles.push(this.encounterId)
      }
      // Resolution brings a small relief; persistent across run.
      updateResources({ stress: -3 })
      unlockCodex(enc.id)
      const earned = enc.unlocksOnDefeat ?? []
      for (const tool of earned) unlockTool(tool)
      saveGame()
      checkLevelProgression()
    } else {
      // Fled — minor stress hit, no obstacle marked defeated.
      updateResources({ stress: +2 })
      saveGame()
    }
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.returnScene)
    })
  }

  private teardown() {
    if (this.clickHandler && this.overlay) {
      this.overlay.removeEventListener('click', this.clickHandler)
    }
    const overlay = document.getElementById(OVERLAY_ID)
    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay)
    const styleTag = document.getElementById(STYLE_ID)
    if (styleTag && styleTag.parentElement) styleTag.parentElement.removeChild(styleTag)
  }
}

// Tiny extra CSS layered on top of BASE_CSS for runtime-puzzle-specific
// bits that don't exist in the standalone prototypes (the leave-button
// in the header, the "amend callouts row" container, etc.). Keeping it
// inline so the runtime port stays self-contained.
const EXTRA_CSS = `
  .back-link {
    background: transparent;
    color: var(--accent-2);
    border: 1px solid #4a3a2a;
    padding: 4px 12px;
    border-radius: 14px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .back-link:hover { background: rgba(240, 168, 104, 0.12); }
  .amend-callouts-row {
    display: flex;
    gap: 12px;
    margin: 0 0 22px;
    flex-wrap: wrap;
  }
  .amend-callouts-row .amend-callout { flex: 1; min-width: 280px; }
  .col-policy .col-tag { color: #a3c5ff; }
  .col-prose .phrase { /* phrase already styled in BASE_CSS hover-tip block via custom prototypes — for runtime we render a simpler styling */ }
  .phrase {
    cursor: pointer;
    background: rgba(239, 91, 123, 0.15);
    border-bottom: 1px dashed var(--bad);
    padding: 2px 5px;
    border-radius: 3px;
    transition: background 0.15s;
    display: inline;
  }
  .phrase:hover { background: rgba(239, 91, 123, 0.32); }
  .phrase.selected {
    background: rgba(239, 91, 123, 0.5);
    color: #fff;
    box-shadow: inset 0 0 0 1px var(--bad);
  }
  .phrase.resolved {
    text-decoration: line-through;
    text-decoration-color: rgba(126, 226, 193, 0.7);
    color: rgba(216, 222, 233, 0.55);
    background: rgba(126, 226, 193, 0.08);
    border-bottom: 1px solid rgba(126, 226, 193, 0.4);
  }
  .workbench { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 22px; }
  @media (max-width: 980px) { .workbench { grid-template-columns: 1fr; } }
  .col { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 14px 16px; }
  .col-h { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
  .col-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .col-payer .col-tag { color: var(--bad); }
  .col-chart .col-tag { color: var(--accent); }
  .col-sub { font-size: 11.5px; color: var(--ink-dim); }
  .col-prose { font-size: 13.5px; line-height: 1.7; margin: 0; }

  .facts, .clauses { list-style: none; padding-left: 0; margin: 0; }
  .fact, .clause { padding: 10px 12px; margin: 6px 0; background: var(--panel-2); border-radius: 5px; border-left: 3px solid transparent; cursor: pointer; transition: all 0.15s; }
  .fact:hover, .clause:hover { background: #232b3a; }
  .fact.selected { border-left-color: var(--accent); background: rgba(126, 226, 193, 0.08); }
  .clause.selected { border-left-color: #a3c5ff; background: rgba(163, 197, 255, 0.08); }
  .fact-plain, .clause-plain { font-size: 13.5px; color: var(--ink); line-height: 1.45; }
  .fact-technical, .clause-technical { font-size: 11px; color: rgba(138, 147, 163, 0.65); margin-top: 6px; padding-top: 5px; border-top: 1px dashed rgba(138, 147, 163, 0.15); line-height: 1.4; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .fact-technical .src, .clause-technical .src { color: rgba(138, 147, 163, 0.45); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; margin-right: 4px; font-family: inherit; }

  /* Citation builder */
  .builder { background: var(--panel); border: 1px solid #232a36; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px; }
  .builder-h { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); margin-bottom: 10px; }
  .builder-row { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 10px; align-items: stretch; }
  @media (max-width: 980px) { .builder-row { grid-template-columns: 1fr; } .connector { text-align: center; padding: 4px 0; } }
  .slot { padding: 10px 12px; background: var(--panel-2); border: 1px dashed #2a3142; border-radius: 5px; min-height: 60px; }
  .slot.filled { border-style: solid; border-color: #3a4658; }
  .slot-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-dim); margin-bottom: 4px; }
  .slot-text { font-size: 13px; }
  .placeholder { color: var(--ink-dim); font-style: italic; }
  .connector { color: var(--ink-dim); font-size: 12px; align-self: center; padding: 0 6px; font-style: italic; }
  .builder-actions { margin-top: 12px; display: flex; gap: 10px; }

  /* Modifier cell highlights inside the claim */
  .modifier-cell { white-space: nowrap; }
  .mod-missing { color: var(--bad); font-style: italic; font-weight: 600; }
  .mod-applied { color: #1a6e52; font-weight: 700; background: rgba(126, 226, 193, 0.3); padding: 2px 8px; border-radius: 3px; }
`
