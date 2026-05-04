import Phaser from 'phaser'
import { ENEMIES } from '../content/enemies'
import { ABILITIES } from '../content/abilities'
import { CLASSES } from '../content/classes'
import { PHASE_NAMES, FACTION_COLOR } from '../types'
import type { RunState, EnemyDef, Faction, ClassId, RoomDef } from '../types'
import { createRng, pick, shuffle } from '../store/seed'

const TILE = 16
const ROOM_W = 52
const ROOM_H = 36
const PLAYER_SPEED = 160
const DASH_SPEED = 500
const DASH_DURATION = 150
const DASH_COOLDOWN = 600
const FACTION_BONUS = 1.6

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  enemyDef: EnemyDef
  hp: number
  maxHp: number
  lastAttack: number
  hpBar: Phaser.GameObjects.Graphics
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key }
  private dashKey!: Phaser.Input.Keyboard.Key
  private abilityKeys!: Phaser.Input.Keyboard.Key[]
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private playerBullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private doorZone!: Phaser.GameObjects.Zone | null

  private run!: RunState
  private rng!: () => number
  private isDashing = false
  private dashCooldownUntil = 0
  private lastAbilityUse: Record<string, number> = {}
  private aimAngle = 0
  private roomEnemies: EnemySprite[] = []
  private roomCleared = false
  private transitioning = false

  constructor() {
    super('Game')
  }

  init(data: { classId: ClassId; seed: string }) {
    const cls = CLASSES[data.classId]
    this.rng = createRng(data.seed)

    const rooms = this.generateRooms()

    this.run = {
      seed: data.seed,
      classId: data.classId,
      phase: 0,
      room: 0,
      resources: {
        hp: cls.startingHp,
        maxHp: cls.startingHp,
        cash: 100,
        reputation: 50,
        auditRisk: 0,
      },
      abilities: [...cls.startingAbilities],
      rooms,
      discovered: [],
      status: 'playing',
    }
  }

  create() {
    this.scene.launch('HUD', { run: this.run })
    this.setupInput()
    this.setupGroups()
    this.buildRoom()
  }

  private setupInput() {
    const kb = this.input.keyboard!
    this.cursors = {
      w: kb.addKey('W'),
      a: kb.addKey('A'),
      s: kb.addKey('S'),
      d: kb.addKey('D'),
    }
    this.dashKey = kb.addKey('SPACE')
    this.abilityKeys = [
      kb.addKey('ONE'),
      kb.addKey('TWO'),
      kb.addKey('THREE'),
      kb.addKey('FOUR'),
    ]

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.player) {
        this.aimAngle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          pointer.worldX, pointer.worldY
        )
      }
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.fireAbility(0)
      }
    })
  }

  private setupGroups() {
    this.walls = this.physics.add.staticGroup()
    this.enemies = this.physics.add.group()
    this.playerBullets = this.physics.add.group({ defaultKey: 'bullet_player' })
    this.enemyBullets = this.physics.add.group()
  }

  private buildRoom() {
    this.roomCleared = false
    this.transitioning = false
    this.doorZone = null
    this.roomEnemies = []

    // Clear existing
    this.walls.clear(true, true)
    this.enemies.clear(true, true)
    this.playerBullets.clear(true, true)
    this.enemyBullets.clear(true, true)

    // Floor
    for (let y = 0; y < ROOM_H; y++) {
      for (let x = 0; x < ROOM_W; x++) {
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'floor')
      }
    }

    // Walls (border)
    for (let x = 0; x < ROOM_W; x++) {
      this.walls.create(x * TILE + TILE / 2, TILE / 2, 'wall')
      this.walls.create(x * TILE + TILE / 2, (ROOM_H - 1) * TILE + TILE / 2, 'wall')
    }
    for (let y = 1; y < ROOM_H - 1; y++) {
      this.walls.create(TILE / 2, y * TILE + TILE / 2, 'wall')
      this.walls.create((ROOM_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, 'wall')
    }

    // Some interior obstacles
    const numObstacles = 3 + Math.floor(this.rng() * 5)
    for (let i = 0; i < numObstacles; i++) {
      const ox = 5 + Math.floor(this.rng() * (ROOM_W - 10))
      const oy = 5 + Math.floor(this.rng() * (ROOM_H - 10))
      const ow = 2 + Math.floor(this.rng() * 3)
      const oh = 2 + Math.floor(this.rng() * 3)
      for (let bx = ox; bx < ox + ow && bx < ROOM_W - 1; bx++) {
        for (let by = oy; by < oy + oh && by < ROOM_H - 1; by++) {
          this.walls.create(bx * TILE + TILE / 2, by * TILE + TILE / 2, 'wall')
        }
      }
    }

    // Player
    if (!this.player) {
      this.player = this.physics.add.sprite(ROOM_W * TILE / 2, (ROOM_H - 3) * TILE, 'player')
      this.player.setCollideWorldBounds(true)
      this.player.setScale(2)
      this.player.setDepth(10)
      this.physics.add.collider(this.player, this.walls)
    } else {
      this.player.setPosition(ROOM_W * TILE / 2, (ROOM_H - 3) * TILE)
      this.player.setVelocity(0, 0)
    }

    // Camera
    this.cameras.main.setBounds(0, 0, ROOM_W * TILE, ROOM_H * TILE)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.physics.world.setBounds(0, 0, ROOM_W * TILE, ROOM_H * TILE)

    // Spawn enemies
    const room = this.run.rooms[this.run.room]
    if (room.type === 'combat' || room.type === 'boss') {
      this.spawnEnemies(room)
    } else {
      this.roomCleared = true
      this.showDoor()
    }

    // Collisions
    this.physics.add.collider(this.enemies, this.walls)
    this.physics.add.overlap(this.playerBullets, this.enemies, this.onBulletHitEnemy as any, undefined, this)
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer as any, undefined, this)
    this.physics.add.collider(this.player, this.enemies, this.onPlayerTouchEnemy as any, undefined, this)

    // Phase label
    this.showPhaseLabel()
  }

  private spawnEnemies(room: RoomDef) {
    for (const enemyId of room.enemies) {
      const def = ENEMIES[enemyId]
      if (!def) continue

      const spawnX = (4 + Math.floor(this.rng() * (ROOM_W - 8))) * TILE
      const spawnY = (3 + Math.floor(this.rng() * (ROOM_H / 2))) * TILE

      const texture = room.type === 'boss' ? 'enemy_boss' : `enemy_${def.surfaceFaction}`
      const sprite = this.physics.add.sprite(spawnX, spawnY, texture) as EnemySprite
      sprite.setScale(room.type === 'boss' ? 2.5 : 2)
      sprite.setCollideWorldBounds(true)
      sprite.enemyDef = def
      sprite.hp = def.hp
      sprite.maxHp = def.hp
      sprite.lastAttack = 0

      // HP bar
      sprite.hpBar = this.add.graphics()
      sprite.setDepth(5)

      this.enemies.add(sprite)
      this.roomEnemies.push(sprite)
    }
  }

  private showPhaseLabel() {
    const room = this.run.rooms[this.run.room]
    const phaseName = PHASE_NAMES[room.phase] || 'Unknown'
    const label = this.add.text(
      ROOM_W * TILE / 2, 30,
      `Phase ${room.phase + 1}: ${phaseName}`,
      { fontSize: '14px', fontFamily: 'monospace', color: '#8b95a5' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100)

    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 2000,
      duration: 1000,
      onComplete: () => label.destroy(),
    })
  }

  update(time: number, delta: number) {
    if (this.run.status !== 'playing' || this.transitioning) return

    this.handleMovement(time)
    this.handleAbilities(time)
    this.updateEnemies(time)
    this.updateHPBars()
    this.checkRoomClear()

    // Update HUD
    this.scene.get('HUD').events.emit('update-run', this.run)
  }

  private handleMovement(time: number) {
    if (this.isDashing) return

    let vx = 0
    let vy = 0
    if (this.cursors.a.isDown) vx -= 1
    if (this.cursors.d.isDown) vx += 1
    if (this.cursors.w.isDown) vy -= 1
    if (this.cursors.s.isDown) vy += 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx /= len
      vy /= len
    }

    this.player.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED)

    // Dash
    if (Phaser.Input.Keyboard.JustDown(this.dashKey) && time > this.dashCooldownUntil && (vx !== 0 || vy !== 0)) {
      this.isDashing = true
      this.dashCooldownUntil = time + DASH_COOLDOWN
      this.player.setVelocity(vx * DASH_SPEED, vy * DASH_SPEED)
      this.player.setAlpha(0.5)

      // Ghost trail
      const ghost = this.add.sprite(this.player.x, this.player.y, 'player_ghost').setScale(2).setAlpha(0.4)
      this.tweens.add({ targets: ghost, alpha: 0, duration: 300, onComplete: () => ghost.destroy() })

      this.time.delayedCall(DASH_DURATION, () => {
        this.isDashing = false
        this.player.setAlpha(1)
        this.player.setVelocity(vx * PLAYER_SPEED * 0.5, vy * PLAYER_SPEED * 0.5)
      })
    }
  }

  private handleAbilities(time: number) {
    // Number keys or left click fires abilities
    for (let i = 0; i < Math.min(4, this.run.abilities.length); i++) {
      if (Phaser.Input.Keyboard.JustDown(this.abilityKeys[i])) {
        this.fireAbility(i)
      }
    }
  }

  private fireAbility(index: number) {
    const abilityId = this.run.abilities[index]
    if (!abilityId) return
    const ability = ABILITIES[abilityId]
    if (!ability) return

    const now = this.time.now
    const lastUse = this.lastAbilityUse[abilityId] || 0
    if (now - lastUse < ability.cooldown) return

    this.lastAbilityUse[abilityId] = now

    const bullet = this.playerBullets.create(
      this.player.x, this.player.y, 'bullet_player'
    ) as Phaser.Physics.Arcade.Sprite
    bullet.setScale(1.5)
    bullet.setData('ability', ability)
    bullet.setData('damage', ability.damage)

    const vx = Math.cos(this.aimAngle) * ability.projectileSpeed
    const vy = Math.sin(this.aimAngle) * ability.projectileSpeed
    bullet.setVelocity(vx, vy)

    // Destroy after range
    const lifetime = (ability.range / ability.projectileSpeed) * 1000
    this.time.delayedCall(lifetime, () => {
      if (bullet.active) bullet.destroy()
    })

    // Side effects
    if (ability.reputationDelta) this.run.resources.reputation += ability.reputationDelta
    if (ability.auditDelta) this.run.resources.auditRisk += ability.auditDelta
    if (ability.cashDelta) this.run.resources.cash += ability.cashDelta
  }

  private updateEnemies(time: number) {
    for (const enemy of this.roomEnemies) {
      if (!enemy.active) continue

      // Chase player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
      const speed = enemy.enemyDef.speed
      enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

      // Attack
      if (time - enemy.lastAttack > enemy.enemyDef.attackCooldown) {
        enemy.lastAttack = time
        this.enemyFire(enemy)
      }
    }
  }

  private enemyFire(enemy: EnemySprite) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    const texture = `bullet_${enemy.enemyDef.surfaceFaction}`

    const bullet = this.enemyBullets.create(enemy.x, enemy.y, texture) as Phaser.Physics.Arcade.Sprite
    if (!bullet) return
    bullet.setScale(1.5)
    bullet.setData('damage', enemy.enemyDef.attackDamage)

    const vx = Math.cos(angle) * enemy.enemyDef.projectileSpeed
    const vy = Math.sin(angle) * enemy.enemyDef.projectileSpeed
    bullet.setVelocity(vx, vy)

    this.time.delayedCall(3000, () => {
      if (bullet.active) bullet.destroy()
    })
  }

  private updateHPBars() {
    for (const enemy of this.roomEnemies) {
      if (!enemy.active || !enemy.hpBar) continue
      enemy.hpBar.clear()
      const barWidth = 32
      const barHeight = 4
      const x = enemy.x - barWidth / 2
      const y = enemy.y - 24

      enemy.hpBar.fillStyle(0x2a323d)
      enemy.hpBar.fillRect(x, y, barWidth, barHeight)
      const pct = enemy.hp / enemy.maxHp
      enemy.hpBar.fillStyle(pct > 0.5 ? 0x6cd49a : pct > 0.25 ? 0xf0a868 : 0xef5b7b)
      enemy.hpBar.fillRect(x, y, barWidth * pct, barHeight)

      // CARC code label
      enemy.hpBar.fillStyle(0xffffff, 0)
    }
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemySprite: Phaser.Physics.Arcade.Sprite) {
    const enemy = enemySprite as EnemySprite
    const ability = bullet.getData('ability')
    let damage: number = bullet.getData('damage') || 10

    // Faction bonus
    if (ability?.blocksFactions?.includes(enemy.enemyDef.rootFaction)) {
      damage = Math.round(damage * FACTION_BONUS)
      this.showDamageText(enemy.x, enemy.y - 20, `${damage} EFFECTIVE!`, 0x7ee2c1)
    } else {
      this.showDamageText(enemy.x, enemy.y - 20, `${damage}`, 0xe6edf3)
    }

    enemy.hp -= damage
    bullet.destroy()

    // Flash
    enemy.setTint(0xffffff)
    this.time.delayedCall(100, () => {
      if (enemy.active) enemy.clearTint()
    })

    if (enemy.hp <= 0) {
      this.killEnemy(enemy)
    }
  }

  private onEnemyBulletHitPlayer(player: Phaser.Physics.Arcade.Sprite, bullet: Phaser.Physics.Arcade.Sprite) {
    if (this.isDashing) {
      bullet.destroy()
      return
    }

    const damage: number = bullet.getData('damage') || 5
    this.run.resources.hp -= damage
    bullet.destroy()

    // Flash red
    this.player.setTint(0xef5b7b)
    this.time.delayedCall(150, () => {
      if (this.player.active) this.player.clearTint()
    })

    this.showDamageText(this.player.x, this.player.y - 20, `-${damage}`, 0xef5b7b)

    if (this.run.resources.hp <= 0) {
      this.run.status = 'lost'
      this.gameOver()
    }
  }

  private onPlayerTouchEnemy(player: Phaser.Physics.Arcade.Sprite, enemySprite: Phaser.Physics.Arcade.Sprite) {
    if (this.isDashing) return
    const enemy = enemySprite as EnemySprite
    this.run.resources.hp -= 3
    this.player.setTint(0xef5b7b)
    this.time.delayedCall(100, () => { if (this.player.active) this.player.clearTint() })

    // Knockback
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    this.player.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300)

    if (this.run.resources.hp <= 0) {
      this.run.status = 'lost'
      this.gameOver()
    }
  }

  private killEnemy(enemy: EnemySprite) {
    // Track discovery
    if (!this.run.discovered.includes(enemy.enemyDef.id)) {
      this.run.discovered.push(enemy.enemyDef.id)
    }

    // Show watchpoint reveal
    this.showReveal(enemy)

    enemy.hpBar.destroy()
    enemy.destroy()
    this.roomEnemies = this.roomEnemies.filter(e => e !== enemy)
  }

  private showReveal(enemy: EnemySprite) {
    const def = enemy.enemyDef
    const text = this.add.text(enemy.x, enemy.y, `${def.carcCode}\nRoot: ${def.rootFaction}`, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#f0a868',
      align: 'center',
    }).setOrigin(0.5).setDepth(20)

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy(),
    })
  }

  private showDamageText(x: number, y: number, text: string, color: number) {
    const colorStr = '#' + color.toString(16).padStart(6, '0')
    const t = this.add.text(x, y, text, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: colorStr,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20)

    this.tweens.add({
      targets: t,
      y: t.y - 20,
      alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    })
  }

  private checkRoomClear() {
    if (this.roomCleared) return
    if (this.roomEnemies.every(e => !e.active)) {
      this.roomCleared = true
      this.showDoor()
      this.run.rooms[this.run.room].cleared = true
    }
  }

  private showDoor() {
    // Place door at top center
    const doorX = ROOM_W * TILE / 2
    const doorY = 2 * TILE

    for (let i = -1; i <= 1; i++) {
      this.add.image(doorX + i * TILE, doorY, 'door')
    }

    this.doorZone = this.add.zone(doorX, doorY, TILE * 3, TILE)
    this.physics.add.existing(this.doorZone, true)
    this.physics.add.overlap(this.player, this.doorZone, () => this.nextRoom(), undefined, this)

    // "Room Clear" text
    if (this.run.rooms[this.run.room].type === 'combat' || this.run.rooms[this.run.room].type === 'boss') {
      const clearText = this.add.text(ROOM_W * TILE / 2, ROOM_H * TILE / 2, 'ROOM CLEAR', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#7ee2c1',
      }).setOrigin(0.5).setDepth(20)

      this.tweens.add({
        targets: clearText,
        alpha: 0,
        delay: 1000,
        duration: 500,
        onComplete: () => clearText.destroy(),
      })
    }
  }

  private nextRoom() {
    if (this.transitioning) return
    this.transitioning = true

    this.run.room++

    if (this.run.room >= this.run.rooms.length) {
      this.run.status = 'won'
      this.scene.stop('HUD')
      this.scene.start('Summary', { run: this.run })
      return
    }

    // Update phase
    this.run.phase = this.run.rooms[this.run.room].phase

    // Offer boon between combat rooms
    const prevRoom = this.run.rooms[this.run.room - 1]
    if (prevRoom.type === 'combat' || prevRoom.type === 'boss') {
      this.scene.pause()
      this.scene.launch('Boon', {
        run: this.run,
        onComplete: () => {
          this.scene.resume()
          this.cleanAndBuild()
        },
      })
    } else {
      this.cleanAndBuild()
    }
  }

  private cleanAndBuild() {
    // Clean up current room
    this.children.removeAll()
    this.physics.world.colliders.destroy()
    this.setupGroups()
    this.player = null as any
    this.buildRoom()
  }

  private gameOver() {
    this.scene.stop('HUD')
    this.scene.start('Summary', { run: this.run })
  }

  private generateRooms(): RoomDef[] {
    const rooms: RoomDef[] = []
    const enemyIds = Object.keys(ENEMIES).filter(id => id !== 'boss_payer_audit')

    for (let phase = 0; phase < 11; phase++) {
      const numRooms = phase === 10 ? 1 : (1 + Math.floor(this.rng() * 2))
      for (let r = 0; r < numRooms; r++) {
        const isBoss = phase === 10
        const type: RoomDef['type'] = isBoss ? 'boss' : 'combat'

        let enemies: string[]
        if (isBoss) {
          enemies = ['boss_payer_audit']
        } else {
          const count = 2 + Math.floor(this.rng() * 3)
          enemies = []
          for (let i = 0; i < count; i++) {
            enemies.push(pick(enemyIds, this.rng))
          }
        }

        rooms.push({ phase, type, enemies, cleared: false })
      }
    }

    return rooms
  }
}
