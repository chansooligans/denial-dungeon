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
        // Prototype catalog: index page listing the encounter-
        // redesign prototypes. Lives at /prototypes.html on
        // GitHub Pages.
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
