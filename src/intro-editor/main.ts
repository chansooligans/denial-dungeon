// Intro editor — beat-by-beat browser, audio scrubber, and live
// edit/export for the cinematic in src/scenes/introBeats.ts.
//
// What it gives you:
//   - Linear timeline of all beats with type/text/key at a glance,
//     plus a running "voiceover index" so you can see which MP3
//     each text/voice-cover beat is bound to.
//   - Per-beat audio playback for the voiceover MP3s (no need to
//     run the cinematic to listen to a single line).
//   - Per-beat edit form: text lines, color, duration, silent/voice
//     flags. Changes update the in-memory copy and the export
//     pane updates live; nothing is written to disk until you
//     paste the snippet back into introBeats.ts yourself.
//   - "Open game at this beat" button — opens /index.html with
//     ?introBeat=N so the running cinematic deep-links straight in.
//   - Cover thumbnails for cover/backdrop beats.
//
// What it does NOT do:
//   - Render the procedural scenes (Phaser is not loaded here). Use
//     the deep-link button to test those in the actual game.
//   - Reorder beats. The TS array source order is canonical.
//
// Save flow: click "Copy export" → paste into the BEATS = [...]
// declaration in src/scenes/introBeats.ts. The editor preserves
// trailing commas and indentation to mirror the existing style.

import { BEATS, type Beat, type SceneActionId } from '../scenes/introBeats'

// All cover/backdrop comic-page images currently shipped with the
// game. Hardcoded because browsers can't list `/public/intro/`
// directly. If a new page is added, append it here AND make sure
// BootScene preloads it under the same key.
const INTRO_IMAGES: { key: string; path: string }[] = [
  { key: 'intro_cover', path: '/intro/cover.png' },
  { key: 'intro_page5', path: '/intro/page5.png' },
  { key: 'intro_page6', path: '/intro/page6.png' },
  { key: 'intro_page7', path: '/intro/page7.jpg' },
  { key: 'intro_page8', path: '/intro/page8.jpg' },
]
function pathForKey(key: string): string | undefined {
  return INTRO_IMAGES.find(i => i.key === key)?.path
}

/** Local-only image overrides — when the user drops a new file onto
 *  the preview we stash a data URL here keyed by the texture key. The
 *  editor swaps in the override for previews so authors can see the
 *  new art in context, but the file isn't persisted until the user
 *  clicks "Download" and saves it into public/intro/. */
const imageOverrides = new Map<string, string>()

// Working copy that the UI mutates. Cloned from BEATS so undo means
// "reload the page". Cheap and tracks intent — this is a draft tool.
const beats: Beat[] = BEATS.map(b => ({
  ...b,
  lines: b.lines ? [...b.lines] : undefined,
}))

let selectedIdx = 0

// ===== Voice index ========================================================

/** Index 0..N-1 in the voiceover MP3 sequence for each beat that
 *  triggers playBeatVoice(): every 'text' beat, plus 'cover' beats
 *  flagged with `voice: true`. -1 for beats that don't trigger VO. */
function computeVoiceIndex(): number[] {
  const out: number[] = []
  let counter = 0
  for (const b of beats) {
    if (b.type === 'text') {
      counter += 1
      out.push(counter)
    } else if (b.type === 'cover' && b.voice) {
      counter += 1
      out.push(counter)
    } else {
      out.push(-1)
    }
  }
  return out
}

// ===== DOM refs ===========================================================

const timelineEl = document.getElementById('timeline') as HTMLDivElement
const editorEl = document.getElementById('editor') as HTMLDivElement
const exportEl = document.getElementById('export') as HTMLTextAreaElement
const summaryEl = document.getElementById('summary') as HTMLDivElement
const audioEl = document.getElementById('voice-audio') as HTMLAudioElement

// ===== Rendering ==========================================================

function render() {
  renderTimeline()
  renderEditor()
  renderExport()
  renderSummary()
}

function renderTimeline() {
  const voiceIdx = computeVoiceIndex()
  timelineEl.innerHTML = ''
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i]
    const card = document.createElement('div')
    card.className = `beat beat-${b.type}` + (i === selectedIdx ? ' selected' : '')
    card.dataset.idx = String(i)

    const head = document.createElement('div')
    head.className = 'beat-head'
    head.innerHTML =
      `<span class="idx">#${i}</span>` +
      `<span class="type">${b.type}</span>` +
      (voiceIdx[i] > 0
        ? `<span class="voice">VO ${String(voiceIdx[i]).padStart(2, '0')}</span>`
        : '') +
      (b.silent ? '<span class="flag">silent</span>' : '')
    card.appendChild(head)

    const body = document.createElement('div')
    body.className = 'beat-body'
    body.innerHTML = describeBeat(b)
    card.appendChild(body)

    card.addEventListener('click', () => {
      selectedIdx = i
      render()
      // Auto-load the matching voiceover so the Play button is ready.
      const v = voiceIdx[i]
      if (v > 0) {
        audioEl.src = `/audio/intro/${String(v).padStart(2, '0')}.mp3`
      } else {
        audioEl.removeAttribute('src')
      }
    })
    timelineEl.appendChild(card)
  }
}

function describeBeat(b: Beat): string {
  if (b.type === 'text') {
    const lines = (b.lines ?? []).map(escapeHTML).join('<br />')
    const swatch = b.color ? `<span class="swatch" style="background:${b.color}"></span>` : ''
    return `${swatch}<div class="text-preview">${lines || '<em>(empty)</em>'}</div>`
  }
  if (b.type === 'wait') {
    return `<span class="meta">duration ${b.duration ?? 0}ms</span>`
  }
  if (b.type === 'scene') {
    return `<span class="meta">action: <code>${b.actionId ?? '—'}()</code></span>`
  }
  if (b.type === 'cover' || b.type === 'backdrop') {
    const src = b.key
      ? imageOverrides.get(b.key) ?? pathForKey(b.key)
      : undefined
    const thumb = src ? `<img class="thumb" src="${src}" />` : ''
    return thumb +
      `<span class="meta">key: <code>${b.key}</code>${
        b.duration !== undefined ? ` · ${b.duration}ms` : ''
      }${b.voice ? ' · voice' : ''}${
        b.alpha !== undefined ? ` · α ${b.alpha}` : ''
      }${imageOverrides.has(b.key ?? '') ? ' · <span class="override">overridden</span>' : ''}</span>`
  }
  if (b.type === 'title') return '<span class="meta">→ Title scene</span>'
  return ''
}

function renderEditor() {
  const b = beats[selectedIdx]
  if (!b) {
    editorEl.innerHTML = '<p class="placeholder">No beat selected.</p>'
    return
  }
  const voiceIdx = computeVoiceIndex()[selectedIdx]
  let html = `<h2>Beat #${selectedIdx} — ${b.type}</h2>`

  if (voiceIdx > 0) {
    html += `<div class="vo-row">` +
            `<button id="vo-play">▶ Play VO ${String(voiceIdx).padStart(2, '0')}</button>` +
            `<button id="vo-stop">■ Stop</button>` +
            `</div>`
  }

  html += `<button id="open-game">↗ Open game at this beat</button>`

  if (b.type === 'text') {
    html += `<label>Lines (one per line)</label>` +
            `<textarea id="f-lines" rows="6" spellcheck="false">${escapeHTML((b.lines ?? []).join('\n'))}</textarea>` +
            `<label>Color (hex)</label>` +
            `<input id="f-color" type="text" value="${escapeAttr(b.color ?? '#e6edf3')}" />` +
            `<label><input id="f-silent" type="checkbox" ${b.silent ? 'checked' : ''} /> silent (play VO without showing typed text)</label>` +
            `<label>Concurrent scene action (optional)</label>` +
            sceneActionSelect(b.sceneActionId, 'f-sceneAction')
  } else if (b.type === 'wait') {
    html += `<label>Duration (ms)</label>` +
            `<input id="f-duration" type="number" min="0" step="50" value="${b.duration ?? 0}" />`
  } else if (b.type === 'scene') {
    html += `<label>Scene action</label>` +
            sceneActionSelect(b.actionId, 'f-action')
  } else if (b.type === 'cover' || b.type === 'backdrop') {
    const currentSrc = b.key
      ? imageOverrides.get(b.key) ?? pathForKey(b.key)
      : undefined
    const overridden = b.key ? imageOverrides.has(b.key) : false

    html += `<label>Background art</label>` +
      `<div id="bg-preview-wrap" class="bg-preview-wrap">` +
        (currentSrc
          ? `<img id="bg-preview" src="${currentSrc}" />`
          : `<div class="bg-empty">no key set</div>`) +
        `<div class="drop-hint">Drop an image here to replace this background.</div>` +
      `</div>` +
      (overridden
        ? `<div class="override-row">` +
            `<span class="override">▲ replaced locally</span> ` +
            `<button id="bg-download" type="button">Download as ${b.key}…</button> ` +
            `<button id="bg-revert" type="button">Revert</button>` +
          `</div>`
        : '') +
      `<label>Pick from library</label>` +
      `<div class="bg-gallery">` +
        INTRO_IMAGES.map(img => {
          const src = imageOverrides.get(img.key) ?? img.path
          const sel = img.key === b.key ? ' selected' : ''
          return `<div class="bg-card${sel}" data-key="${escapeAttr(img.key)}">` +
            `<img src="${src}" />` +
            `<div class="bg-label">${img.key}</div>` +
            `</div>`
        }).join('') +
      `</div>` +
      `<label>Texture key (advanced — must match a BootScene preload)</label>` +
      `<input id="f-key" type="text" value="${escapeAttr(b.key ?? '')}" />`
    if (b.type === 'cover') {
      html += `<label>Duration (ms)</label>` +
              `<input id="f-duration" type="number" min="0" step="100" value="${b.duration ?? 0}" />` +
              `<label><input id="f-voice" type="checkbox" ${b.voice ? 'checked' : ''} /> voice (fire next VO MP3 when cover mounts)</label>`
    } else {
      html += `<label>Alpha (0..1)</label>` +
              `<input id="f-alpha" type="number" min="0" max="1" step="0.05" value="${b.alpha ?? 0.35}" />`
    }
  } else if (b.type === 'title') {
    html += `<p class="placeholder">Title beat — no editable fields.</p>`
  }

  editorEl.innerHTML = html
  wireEditorInputs()
}

function sceneActionSelect(current: SceneActionId | undefined, id: string): string {
  const ids: SceneActionId[] = [
    'showHospitalPan', 'showDesk', 'showClaimVanish',
    'showFall', 'showGap', 'showWaitingRoom',
  ]
  return `<select id="${id}">` +
    `<option value="">— none —</option>` +
    ids.map(a => `<option value="${a}"${a === current ? ' selected' : ''}>${a}</option>`).join('') +
    `</select>`
}

function wireEditorInputs() {
  const b = beats[selectedIdx]
  if (!b) return

  const onText = (id: string, fn: (v: string) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null
    if (el) el.addEventListener('input', () => fn(el.value))
  }
  const onCheck = (id: string, fn: (v: boolean) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | null
    if (el) el.addEventListener('change', () => fn(el.checked))
  }
  const onSelect = (id: string, fn: (v: string) => void) => {
    const el = document.getElementById(id) as HTMLSelectElement | null
    if (el) el.addEventListener('change', () => fn(el.value))
  }

  onText('f-lines', v => {
    b.lines = v.split('\n')
    renderTimeline(); renderExport()
  })
  onText('f-color', v => { b.color = v; renderTimeline(); renderExport() })
  onCheck('f-silent', v => { b.silent = v || undefined; renderTimeline(); renderExport() })
  onText('f-duration', v => { b.duration = Number(v) || 0; renderTimeline(); renderExport() })
  onText('f-key', v => { b.key = v; renderTimeline(); renderExport() })
  onCheck('f-voice', v => { b.voice = v || undefined; renderTimeline(); renderExport() })
  onText('f-alpha', v => { b.alpha = Number(v); renderTimeline(); renderExport() })
  onSelect('f-action', v => { b.actionId = (v || undefined) as SceneActionId | undefined; renderTimeline(); renderExport() })
  onSelect('f-sceneAction', v => { b.sceneActionId = (v || undefined) as SceneActionId | undefined; renderTimeline(); renderExport() })

  // ---- Background-art controls (cover / backdrop beats) ----------------

  // Gallery click — switch this beat to point at another existing key.
  for (const card of editorEl.querySelectorAll('.bg-card')) {
    card.addEventListener('click', () => {
      const key = (card as HTMLElement).dataset.key
      if (!key) return
      b.key = key
      render()
    })
  }

  // Drag-and-drop: dropping an image onto the preview swaps in a
  // local data-URL override. Persisted only for this session — the
  // user has to download + replace the file in /public/intro/ to
  // make it stick across reloads.
  const wrap = document.getElementById('bg-preview-wrap')
  if (wrap) {
    const stop = (e: Event) => { e.preventDefault(); e.stopPropagation() }
    wrap.addEventListener('dragover', e => { stop(e); wrap.classList.add('dragging') })
    wrap.addEventListener('dragleave', e => { stop(e); wrap.classList.remove('dragging') })
    wrap.addEventListener('drop', e => {
      stop(e)
      wrap.classList.remove('dragging')
      const file = (e as DragEvent).dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      if (!b.key) return
      const reader = new FileReader()
      reader.onload = () => {
        imageOverrides.set(b.key!, reader.result as string)
        render()
      }
      reader.readAsDataURL(file)
    })
  }

  document.getElementById('bg-download')?.addEventListener('click', () => {
    if (!b.key) return
    const dataURL = imageOverrides.get(b.key)
    if (!dataURL) return
    // Pull the original file extension from INTRO_IMAGES so we
    // suggest a filename that matches whatever's currently in
    // /public/intro/ (page7/page8 are JPEG, others PNG).
    const orig = pathForKey(b.key) ?? `/intro/${b.key.replace(/^intro_/, '')}.png`
    const filename = orig.replace(/^.*\//, '')
    const a = document.createElement('a')
    a.href = dataURL
    a.download = filename
    a.click()
  })

  document.getElementById('bg-revert')?.addEventListener('click', () => {
    if (!b.key) return
    imageOverrides.delete(b.key)
    render()
  })

  document.getElementById('vo-play')?.addEventListener('click', () => {
    if (audioEl.src) { audioEl.currentTime = 0; audioEl.play() }
  })
  document.getElementById('vo-stop')?.addEventListener('click', () => {
    audioEl.pause(); audioEl.currentTime = 0
  })
  document.getElementById('open-game')?.addEventListener('click', () => {
    // The game's BootScene reads ?introBeat=N from the URL and passes
    // it to scene.start('Intro', { skipToBeat: N }).
    window.open(`/?introBeat=${selectedIdx}`, '_blank')
  })
}

function renderSummary() {
  const total = beats.length
  const text = beats.filter(b => b.type === 'text').length
  const totalMs = beats.reduce((sum, b) => {
    if (b.type === 'wait' || b.type === 'cover') return sum + (b.duration ?? 0)
    if (b.type === 'text') return sum + 1500 // rough avg typing time, no audio knowledge
    return sum
  }, 0)
  summaryEl.textContent =
    `${total} beats · ${text} text/VO · ~${(totalMs / 1000).toFixed(1)}s minimum runtime ` +
    `(actual longer — VO durations extend wait beats)`
}

// ===== Export =============================================================

function renderExport() {
  const lines: string[] = []
  lines.push('// Paste into src/scenes/introBeats.ts replacing the BEATS array body.')
  lines.push('export const BEATS: Beat[] = [')
  for (const b of beats) {
    lines.push('  ' + serializeBeat(b) + ',')
  }
  lines.push(']')
  exportEl.value = lines.join('\n')
}

function serializeBeat(b: Beat): string {
  // Compact representation matching the hand-authored style — type
  // first, then any populated fields. Strings escape with single
  // quotes since the source file uses single-quoted strings.
  const parts: string[] = [`type: '${b.type}'`]
  if (b.lines !== undefined) {
    parts.push(`lines: [${b.lines.map(s => `'${esc(s)}'`).join(', ')}]`)
  }
  if (b.color !== undefined) parts.push(`color: '${esc(b.color)}'`)
  if (b.duration !== undefined) parts.push(`duration: ${b.duration}`)
  if (b.actionId !== undefined) parts.push(`actionId: '${b.actionId}'`)
  if (b.sceneActionId !== undefined) parts.push(`sceneActionId: '${b.sceneActionId}'`)
  if (b.key !== undefined) parts.push(`key: '${esc(b.key)}'`)
  if (b.alpha !== undefined) parts.push(`alpha: ${b.alpha}`)
  if (b.silent) parts.push('silent: true')
  if (b.voice) parts.push('voice: true')
  return `{ ${parts.join(', ')} }`
}

// ===== Helpers ============================================================

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(s: string): string {
  return escapeHTML(s).replace(/"/g, '&quot;')
}

document.getElementById('copy-export')?.addEventListener('click', () => {
  exportEl.removeAttribute('readonly')
  exportEl.select()
  document.execCommand('copy')
  exportEl.setAttribute('readonly', 'true')
})

render()
