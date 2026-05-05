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
import type {
  ClaimSheetData, CMS1500Data, UB04Data, ServiceLine, UB04ServiceLine, ToolEffect,
} from '../types'

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

/** Position+size of a single rendered box, used by applyEffect. */
interface BoxBounds {
  /** Local-space rectangle inside this Container. */
  x: number
  y: number
  w: number
  h: number
}

export class ClaimSheet extends Phaser.GameObjects.Container {
  private opts: Required<ClaimSheetOptions>
  private highlighted: Set<string>
  /** Per-box bounds keyed by box id ('21A', '24D-1', …). Populated during draw(). */
  private boxBounds = new Map<string, BoxBounds>()

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
    if (data.type === 'cms1500') return this.drawCMS1500(data)
    if (data.type === 'ub04') return this.drawUB04(data)
  }

  private drawCMS1500(data: CMS1500Data) {
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

    this.drawPayerNote(cursorY, W, PAD)
  }

  private drawUB04(data: UB04Data) {
    const W = this.opts.width
    const PAD = 12
    const innerW = W - PAD * 2
    let cursorY = 0

    // ---- Header bar (UB-04 vs CMS-1500 distinguishable at a glance) ----
    const headerH = 22
    this.add(this.scene.add.rectangle(0, cursorY, W, headerH, PALETTE.hdrBg)
      .setOrigin(0, 0).setStrokeStyle(1, PALETTE.border))
    this.add(this.scene.add.text(PAD, cursorY + 5, 'UB-04', {
      fontSize: '11px', fontFamily: 'monospace', color: PALETTE.hdrText, fontStyle: 'bold',
    }).setOrigin(0, 0))
    this.add(this.scene.add.text(W - PAD, cursorY + 5, `Claim ${data.claimId}`, {
      fontSize: '10px', fontFamily: 'monospace', color: PALETTE.label,
    }).setOrigin(1, 0))
    cursorY += headerH

    // ---- Patient + bill type strip (boxes 4 / 6 / 8a / 14) -------------
    const period = data.statementPeriod
      ? `${data.statementPeriod.from} – ${data.statementPeriod.through}`
      : '—'
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      { box: '8a', label: 'Box 8a Patient', value: data.patient.name, w: 0.34 },
      { box: '4',  label: 'Box 4  Type of Bill', value: data.typeOfBill, w: 0.16 },
      { box: '6',  label: 'Box 6  Statement Period', value: period, w: 0.30 },
      { box: '14', label: 'Box 14 Adm Type', value: data.admissionType ?? '—', w: 0.20 },
    ])

    // ---- Insured strip (boxes 60/61/63 — id / group / auth, abbreviated) -
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      { box: '60', label: 'Box 60 Insured ID', value: data.insured.id, w: 0.30 },
      { box: '61', label: 'Box 61 Group', value: data.insured.group ?? '—', w: 0.30 },
      { box: '58', label: 'Box 58 Insured Name', value: data.insured.name ?? data.patient.name, w: 0.40 },
    ])

    // ---- Diagnoses (box 67 + 67A-D shown) ------------------------------
    const dxLabels = ['', 'A', 'B', 'C']
    const dxCells = dxLabels.map((letter, i) => {
      const dx = data.diagnoses[i]
      const value = dx ? (dx.label ? `${dx.code}  ${dx.label}` : dx.code) : '—'
      const box = letter === '' ? '67' : `67${letter}`
      const label = letter === '' ? 'Box 67  Principal Dx' : `Box 67${letter}  Other Dx`
      return { box, label, value, w: 0.25 }
    })
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, dxCells)

    // ---- Service-line table (boxes 42-47) ------------------------------
    cursorY += 4
    cursorY = this.drawUB04ServiceHeader(cursorY, innerW, PAD)
    data.serviceLines.forEach((line, i) => {
      cursorY = this.drawUB04ServiceLine(cursorY, innerW, PAD, line, i + 1)
    })

    // ---- Box 76 (attending provider) + Box 80 (DRG / remarks) ----------
    cursorY += 4
    cursorY = this.drawFieldRow(cursorY, innerW, PAD, [
      {
        box: '76', label: 'Box 76 Attending Provider',
        value: data.attendingProvider.npi
          ? `${data.attendingProvider.name}   NPI ${data.attendingProvider.npi}`
          : data.attendingProvider.name,
        w: 0.7,
      },
      { box: '80', label: 'Box 80 DRG / Remarks', value: data.drg ?? '—', w: 0.3 },
    ])

    this.drawPayerNote(cursorY, W, PAD)
  }

  /** Header row for the UB-04 box 42-47 service-line table. */
  private drawUB04ServiceHeader(y: number, innerW: number, pad: number): number {
    const cols: { label: string; w: number }[] = [
      { label: '#',           w: 0.04 },
      { label: 'Box 42 Rev',  w: 0.10 },
      { label: 'Box 43 Description', w: 0.34 },
      { label: 'Box 44 HCPCS', w: 0.14 },
      { label: 'Box 45 DOS',  w: 0.13 },
      { label: 'Box 46 Units', w: 0.07 },
      { label: 'Box 47 Charges', w: 0.18 },
    ]
    const rowH = 16
    this.add(this.scene.add.rectangle(pad, y, innerW, rowH, PALETTE.hdrBg).setOrigin(0, 0))
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

  /** One row of UB-04 box 42-47. */
  private drawUB04ServiceLine(
    y: number, innerW: number, pad: number,
    line: UB04ServiceLine, index: number,
  ): number {
    const cols: { value: string; w: number; box: string }[] = [
      { value: String(index),         w: 0.04, box: `line-${index}` },
      { value: line.revCode,          w: 0.10, box: `42-${index}` },
      { value: line.description,      w: 0.34, box: `43-${index}` },
      { value: line.hcpcs ?? '—',     w: 0.14, box: `44-${index}` },
      { value: line.serviceDate ?? '—', w: 0.13, box: `45-${index}` },
      { value: line.units ?? '—',     w: 0.07, box: `46-${index}` },
      { value: line.totalCharges,     w: 0.18, box: `47-${index}` },
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
      this.boxBounds.set(c.box, { x: xCursor, y, w: cw, h: rowH })
      xCursor += cw
    }
    return y + rowH + 1
  }

  /** Shared payer-note footer for both form types. */
  private drawPayerNote(cursorY: number, W: number, PAD: number) {
    if (!this.opts.payerNote) return
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
      this.boxBounds.set(cell.box, { x: xCursor, y, w: cw, h: rowH })
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
      // Last cell wins for box-id collisions (e.g. CPT and Mod both
      // map to 24D-{n}); that's fine — applyEffect on 24D-1 lands on
      // the modifier cell, which is what most effects target.
      this.boxBounds.set(c.box, { x: xCursor, y, w: cw, h: rowH })
      xCursor += cw
    }
    return y + rowH + 1
  }

  // ---------------------------------------------------------------------
  // Public mutation: apply a tool/action effect to a specific box. Called
  // from BattleScene after a successful turn so the player sees the form
  // change in response. Animates the new annotation in over ~250ms.
  // ---------------------------------------------------------------------
  applyEffect(effect: ToolEffect) {
    const bounds = this.boxBounds.get(effect.box)
    if (!bounds) {
      // Unknown box id — author-time mistake; render-side no-op.
      return
    }
    switch (effect.kind) {
      case 'stamp':
        this.spawnStamp(bounds, effect.value ?? '✓')
        break
      case 'check':
        this.spawnCheck(bounds)
        break
      case 'note':
        this.spawnNote(bounds, effect.value ?? '')
        break
    }
  }

  /** Diagonal red text overlapping the box (e.g. "+25 mod"). */
  private spawnStamp(b: BoxBounds, value: string) {
    const cx = b.x + b.w * 0.55
    const cy = b.y + b.h / 2
    const stamp = this.scene.add.text(cx, cy, value, {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#ef5b7b', fontStyle: 'bold',
    }).setOrigin(0.5).setAngle(-12).setAlpha(0).setScale(1.4)
    this.add(stamp)
    this.scene.tweens.add({
      targets: stamp,
      alpha: 1, scale: 1,
      duration: 280, ease: 'Back.easeOut',
    })
  }

  /** Green ✓ at the right edge of the box. */
  private spawnCheck(b: BoxBounds) {
    const cx = b.x + b.w - 10
    const cy = b.y + b.h / 2
    const check = this.scene.add.text(cx, cy, '✓', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#6cd49a', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5)
    this.add(check)
    this.scene.tweens.add({
      targets: check,
      alpha: 1, scale: 1,
      duration: 240, ease: 'Back.easeOut',
    })
  }

  /** Yellow annotation under the box (e.g. "LCD reviewed"). */
  private spawnNote(b: BoxBounds, value: string) {
    const note = this.scene.add.text(b.x + 4, b.y + b.h + 1, value, {
      fontSize: '8px', fontFamily: 'monospace',
      color: '#f4d06f', fontStyle: 'italic',
    }).setOrigin(0, 0).setAlpha(0)
    this.add(note)
    this.scene.tweens.add({
      targets: note,
      alpha: 1,
      duration: 240, ease: 'Sine.easeOut',
    })
  }
}
