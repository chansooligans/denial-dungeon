// ClaimSheet — renders a realistic CMS-1500 (and, later, UB-04) panel
// inside BattleScene. Read-only for Phase A: the player sees the actual
// box numbers, real CPT / ICD-10 codes, place of service, charges, and
// the payer's denial language tied to the disputed boxes. Pedagogical
// goal: by fight 5, the player recognizes form regions on sight.
//
// Visual layout (CMS-1500, ~880×260 px):
//
//  ┌── CMS-1500 — CLM-2026-… ──────────────────────────────────────────┐
//  │ Box 2   WALKER, ARLENE     1a BCB827193401      3 1958-03-12 F    │
//  │ Box 4   WALKER, ARLENE                          11 0042873        │
//  │ Box 21  A I50.9 [Heart failure, unspec.]                          │
//  │         B —              C —              D —                     │
//  │ Box 24  DOS         POS  CPT     Mod   DXp   Charges              │
//  │   1     2026-01-15  11   93306   —     A     $2,150.00            │
//  │ Box 31  Dr. M. Chen, MD                                           │
//  ├── Payer note ─────────────────────────────────────────────────────┤
//  │ "TTE 93306 not medically necessary for I50.9 …"                   │
//  └──────────────────────────────────────────────────────────────────┘

import Phaser from 'phaser'
import type { ClaimSheetData, ServiceLine } from '../types'

export interface ClaimSheetOptions {
  /** Box ids (e.g. '21A', '24D-1', '24A-2') that should render disputed. */
  highlightedBoxes?: string[]
  /** Payer denial language to render below the form. */
  payerNote?: string
  /** Total panel width in px. Height auto-sizes. */
  width?: number
}

const PALETTE = {
  bg:        0x0e1116,
  border:    0x2a323d,
  hdrBg:     0x1f262f,
  hdrText:   '#d0bce0',
  fieldBg:   0x141a21,
  label:     '#5a6a7a',
  value:     '#e6edf3',
  highlight: 0xef5b7b,
  highlightAlpha: 0.18,
  payerNote: '#f4d06f',
}

export class ClaimSheet extends Phaser.GameObjects.Container {
  private opts: Required<ClaimSheetOptions>
  private highlighted: Set<string>

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: ClaimSheetData,
    options: ClaimSheetOptions = {}
  ) {
    super(scene, x, y)
    this.opts = {
      highlightedBoxes: options.highlightedBoxes ?? [],
      payerNote: options.payerNote ?? '',
      width: options.width ?? 880,
    }
    this.highlighted = new Set(this.opts.highlightedBoxes)
    this.setDepth(40)
    this.draw(data)
    scene.add.existing(this)
  }

  private draw(data: ClaimSheetData) {
    const W = this.opts.width
    const PAD = 12
    const innerW = W - PAD * 2
    let cursorY = 0

    // ---- Header bar -----------------------------------------------------
    const headerH = 22
    const header = this.scene.add.rectangle(0, cursorY, W, headerH, PALETTE.hdrBg)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PALETTE.border)
    this.add(header)
    this.add(this.scene.add.text(PAD, cursorY + 5, 'CMS-1500', {
      fontSize: '11px', fontFamily: 'monospace', color: PALETTE.hdrText, fontStyle: 'bold',
    }).setOrigin(0, 0))
    this.add(this.scene.add.text(W - PAD, cursorY + 5, `Claim ${data.claimId}`, {
      fontSize: '10px', fontFamily: 'monospace', color: PALETTE.label,
    }).setOrigin(1, 0))
    cursorY += headerH

    // ---- Box 1/1a/2/3 (patient + insured-id strip) ----------------------
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      { box: '2',  label: 'Box 2  Patient',     value: data.patient.name,     w: 0.32 },
      { box: '1a', label: 'Box 1a Insured ID',  value: data.insured.id,       w: 0.28 },
      { box: '3',  label: 'Box 3  DOB / Sex',
        value: `${data.patient.dob}${data.patient.sex ? '  ' + data.patient.sex : ''}`, w: 0.22 },
      { box: '1',  label: 'Box 1  Plan',        value: data.insuranceType ?? '—', w: 0.18 },
    ])

    // ---- Box 4/11 (insured name + group #) ------------------------------
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      { box: '4',  label: 'Box 4  Insured Name', value: data.insured.name ?? '—', w: 0.6 },
      { box: '11', label: 'Box 11 Group #',      value: data.insured.group ?? '—', w: 0.4 },
    ])

    // ---- Box 21 A-D (diagnoses) -----------------------------------------
    const dxLabels = ['A', 'B', 'C', 'D']
    const dxCells = dxLabels.map((letter, i) => {
      const dx = data.diagnoses[i]
      const value = dx
        ? (dx.label ? `${dx.code}  ${dx.label}` : dx.code)
        : '—'
      return { box: `21${letter}`, label: `Box 21${letter}`, value, w: 0.25 }
    })
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, dxCells)

    // ---- Box 24 (service-line table) ------------------------------------
    cursorY += 4
    cursorY = this.drawServiceLineHeader(cursorY, innerW, PAD)
    data.serviceLines.forEach((line, i) => {
      cursorY = this.drawServiceLine(cursorY, innerW, PAD, line, i + 1)
    })

    // ---- Box 31 (rendering provider) ------------------------------------
    cursorY += 4
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      { box: '31', label: 'Box 31 Rendering Provider',
        value: data.provider.npi
          ? `${data.provider.name}   NPI ${data.provider.npi}`
          : data.provider.name,
        w: 1.0 },
    ])

    // ---- Payer note (if any) -------------------------------------------
    if (this.opts.payerNote) {
      cursorY += 6
      const noteH = 38
      this.add(this.scene.add.rectangle(0, cursorY, W, noteH, PALETTE.bg)
        .setOrigin(0, 0)
        .setStrokeStyle(1, PALETTE.highlight))
      this.add(this.scene.add.text(PAD, cursorY + 4, 'Payer denial:', {
        fontSize: '9px', fontFamily: 'monospace', color: PALETTE.payerNote,
        fontStyle: 'bold',
      }).setOrigin(0, 0))
      this.add(this.scene.add.text(PAD, cursorY + 16, `“${this.opts.payerNote}”`, {
        fontSize: '10px', fontFamily: 'monospace', color: PALETTE.payerNote,
        wordWrap: { width: W - PAD * 2 },
      }).setOrigin(0, 0))
    }
  }

  /** Single horizontal row of labelled cells. Returns the new cursor Y. */
  private drawFieldRow(
    y: number, innerW: number, pad: number,
    cells: { box: string; label: string; value: string; w: number }[]
  ): number {
    const rowH = 28
    let xCursor = pad
    for (const cell of cells) {
      const cw = innerW * cell.w - 2 // small gutter
      const isHot = this.highlighted.has(cell.box)
      const bg = this.scene.add.rectangle(xCursor, y, cw, rowH,
        isHot ? PALETTE.highlight : PALETTE.fieldBg, isHot ? PALETTE.highlightAlpha : 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, isHot ? PALETTE.highlight : PALETTE.border)
      this.add(bg)
      this.add(this.scene.add.text(xCursor + 4, y + 2, cell.label, {
        fontSize: '8px', fontFamily: 'monospace', color: PALETTE.label,
      }).setOrigin(0, 0))
      this.add(this.scene.add.text(xCursor + 4, y + 13, cell.value, {
        fontSize: '11px', fontFamily: 'monospace',
        color: isHot ? '#ffd2da' : PALETTE.value,
      }).setOrigin(0, 0))
      xCursor += innerW * cell.w + 2
    }
    return y + rowH + 2
  }

  /** Header row for box 24's service-line table. */
  private drawServiceLineHeader(y: number, innerW: number, pad: number): number {
    const cols: { label: string; w: number }[] = [
      { label: '#',       w: 0.04 },
      { label: 'DOS',     w: 0.18 },
      { label: 'POS',     w: 0.07 },
      { label: 'CPT',     w: 0.30 },
      { label: 'Mod',     w: 0.10 },
      { label: 'Dx ptr',  w: 0.10 },
      { label: 'Charges', w: 0.21 },
    ]
    const rowH = 16
    this.add(this.scene.add.rectangle(pad, y, innerW, rowH, PALETTE.hdrBg)
      .setOrigin(0, 0))
    let xCursor = pad
    for (const c of cols) {
      const cw = innerW * c.w
      this.add(this.scene.add.text(xCursor + 4, y + 3, c.label, {
        fontSize: '8px', fontFamily: 'monospace', color: PALETTE.label,
      }).setOrigin(0, 0))
      xCursor += cw
    }
    return y + rowH
  }

  /** One row of box 24 (a single service line). */
  private drawServiceLine(
    y: number, innerW: number, pad: number,
    line: ServiceLine, index: number
  ): number {
    const cols: { value: string; w: number; box: string }[] = [
      { value: String(index),                             w: 0.04, box: '24'  },
      { value: line.dos,                                  w: 0.18, box: `24A-${index}` },
      { value: line.pos,                                  w: 0.07, box: `24B-${index}` },
      { value: line.cpt.label
                ? `${line.cpt.code}  ${line.cpt.label}`
                : line.cpt.code,                          w: 0.30, box: `24D-${index}` },
      { value: line.modifier ?? '—',                      w: 0.10, box: `24D-${index}` },
      { value: line.dxPointer,                            w: 0.10, box: `24E-${index}` },
      { value: line.charges,                              w: 0.21, box: `24F-${index}` },
    ]
    const rowH = 18
    let xCursor = pad
    for (const c of cols) {
      const cw = innerW * c.w
      const isHot = this.highlighted.has(c.box)
      if (isHot) {
        this.add(this.scene.add.rectangle(xCursor, y, cw, rowH,
          PALETTE.highlight, PALETTE.highlightAlpha)
          .setOrigin(0, 0)
          .setStrokeStyle(1, PALETTE.highlight))
      }
      this.add(this.scene.add.text(xCursor + 4, y + 3, c.value, {
        fontSize: '10px', fontFamily: 'monospace',
        color: isHot ? '#ffd2da' : PALETTE.value,
      }).setOrigin(0, 0))
      xCursor += cw
    }
    return y + rowH + 1
  }
}
