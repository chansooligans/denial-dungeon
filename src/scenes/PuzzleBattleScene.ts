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
import { debugEvent } from './debugRibbon'
// Puzzle-specific CSS (runtime-only — the standalone prototypes
// use their own per-case CSS). Vite `?raw` import returns the file
// contents as a string so the existing template-string injection
// pattern keeps working.
import puzzleBattleCssRaw from './puzzleBattle.css?raw'
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
  private keyHandler!: (e: KeyboardEvent) => void

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
      // Make all puzzle text selectable so the player can highlight +
      // copy briefing / claim / victory copy.
      overlay.style.userSelect = 'text'
      ;(overlay.style as any).webkitUserSelect = 'text'
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
    // ESC closes the briefing popover or amend modal (whichever is
    // open). Mirrors the standalone Case prototype behavior.
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      let changed = false
      if (this.puzzleState.briefingOpen) {
        this.puzzleState.briefingOpen = false
        changed = true
      }
      if (this.puzzleState.amendOpen) {
        this.puzzleState.amendOpen = null
        this.puzzleState.amendFeedback = null
        changed = true
      }
      if (changed) this.rerender()
    }
    window.addEventListener('keydown', this.keyHandler)
  }

  private rerender() {
    const root = document.getElementById('__puzzle_root__')
    if (!root) return
    try {
      root.innerHTML = render(this.spec, this.puzzleState)
    } catch (err) {
      // Surface render exceptions to the debug ribbon AND a visible
      // error card inside the overlay. Mobile players can't open
      // devtools; a crash that leaves the puzzle blank is hard to
      // report. This makes the failure self-describing.
      const msg = (err as Error)?.message ?? String(err)
      const stack = (err as Error)?.stack?.split('\n').slice(0, 4).join(' | ') ?? ''
      debugEvent(`render-err: ${msg.slice(0, 60)}`)
      root.innerHTML = `
        <div style="margin:40px auto;max-width:640px;padding:24px;background:#1d2330;border:1px solid #ef5b7b;border-radius:8px;color:#d8dee9;font:14px/1.55 system-ui,sans-serif;">
          <div style="color:#ef5b7b;font-weight:700;letter-spacing:0.08em;font-size:11px;margin-bottom:8px;">PUZZLE RENDER ERROR</div>
          <div style="margin-bottom:8px;">${escapeHtml(msg)}</div>
          <details><summary style="color:#8a93a3;font-size:12px;cursor:pointer;">stack</summary>
          <pre style="font-size:10px;white-space:pre-wrap;color:#8a93a3;margin-top:6px;">${escapeHtml(stack)}</pre>
          </details>
          <div style="margin-top:14px;display:flex;gap:8px;">
            <button data-action="flee" style="padding:6px 12px;border-radius:4px;background:transparent;color:#f0a868;border:1px solid #4a3a2a;cursor:pointer;font:inherit;">⏎ Leave</button>
          </div>
        </div>
      `
    }
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null
    if (!target) return
    // Backdrop click closes amend modal (the inner modal stops propagation
    // by virtue of having data-action="amend-modal-stop", which falls into
    // the default branch and does nothing).
    if (target.classList?.contains('amend-modal-backdrop')) {
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
        this.puzzleState.briefingOpen = false
        break
      case 'show-briefing':
        // Recall — opens the notebook overlay mid-encounter.
        this.puzzleState.briefingOpen = true
        break
      case 'close-briefing':
        this.puzzleState.briefingOpen = false
        break
      case 'noop':
        // Inner popover swallows clicks so they don't bubble up to
        // the backdrop's close-briefing handler. Intentional no-op.
        return
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
        // Continue from the victory + recap page → cinematic fade
        // back to the calling scene.
        this.finishCinematic()
        return
      case 'flee':
        this.fleeToWaitingRoom()
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

    const payer = (spec.payerPhrases ?? []).find(p => p.id === s.selectedPayerId)
    const chart = (spec.chartFacts ?? []).find(f => f.id === s.selectedChartId)
    const policy = (spec.policyClauses ?? []).find(c => c.id === s.selectedPolicyId)
    if (!payer || !chart || !policy) return

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
      if (issue.verb !== 'cite') {
        s.failedAttempts += 1
        this.setFeedback(
          'These pieces line up — but this issue is solved by amending the claim, not arguing. Open the amend callout above.',
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

    const gs = getState()
    const enc = ENCOUNTERS[this.encounterId]
    if (!gs.defeatedObstacles.includes(this.encounterId)) {
      gs.defeatedObstacles.push(this.encounterId)
    }
    updateResources({ stress: -3 })
    unlockCodex(enc.id)
    for (const tool of enc.unlocksOnDefeat ?? []) unlockTool(tool)
    // Flag the wake-up transition for the destination scene.
    gs.pendingClaimSubmitted = {
      encounterId: this.encounterId,
      claimId: this.spec.claim?.claimId ?? null,
    }
    saveGame()
    checkLevelProgression()

    // Show the victory page + post-victory recap (key concepts +
    // resources). The cinematic fade-to-black + wake-up transition
    // happens later, when the player clicks Continue (the 'finish'
    // action). This mirrors the standalone Case prototypes — players
    // see what they learned before they leave the encounter.
    s.packetSubmitted = true
    debugEvent(`submit ${this.encounterId}`)
    this.rerender()
    // Scroll back to the top so the victory page lands in view rather
    // than wherever the player happened to be on the workbench.
    this.overlay.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  private finishCinematic() {
    // Cinematic transition out of the puzzle overlay back into the
    // calling scene. Used by the Continue button after the player
    // has read the recap.
    this.overlay.classList.add('puzzle-submit-out')
    this.cameras.main.fadeOut(1500, 0, 0, 0)
    this.fadeOutRedRoomAmbience(1500)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      debugEvent(`fadeOutComplete -> ${this.returnScene}`)
      this._transitionToReturn()
    })
    this.time.delayedCall(1600, () => {
      if (this.scene.isActive(this.scene.key)) {
        debugEvent('fadeOut backstop fired')
        this._transitionToReturn()
      }
    })
  }

  // Wake a sleeping Hospital rather than recreating it from scratch —
  // avoids rebuilding 10k tiles on mobile (which exceeds WebGL limits).
  // Falls back to scene.start for any return scene that isn't sleeping.
  private _transitionToReturn() {
    const sleeping = this.scene.isSleeping(this.returnScene)
    debugEvent(`return:${this.returnScene} sleeping=${sleeping}`)
    if (sleeping) {
      this.scene.stop()
      this.scene.wake(this.returnScene)
    } else {
      this.scene.start(this.returnScene)
    }
  }

  /** Fade out any red_room_* ambience that's playing globally, then
   *  stop and destroy it. Used at the end of a puzzle so WR music
   *  doesn't bleed into the Hospital. */
  private fadeOutRedRoomAmbience(durationMs: number) {
    for (const key of ['red_room_1', 'red_room_2', 'red_room_3']) {
      const s = this.sound.get(key)
      if (!s || !s.isPlaying) continue
      this.tweens.add({
        targets: s,
        volume: 0,
        duration: durationMs,
        onComplete: () => {
          s.stop()
          s.destroy()
        },
      })
    }
  }

  private fleeToWaitingRoom() {
    // Player bailed on the encounter (Leave button). Stress penalty
    // and a quick fade back to the calling scene.
    updateResources({ stress: +2 })
    saveGame()
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.fadeOutRedRoomAmbience(400)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.returnScene)
    })
  }

  private teardown() {
    if (this.clickHandler && this.overlay) {
      this.overlay.removeEventListener('click', this.clickHandler)
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler)
    }
    const overlay = document.getElementById(OVERLAY_ID)
    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay)
    const styleTag = document.getElementById(STYLE_ID)
    if (styleTag && styleTag.parentElement) styleTag.parentElement.removeChild(styleTag)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Tiny extra CSS layered on top of BASE_CSS for runtime-puzzle-specific
// bits that don't exist in the standalone prototypes (the leave-button
// in the header, the "amend callouts row" container, etc.). Keeping it
// inline so the runtime port stays self-contained.
// EXTRA_CSS lives in a sibling .css file (./puzzleBattle.css).
// Vite's `?raw` import returns the file contents as a string so we
// can keep the same template-string injection pattern.
const EXTRA_CSS = puzzleBattleCssRaw
