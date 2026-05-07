import Phaser from 'phaser'
import { DIALOGUES } from '../content/dialogue'
import { unlockCodex, unlockTool, updateResources, saveGame, getState } from '../state'
import { isTouchDevice } from './device'
import type { DialogueNode, DialogueChoice, DialogueEffect } from '../types'

// Speaker → color mapping. Each character gets their own tint on the
// speaker label so it's clear who's talking at a glance. Colors are
// keyed by the speaker string set on each DialogueNode.
const SPEAKER_COLORS: Record<string, string> = {
  Anjali: '#b8d4e8',         // soft cyan, matches her sprite shirt
  'Anjali Patel': '#b8d4e8',
  Dana: '#6da9e3',           // blue (revenue cycle)
  Kim: '#a8d8a8',            // green (registration)
  Jordan: '#d4a0d4',         // purple (PFS)
  'Dr. Martinez': '#f0eedc', // warm white (white coat)
  Pat: '#9bb0c8',            // slate (coding)
  Alex: '#a8a8b0',           // gray (IT/EDI)
  Sam: '#f0a868',            // orange (denials)
  Chloe: '#f4d06f',          // yellow (player ID badge)
  Intern: '#f4d06f',         // legacy label, retained for any unmigrated nodes
}
const SPEAKER_DEFAULT_COLOR = '#7ee2c1'
function colorForSpeaker(name: string): string {
  return SPEAKER_COLORS[name] ?? SPEAKER_DEFAULT_COLOR
}

export class DialogueScene extends Phaser.Scene {
  private currentNode!: DialogueNode
  private speakerText!: Phaser.GameObjects.Text
  private bodyText!: Phaser.GameObjects.Text
  private choiceTexts: Phaser.GameObjects.Text[] = []
  private textBox!: Phaser.GameObjects.Rectangle
  private callingScene!: string
  private onComplete?: (effects: any[]) => void
  private collectedEffects: any[] = []

  constructor() {
    super('Dialogue')
  }

  init(data: { dialogueKey: string; callingScene: string; onComplete?: (effects: any[]) => void }) {
    const node = DIALOGUES[data.dialogueKey]
    if (!node) throw new Error(`Unknown dialogue: ${data.dialogueKey}`)
    this.currentNode = node
    this.callingScene = data.callingScene
    this.onComplete = data.onComplete
    this.collectedEffects = []
  }

  create() {
    const { width, height } = this.scale
    // Mobile gets larger text + a taller box so dialogue is legible
    // without fullscreen. The box still anchors to the bottom of the
    // viewport so the player's view of the world is preserved above.
    const m = isTouchDevice()
    const speakerSize = m ? 17 : 13
    const bodySize    = m ? 16 : 12
    const boxHeight   = m ? 220 : 160
    const speakerY    = height - boxHeight - 10
    const bodyY       = speakerY + speakerSize + 6

    this.textBox = this.add
      .rectangle(width / 2, height - boxHeight / 2, width - 40, boxHeight, 0x0e1116, 0.95)
      .setStrokeStyle(2, 0x2a323d)

    this.speakerText = this.add.text(40, speakerY, '', {
      fontSize: `${speakerSize}px`, fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    })

    this.bodyText = this.add.text(40, bodyY, '', {
      fontSize: `${bodySize}px`, fontFamily: 'monospace', color: '#d0d8e0',
      wordWrap: { width: width - 80 },
    })

    this.showNode(this.currentNode)
  }

  private showNode(node: DialogueNode) {
    this.currentNode = node
    this.speakerText.setText(node.speaker)
    this.speakerText.setColor(colorForSpeaker(node.speaker))
    this.bodyText.setText(node.text)

    this.choiceTexts.forEach(t => t.destroy())
    this.choiceTexts = []

    const { width, height } = this.scale

    const m = isTouchDevice()
    const choiceSize = m ? 15 : 11
    const choiceStep = m ? 28 : 22
    const choiceTopOffset = m ? 110 : 70

    if (node.choices && node.choices.length > 0) {
      node.choices.forEach((choice, i) => {
        const y = height - choiceTopOffset + i * choiceStep
        const ct = this.add.text(60, y, `> ${choice.text}`, {
          fontSize: `${choiceSize}px`, fontFamily: 'monospace', color: '#f4d06f',
        }).setInteractive({ useHandCursor: true })

        ct.on('pointerover', () => ct.setColor('#ffffff'))
        ct.on('pointerout', () => ct.setColor('#f4d06f'))
        ct.on('pointerdown', () => this.selectChoice(choice))

        this.choiceTexts.push(ct)
      })
    } else if (node.next) {
      const advanceText = this.add.text(width - 60, height - 30, 'click or space ▸', {
        fontSize: m ? '13px' : '10px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(1, 0.5)
      this.choiceTexts.push(advanceText)

      const advanceFn = () => {
        const nextNode = DIALOGUES[node.next!]
        if (nextNode) this.showNode(nextNode)
      }

      // Click OR SPACE/ENTER advances. The calling scene's SPACE
      // handler is paused while this DialogueScene is active (the
      // caller called scene.pause()), so there's no double-bind.
      // Use `once` semantics so an accidental held Space doesn't
      // skip multiple lines.
      this.input.once('pointerdown', advanceFn)
      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          window.removeEventListener('keydown', onKey)
          advanceFn()
        }
      }
      window.addEventListener('keydown', onKey)
      // Ensure the listener doesn't outlive the scene if the dialogue
      // ends (or scene shuts down) before either input fires.
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey))
    } else {
      this.endDialogue()
    }
  }

  private selectChoice(choice: DialogueChoice) {
    if (choice.effect) {
      this.collectedEffects.push(choice.effect)
    }

    if (choice.next) {
      const nextNode = DIALOGUES[choice.next]
      if (nextNode) {
        this.showNode(nextNode)
        return
      }
    }

    this.endDialogue()
  }

  private applyEffects() {
    for (const effect of this.collectedEffects) {
      if (effect.unlockCodex) unlockCodex(effect.unlockCodex)
      if (effect.addTool) unlockTool(effect.addTool)
      if (effect.reputationDelta) updateResources({ reputation: effect.reputationDelta })
      if (effect.cashDelta) updateResources({ cash: effect.cashDelta })
      if (effect.auditDelta) updateResources({ auditRisk: effect.auditDelta })
    }
    saveGame()
  }

  private endDialogue() {
    this.applyEffects()

    if (this.onComplete) {
      this.onComplete(this.collectedEffects)
    }

    const descentEffect = this.collectedEffects.find(e => e.triggerDescent)
    const formEffect = this.collectedEffects.find(e => e.triggerForm)

    if (descentEffect && descentEffect.triggerDescent) {
      // Stash the descent signal; the calling scene (Hospital) picks it
      // up on `resume` and plays the descent animation. Doing it that
      // way keeps all the animation + camera plumbing in HospitalScene
      // instead of duplicating it here.
      const state = getState()
      state.pendingDescent = descentEffect.triggerDescent
      saveGame()
      this.scene.stop()
      this.scene.resume(this.callingScene)
    } else if (formEffect) {
      this.scene.stop()
      this.scene.stop(this.callingScene)
      this.scene.start('Form', { caseId: formEffect.triggerForm })
    } else {
      this.scene.stop()
      this.scene.resume(this.callingScene)
    }
  }
}
