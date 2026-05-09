import { defineConfig } from 'vite'
import { resolve } from 'path'

const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === 'production' ? '/the-waiting-room/' : '/')

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        // Game: the existing entry point.
        main: resolve(__dirname, 'index.html'),
        // Case Prototypes catalog: index page listing one playable
        // sketch per Case (the player-side problem solved in a
        // single encounter). Lives at /prototypes.html on GitHub
        // Pages — URL kept for link stability; visible label is
        // "Case Prototypes."
        prototypes: resolve(__dirname, 'prototypes.html'),
        // Wraith prototype: a single-encounter sketch demonstrating
        // the no-HP / no-tools / no-multiple-choice redesign. Lives
        // at /wraith-prototype.html on GitHub Pages.
        wraith: resolve(__dirname, 'wraith-prototype.html'),
        // Bundle prototype: sibling demonstrating AMEND-dominant
        // verb-space (modifier 25 on Box 24, vs. Wraith's CITE-
        // dominant). Lives at /bundle-prototype.html.
        bundle: resolve(__dirname, 'bundle-prototype.html'),
        // Reaper prototype: third sibling adding TIME PRESSURE —
        // a literal day countdown on a CO-29 timely-filing
        // waiver appeal. Lives at /reaper-prototype.html.
        reaper: resolve(__dirname, 'reaper-prototype.html'),
        // Gatekeeper prototype: fourth sibling introducing the
        // REQUEST verb — file a retroactive 278, wait for the
        // response, transcribe the auth number onto Box 23.
        // Lives at /gatekeeper-prototype.html.
        gatekeeper: resolve(__dirname, 'gatekeeper-prototype.html'),
        // Fog prototype: fifth sibling introducing the REVEAL
        // verb — pre-submission claim with fogged fields; run
        // a 270 inquiry to surface what registration got wrong;
        // amend against the 271 response. Lives at
        // /fog-prototype.html.
        fog: resolve(__dirname, 'fog-prototype.html'),
        // Hydra prototype: sixth sibling introducing the
        // SEQUENCE verb — three payers (BCBS / Medicare /
        // Medicaid), one claim. Fix the COB chain, then walk
        // it forward through three adjudications with running
        // balance. Lives at /hydra-prototype.html.
        hydra: resolve(__dirname, 'hydra-prototype.html'),
        // Swarm prototype: seventh sibling introducing the
        // BATCH verb — 18 weekend CO-16 rejections, 14 sharing
        // one root cause; fix the cluster as a group, sweep
        // the outliers, patch upstream so it stops happening.
        // First prototype that operates on a queue, not a
        // single claim. Lives at /swarm-prototype.html.
        swarm: resolve(__dirname, 'swarm-prototype.html'),
        // Specter prototype: eighth sibling introducing the
        // VARIANCE verb — an 835 ERA arrived showing four
        // claims paid; one hides an underpayment that the
        // CO-45 adjustment quietly absorbed. Detect and
        // appeal. First prototype where the input is a
        // successful payment, not a denial. Lives at
        // /specter-prototype.html.
        specter: resolve(__dirname, 'specter-prototype.html'),
        // Doppelgänger prototype: ninth sibling introducing
        // the REPLACE verb — resolve a CO-18 duplicate flag
        // by filing the resubmission as a frequency-7
        // replacement of the original ICN. First version-
        // control encounter. Lives at
        // /doppelganger-prototype.html.
        doppelganger: resolve(__dirname, 'doppelganger-prototype.html'),
        // Lighthouse prototype: tenth sibling — the patient-
        // facing release-valve. First encounter that isn't
        // a fight: charity-care screening for a patient who
        // can't pay an $87,420 bill. Verbs are LISTEN /
        // SCREEN / RELEASE; sits outside the four-district
        // verb-space. Lives at /lighthouse-prototype.html.
        lighthouse: resolve(__dirname, 'lighthouse-prototype.html'),
        // Surprise Bill Specter: eleventh sibling — the L8
        // patient-facing fight (companion to Lighthouse's
        // kindness). NSA dispute against an OON surprise
        // bill. Verbs: CLASSIFY / CALCULATE / DISPUTE.
        // Lives at /surprise-bill-prototype.html.
        surpriseBill: resolve(__dirname, 'surprise-bill-prototype.html'),
        // Audit Boss: twelfth sibling — the finale. The
        // Quarterly Audit. Defense, not offense: three
        // findings on Margaret Holloway's UB-04, each
        // resolvable as RECEIPT (defend with chart evidence)
        // or AMEND (concede + recoupment). Lives at
        // /audit-boss-prototype.html.
        auditBoss: resolve(__dirname, 'audit-boss-prototype.html'),
        // Map editor: a dev-only authoring tool for level1's object
        // placement and orientation. Click any object to select it,
        // then rotate/flip via keyboard or drag to move. Outputs a
        // tileMeta + tileOverrides snippet to paste back into
        // src/content/maps/level1.ts. Lives at /map-editor.html.
        mapEditor: resolve(__dirname, 'map-editor.html'),
        // Intro editor: beat-by-beat browser, voiceover scrubber,
        // and live edit/export for src/scenes/introBeats.ts.
        // "Open game at this beat" deep-links to /?introBeat=N
        // (BootScene reads the URL param and forwards to IntroScene).
        // Lives at /intro-editor.html.
        introEditor: resolve(__dirname, 'intro-editor.html'),
        // Dev tools index — single page that links every authoring +
        // diagnostic page in one place. Bookmark this. Lives at
        // /dev.html on GitHub Pages.
        dev: resolve(__dirname, 'dev.html'),
      },
      output: {
        // Pull Phaser into its own vendor chunk. The framework is the
        // bulk of the bundle (~1.3 MB) and never changes between
        // deploys, so an immutable filename means returning visitors
        // re-use the cached copy and only re-download the much smaller
        // game-logic chunk when we ship updates.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser'
        },
      },
    },
    // Bumped explicitly because phaser is a known-large vendor chunk;
    // we don't want the > 500 kB warning on every build.
    chunkSizeWarningLimit: 1500,
  },
})
