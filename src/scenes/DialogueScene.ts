import Phaser from 'phaser'
import { DIALOGUES } from '../content/dialogue'
import { unlockCodex, unlockTool, updateResources, saveGame } from '../state'
import type { DialogueNode, DialogueChoice, DialogueEffect } from '../types'

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

    this.textBox = this.add.rectangle(width / 2, height - 90, width - 40, 160, 0x0e1116, 0.95)
      .setStrokeStyle(2, 0x2a323d)

    this.speakerText = this.add.text(40, height - 160, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    })

    this.bodyText = this.add.text(40, height - 138, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#d0d8e0',
      wordWrap: { width: width - 80 },
    })

    this.showNode(this.currentNode)
  }

  private showNode(node: DialogueNode) {
    this.currentNode = node
    this.speakerText.setText(node.speaker)
    this.bodyText.setText(node.text)

    this.choiceTexts.forEach(t => t.destroy())
    this.choiceTexts = []

    const { width, height } = this.scale

    if (node.choices && node.choices.length > 0) {
      node.choices.forEach((choice, i) => {
        const y = height - 70 + i * 22
        const ct = this.add.text(60, y, `> ${choice.text}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#f4d06f',
        }).setInteractive({ useHandCursor: true })

        ct.on('pointerover', () => ct.setColor('#ffffff'))
        ct.on('pointerout', () => ct.setColor('#f4d06f'))
        ct.on('pointerdown', () => this.selectChoice(choice))

        this.choiceTexts.push(ct)
      })
    } else if (node.next) {
      const advanceText = this.add.text(width - 60, height - 30, '[SPACE]', {
        fontSize: '10px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(1, 0.5)
      this.choiceTexts.push(advanceText)

      const advanceFn = () => {
        const nextNode = DIALOGUES[node.next!]
        if (nextNode) this.showNode(nextNode)
      }

      this.input.keyboard!.once('keydown-SPACE', advanceFn)
      this.input.once('pointerdown', advanceFn)
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

    const battleEffect = this.collectedEffects.find(e => e.triggerBattle)
    const formEffect = this.collectedEffects.find(e => e.triggerForm)

    if (battleEffect) {
      this.scene.stop()
      this.scene.stop(this.callingScene)
      this.scene.start('Battle', { encounterId: battleEffect.triggerBattle })
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
