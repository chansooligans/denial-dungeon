// Claim preview overlay shown briefly when an NPC's dialogue triggers
// a descent. The player sees a CMS-1500 mockup with the disputed
// fields visible, the panel CSS-blurs out, then the descent animation
// kicks in. ~5s total.
//
// DOM overlay only — kept here so HospitalScene doesn't carry the
// HTML-generation boilerplate inline.

import Phaser from 'phaser'
import type { Encounter } from '../types'
import { ENCOUNTERS } from '../content/enemies'
import { PUZZLE_SPECS } from '../runtime/puzzle/specs'

const STYLE_ID = '__claim_preview_style__'
const OVERLAY_ID = '__claim_preview__'

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch] ?? ch))
}

/** Show a brief read-only preview of the claim that's about to be
 *  fought over, then call onComplete. If the encounter doesn't have
 *  a backing PuzzleSpec.claim (some encounters are flavor-only),
 *  onComplete fires immediately and no overlay is created. */
export function showClaimPreview(
  scene: Phaser.Scene,
  encounterId: string,
  onComplete: () => void,
) {
  const enc = ENCOUNTERS[encounterId] as Encounter | undefined
  const spec = enc?.puzzleSpecId ? PUZZLE_SPECS[enc.puzzleSpecId] : undefined
  if (!enc || !spec || !spec.claim) {
    onComplete()
    return
  }
  const c = spec.claim
  const carc = enc.carcCode
    ? `${enc.carcCode} — ${enc.carcName ?? ''}`.trim()
    : 'CLAIM REJECTED'
  const dxLines = c.diagnoses.map(d =>
    `<div>Dx: ${esc(d.code)}${d.label ? ' — ' + esc(d.label) : ''}</div>`
  ).join('')
  const lineRows = c.serviceLines.map(line => {
    const cpt = `${esc(line.cptCode)}${line.cptLabel ? ' — ' + esc(line.cptLabel) : ''}`
    return `<div>${esc(line.dos)} · POS ${esc(line.pos)} · ${cpt} · ${esc(line.charges)}</div>`
  }).join('')
  const html = `
    <div class="panel">
      <div class="h">CMS-1500 · ${esc(c.claimId)}</div>
      <div>Patient: ${esc(c.patientName)} · ${esc(c.patientDob)}</div>
      <div>Insurer: ${esc(c.insurer)} · ${esc(c.insuredId)}</div>
      ${dxLines}
      ${lineRows}
      <div class="denied">DENIED · ${esc(carc)}</div>
    </div>
  `

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    // 5s total: 2s sharp, 3s blur-out (40% / 60% split).
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed; inset: 0; z-index: 800;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10, 12, 18, 0.78);
        animation: claim-preview-blur 5000ms forwards;
      }
      #${OVERLAY_ID} .panel {
        background: #f5e6c8; color: #1a1208;
        border: 1px solid #2a1a0e; border-radius: 6px;
        padding: 22px 28px; max-width: 480px;
        font: 13px/1.55 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      }
      #${OVERLAY_ID} .h {
        font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        border-bottom: 1px dashed #2a1a0e; padding-bottom: 6px; margin-bottom: 8px;
      }
      #${OVERLAY_ID} .denied {
        color: #b13050; font-weight: 700; margin-top: 10px;
        letter-spacing: 0.04em;
      }
      @keyframes claim-preview-blur {
        0%   { filter: blur(0); opacity: 1; }
        40%  { filter: blur(0); opacity: 1; }
        100% { filter: blur(14px); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  overlay.innerHTML = html
  document.body.appendChild(overlay)

  scene.time.delayedCall(5000, () => {
    overlay.remove()
    style?.remove()
    onComplete()
  })
}
