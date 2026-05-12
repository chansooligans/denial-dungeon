// Safe finisher for "fade then destroy" sound tweens.
//
// The naive pattern —
//
//   this.tweens.add({
//     targets: sound, volume: 0, duration: 1200,
//     onComplete: () => { sound.stop(); sound.destroy() },
//   })
//
// — crashes intermittently with "Cannot set properties of null
// (setting 'volume')" whenever a *different* tween still targets the
// same Sound after destroy. The most common source: a tween created
// in a scene that gets put to sleep mid-fade (descent to WR/puzzle),
// frozen with the scene, then resumed after wake — by which point
// destroy() has already nulled the sound's `currentConfig` and the
// resumed tween's next setProperty hits a null setter.
//
// Phaser's `scene.tweens.killTweensOf(target)` only sweeps the
// caller's TweenManager; cross-scene leftovers slip through. This
// helper iterates *every* scene's TweenManager and kills any tween
// targeting the sound, then performs the stop + destroy. Safe to
// call from inside one of those tweens' onComplete — killTweensOf
// is a no-op on the tween that's already firing its onComplete.

import type Phaser from 'phaser'

export function safeFinishSoundTween(
  game: Phaser.Game,
  sound: Phaser.Sound.BaseSound,
) {
  try { sound.stop() } catch { /* already stopped */ }
  // Sweep every scene — sound is global, but the tweens that
  // animated it could be on any scene's TweenManager.
  for (const scene of game.scene.scenes) {
    const tm = (scene as Phaser.Scene).tweens
    if (tm && typeof tm.killTweensOf === 'function') {
      try { tm.killTweensOf(sound) } catch { /* scene's tween mgr already torn down */ }
    }
  }
  try { sound.destroy() } catch { /* already destroyed */ }
}
